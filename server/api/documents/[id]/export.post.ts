import { createError, defineEventHandler, readBody, setHeader } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { getDocumentWithAccess, getDocumentWithAccessDb } from '~/server/utils/documents';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import { convertTiptapToHtml, generatePdfFromHtml, injectExportStyles, convertTiptapToDocx, convertTiptapToMarkdown } from '~/server/utils/export';
import { logActivity } from '~/server/utils/activity';
import type { ExportFormat, ExportOptions, DocumentContent } from '~/types/domain';

interface ExportRequest {
  format: ExportFormat;
  options?: ExportOptions;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const documentId = event.context.params?.id;

  if (!documentId) {
    throw createError({ statusCode: 400, statusMessage: 'Document id is required.' });
  }

  // Parse request body
  let body: ExportRequest;
  try {
    body = await readBody(event);
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' });
  }

  const { format, options = {} } = body;

  // Validate format
  if (!format || !['pdf', 'docx', 'markdown'].includes(format)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid export format. Must be pdf, docx, or markdown.' });
  }

  let document;
  let content: DocumentContent | undefined;
  let user;

  if (useDb) {
    // Supabase mode: use database
    user = await getCurrentUserDb(event);
    document = await getDocumentWithAccessDb(documentId, user.id, 'viewer');
    content = await db.documentContent.get(documentId);
  } else {
    // Local mode: use store
    user = await getCurrentUser(event);
    document = getDocumentWithAccess(documentId, user.id, 'viewer');
    const store = getStore();
    content = store.document_content.find((item) => item.document_id === documentId);
  }

  // Get document content or default empty content
  const documentJson = content?.last_snapshot || {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }]
  };

  let buffer: Buffer;
  let contentType: string;
  let fileExtension: string;

  try {
    switch (format) {
      case 'pdf': {
        // Convert to HTML, inject styles, generate PDF
        const html = convertTiptapToHtml(documentJson as any, options);
        const styledHtml = injectExportStyles(html, options);
        buffer = await generatePdfFromHtml(styledHtml, options);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      }

      case 'docx': {
        // Convert to DOCX
        buffer = await convertTiptapToDocx(documentJson as any, options);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;
      }

      case 'markdown': {
        // Convert to Markdown
        const markdown = convertTiptapToMarkdown(documentJson as any, options);
        buffer = Buffer.from(markdown, 'utf-8');
        contentType = 'text/markdown';
        fileExtension = 'md';
        break;
      }

      default:
        throw createError({ statusCode: 400, statusMessage: 'Unsupported export format.' });
    }
  } catch (error) {
    console.error('Export error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Export failed. Please try again.',
    });
  }

  // Log export activity
  try {
    if (useDb) {
      await logActivity({
        org_id: document.org_id || '',
        project_id: document.project_id,
        actor_id: user.id,
        actor_type: 'user',
        action: 'document_exported',
        target_type: 'document',
        target_id: documentId,
        metadata: {
          format,
          options,
          document_title: document.title,
        },
      });
    } else {
      const store = getStore();
      const orgMember = store.org_members.find(om => om.user_id === user.id);
      if (orgMember) {
        await logActivity({
          org_id: orgMember.org_id,
          project_id: document.project_id,
          actor_id: user.id,
          actor_type: 'user',
          action: 'document_exported',
          target_type: 'document',
          target_id: documentId,
          metadata: {
            format,
            options,
            document_title: document.title,
          },
        });
      }
    }
  } catch (error) {
    // Log error but don't fail the export
    console.error('Activity logging error:', error);
  }

  // Set response headers for file download
  const filename = `${document.title.replace(/[^a-z0-9]/gi, '_')}.${fileExtension}`;
  setHeader(event, 'Content-Type', contentType);
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
  setHeader(event, 'Content-Length', buffer.length.toString());

  return buffer;
});
