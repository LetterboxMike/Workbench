import { createError, defineEventHandler, readMultipartFormData, getQuery } from 'h3';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
    assertProjectAccess,
    assertProjectAccessDb,
    getCurrentUser,
    getCurrentUserDb,
    useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { createId, nowIso } from '~/server/utils/id';
import { logActivityLocal, logActivityDb } from '~/server/utils/activity';
import { assertCanUploadFileAuto, recordUploadUsageAuto } from '~/server/utils/billing';
import type { ProjectFile, FileAttachmentType } from '~/types/domain';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav'
];

export default defineEventHandler(async (event) => {
    const useDb = useDbAuth();
    const projectId = event.context.params?.pid;

    if (!projectId) {
        throw createError({ statusCode: 400, statusMessage: 'Project ID is required.' });
    }

    let userId: string;
    let orgId: string;

    if (useDb) {
        const user = await getCurrentUserDb(event);
        userId = user.id;
        await assertProjectAccessDb(projectId, userId, 'editor');
        // Get org from project
        const store = getStore();
        const project = store.projects.find(p => p.id === projectId);
        orgId = project?.org_id || '';
    } else {
        const user = await getCurrentUser(event);
        userId = user.id;
        assertProjectAccess(projectId, userId, 'editor');
        const store = getStore();
        const project = store.projects.find(p => p.id === projectId);
        orgId = project?.org_id || '';
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'No file provided.' });
    }

    const file = formData.find((item) => item.name === 'file');
    const attachmentTypeField = formData.find((item) => item.name === 'attachment_type');
    const attachmentIdField = formData.find((item) => item.name === 'attachment_id');
    const descriptionField = formData.find((item) => item.name === 'description');

    if (!file || !file.data) {
        throw createError({ statusCode: 400, statusMessage: 'No file provided.' });
    }

    // Validate file size
    if (file.data.length > MAX_FILE_SIZE) {
        throw createError({ statusCode: 400, statusMessage: 'File size exceeds 25MB limit.' });
    }

    // Validate MIME type
    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw createError({ statusCode: 400, statusMessage: `File type "${mimeType}" not allowed.` });
    }

    await assertCanUploadFileAuto(orgId, useDb, file.data.length);

    // Parse attachment info
    const attachmentType: FileAttachmentType = (attachmentTypeField?.data?.toString() as FileAttachmentType) || 'project';
    const attachmentId = attachmentIdField?.data?.toString() || null;
    const description = descriptionField?.data?.toString() || null;

    // Generate unique filename
    const originalFilename = file.filename || 'file';
    const ext = originalFilename.split('.').pop() || '';
    const uniqueFilename = `${createId()}.${ext}`;
    const filePath = join(UPLOAD_DIR, uniqueFilename);

    // Save file to disk
    await writeFile(filePath, file.data);
    await recordUploadUsageAuto(orgId, useDb, file.data.length);

    // Create file record
    const projectFile: ProjectFile = {
        id: createId(),
        project_id: projectId,
        attachment_type: attachmentType,
        attachment_id: attachmentId,
        filename: uniqueFilename,
        original_filename: originalFilename,
        mime_type: mimeType,
        size_bytes: file.data.length,
        url: `/uploads/${uniqueFilename}`,
        uploaded_by: userId,
        created_at: nowIso(),
        description
    };

    // Store file record
    const store = getStore();
    store.project_files.push(projectFile);

    // Log activity
    if (useDb) {
        await logActivityDb({
            orgId,
            projectId,
            actorId: userId,
            actorType: 'user',
            action: 'uploaded',
            targetType: 'file',
            targetId: projectFile.id,
            metadata: {
                filename: originalFilename,
                size: file.data.length,
                attachment_type: attachmentType
            }
        });
    } else {
        logActivityLocal({
            orgId,
            projectId,
            actorId: userId,
            actorType: 'user',
            action: 'uploaded',
            targetType: 'file',
            targetId: projectFile.id,
            metadata: {
                filename: originalFilename,
                size: file.data.length,
                attachment_type: attachmentType
            }
        });
    }

    return { data: projectFile };
});
