import { createError, defineEventHandler } from 'h3';
import { unlink } from 'node:fs/promises';
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
import { logActivityLocal, logActivityDb } from '~/server/utils/activity';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

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

    const file = store.project_files[fileIndex];
    const filename = file.original_filename;

    // Delete file from disk
    const filePath = join(UPLOAD_DIR, file.filename);
    if (existsSync(filePath)) {
        try {
            await unlink(filePath);
        } catch (err) {
            console.error('Failed to delete file from disk:', err);
        }
    }

    // Remove from store
    store.project_files.splice(fileIndex, 1);

    // Log activity
    if (useDb) {
        await logActivityDb({
            orgId,
            projectId,
            actorId: userId,
            actorType: 'user',
            action: 'deleted',
            targetType: 'file',
            targetId: fileId,
            metadata: { filename }
        });
    } else {
        logActivityLocal({
            orgId,
            projectId,
            actorId: userId,
            actorType: 'user',
            action: 'deleted',
            targetType: 'file',
            targetId: fileId,
            metadata: { filename }
        });
    }

    return { success: true };
});
