import { createError, defineEventHandler, readBody } from 'h3';
import {
    assertProjectAccess,
    assertProjectAccessDb,
    getCurrentUser,
    getCurrentUserDb,
    useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { nowIso } from '~/server/utils/id';
import { logActivityLocal, logActivityDb } from '~/server/utils/activity';
import type { FileAttachmentType } from '~/types/domain';

export default defineEventHandler(async (event) => {
    const useDb = useDbAuth();
    const projectId = event.context.params?.pid;
    const fileId = event.context.params?.fileId;

    if (!projectId) {
        throw createError({ statusCode: 400, statusMessage: 'Project ID is required.' });
    }

    if (!fileId) {
        throw createError({ statusCode: 400, statusMessage: 'File ID is required.' });
    }

    let userId: string;
    let orgId: string;

    if (useDb) {
        const user = await getCurrentUserDb(event);
        userId = user.id;
        await assertProjectAccessDb(projectId, userId, 'editor');
    } else {
        const user = await getCurrentUser(event);
        userId = user.id;
        assertProjectAccess(projectId, userId, 'editor');
    }

    const store = getStore();
    const fileIndex = store.project_files.findIndex((f) => f.id === fileId && f.project_id === projectId);

    if (fileIndex === -1) {
        throw createError({ statusCode: 404, statusMessage: 'File not found.' });
    }

    const project = store.projects.find((p) => p.id === projectId);
    orgId = project?.org_id || '';

    const body = await readBody(event);
    const file = store.project_files[fileIndex];

    // Update allowed fields
    if (body.description !== undefined) {
        file.description = body.description;
    }
    if (body.attachment_type !== undefined) {
        file.attachment_type = body.attachment_type as FileAttachmentType;
    }
    if (body.attachment_id !== undefined) {
        file.attachment_id = body.attachment_id;
    }

    // Log activity
    if (useDb) {
        await logActivityDb({
            orgId,
            projectId,
            actorId: userId,
            actorType: 'user',
            action: 'updated',
            targetType: 'file',
            targetId: fileId,
            metadata: { filename: file.original_filename }
        });
    } else {
        logActivityLocal({
            orgId,
            projectId,
            actorId: userId,
            actorType: 'user',
            action: 'updated',
            targetType: 'file',
            targetId: fileId,
            metadata: { filename: file.original_filename }
        });
    }

    return { data: file };
});
