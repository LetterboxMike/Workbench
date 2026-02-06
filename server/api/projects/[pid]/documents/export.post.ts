import { createError, defineEventHandler, readBody, setHeader } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth, assertProjectAccess, assertProjectAccessDb } from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import { convertTiptapToHtml, generatePdfFromHtml, injectExportStyles, convertTiptapToDocx, convertTiptapToMarkdown } from '~/server/utils/export';
import { logActivity } from '~/server/utils/activity';
import archiver from 'archiver';
import type { ExportFormat, ExportOptions, DocumentContent } from '~/types/domain';
import { Readable } from 'stream';

interface BatchExportRequest {
  documentIds: string[];
  format: ExportFormat;
  options?: ExportOptions;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  // Parse request body
  let body: BatchExportRequest;
  try {
    body = await readBody(event);
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' });
  }

  const { documentIds, format, options = {} } = body;

  // Validate inputs
  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Document IDs array is required.' });
  }

  if (documentIds.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot export more than 50 documents at once.' });
  }

  if (!format || !['pdf', 'docx', 'markdown'].includes(format)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid export format. Must be pdf, docx, or markdown.' });
  }

  let user;

  if (useDb) {
    user = await getCurrentUserDb(event);
    await assertProjectAccessDb(projectId, user.id, 'viewer');
  } else {
    user = await getCurrentUser(event);
    assertProjectAccess(projectId, user.id, 'viewer');
  }

  // Get file extension
  const getFileExtension = (fmt: ExportFormat): string => {
    switch (fmt) {
      case 'pdf': return 'pdf';
      case 'docx': return 'docx';
      case 'markdown': return 'md';
      default: return 'pdf';
    }
  };

  const getContentType = (fmt: ExportFormat): string => {
    switch (fmt) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'markdown': return 'text/markdown';
      default: return 'application/pdf';
    }
  };

  // Create ZIP archive
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  // Handle errors
  archive.on('error', (err) => {
    console.error('Archive error:', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to create archive.' });
  });

  // Set response headers
  const timestamp = new Date().toISOString().split('T')[0];
  setHeader(event, 'Content-Type', 'application/zip');
  setHeader(event, 'Content-Disposition', `attachment; filename="documents-${timestamp}.zip"`);

  // Start streaming the ZIP
  const passThrough = new Readable({
    read() {}
  });

  archive.pipe(passThrough as any);

  // Process each document
  const exportPromises = documentIds.map(async (documentId) => {
    try {
      let document;
      let content: DocumentContent | undefined;

      if (useDb) {
        // Get document and verify access
        const docs = await db.documents.list(projectId, false);
        document = docs.find(d => d.id === documentId);

        if (!document) {
          console.error(`Document ${documentId} not found in project ${projectId}`);
          return;
        }

        content = await db.documentContent.get(documentId);
      } else {
        const store = getStore();
        document = store.documents.find(d => d.id === documentId && d.project_id === projectId);

        if (!document) {
          console.error(`Document ${documentId} not found in project ${projectId}`);
          return;
        }

        content = store.document_content.find((item) => item.document_id === documentId);
      }

      // Get document content or default empty content
      const documentJson = content?.last_snapshot || {
        type: 'doc',
        content: [{ type: 'paragraph', content: [] }]
      };

      let buffer: Buffer;

      // Convert based on format
      switch (format) {
        case 'pdf': {
          const html = convertTiptapToHtml(documentJson as any, options);
          const styledHtml = injectExportStyles(html, options);
          buffer = await generatePdfFromHtml(styledHtml, options);
          break;
        }

        case 'docx': {
          buffer = await convertTiptapToDocx(documentJson as any, options);
          break;
        }

        case 'markdown': {
          const markdown = convertTiptapToMarkdown(documentJson as any, options);
          buffer = Buffer.from(markdown, 'utf-8');
          break;
        }

        default:
          throw new Error('Unsupported export format.');
      }

      // Add to archive with sanitized filename
      const sanitizedTitle = document.title.replace(/[^a-z0-9]/gi, '_');
      const filename = `${sanitizedTitle}.${getFileExtension(format)}`;
      archive.append(buffer, { name: filename });

    } catch (error) {
      console.error(`Error exporting document ${documentId}:`, error);
      // Continue with other documents even if one fails
    }
  });

  // Wait for all exports to complete
  await Promise.all(exportPromises);

  // Finalize the archive
  await archive.finalize();

  // Log batch export activity
  try {
    if (useDb) {
      const project = await db.projects.get(projectId);
      if (project) {
        await logActivity({
          org_id: project.org_id,
          project_id: projectId,
          actor_id: user.id,
          actor_type: 'user',
          action: 'documents_batch_exported',
          target_type: 'project',
          target_id: projectId,
          metadata: {
            format,
            document_count: documentIds.length,
            options,
          },
        });
      }
    } else {
      const store = getStore();
      const project = store.projects.find(p => p.id === projectId);
      if (project) {
        await logActivity({
          org_id: project.org_id,
          project_id: projectId,
          actor_id: user.id,
          actor_type: 'user',
          action: 'documents_batch_exported',
          target_type: 'project',
          target_id: projectId,
          metadata: {
            format,
            document_count: documentIds.length,
            options,
          },
        });
      }
    }
  } catch (error) {
    console.error('Activity logging error:', error);
  }

  return passThrough;
});
