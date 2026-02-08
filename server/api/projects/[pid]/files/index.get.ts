import { createError, defineEventHandler, getQuery } from 'h3';
import {
    assertProjectAccess,
    assertProjectAccessDb,
    getCurrentUser,
    getCurrentUserDb,
    useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import type { ProjectFile, FileAttachmentType } from '~/types/domain';

export default defineEventHandler(async (event) => {
    const useDb = useDbAuth();
    const projectId = event.context.params?.pid;

    if (!projectId) {
        throw createError({ statusCode: 400, statusMessage: 'Project ID is required.' });
    }

    if (useDb) {
        const user = await getCurrentUserDb(event);
        await assertProjectAccessDb(projectId, user.id, 'viewer');
    } else {
        const user = await getCurrentUser(event);
        assertProjectAccess(projectId, user.id, 'viewer');
    }

    const query = getQuery(event);
    const attachmentType = query.attachment_type as FileAttachmentType | undefined;
    const attachmentId = query.attachment_id as string | undefined;

    const store = getStore();

    let files = store.project_files.filter((f) => f.project_id === projectId);

    // Filter by attachment type if specified
    if (attachmentType) {
        files = files.filter((f) => f.attachment_type === attachmentType);
    }

    // Filter by attachment ID if specified
    if (attachmentId) {
        files = files.filter((f) => f.attachment_id === attachmentId);
    }

    // Sort by created_at descending (newest first)
    files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Enrich with uploader info
    const enrichedFiles = files.map((file) => {
        const uploader = store.users.find((u) => u.id === file.uploaded_by);
        return {
            ...file,
            uploader: uploader ? { id: uploader.id, name: uploader.name, avatar_url: uploader.avatar_url } : null
        };
    });

    return { data: enrichedFiles };
});
