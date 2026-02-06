import { createError, defineEventHandler, readMultipartFormData } from 'h3';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { createId } from '~/server/utils/id';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();

  // Authenticate user
  if (useDb) {
    await getCurrentUserDb(event);
  } else {
    await getCurrentUser(event);
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

  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided.' });
  }

  // Validate file size
  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'File size exceeds 10MB limit.' });
  }

  // Validate MIME type
  const mimeType = file.type || '';
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw createError({ statusCode: 400, statusMessage: 'File type not allowed.' });
  }

  // Generate unique filename
  const originalName = file.filename || 'file';
  const ext = originalName.split('.').pop() || '';
  const uniqueName = `${createId()}.${ext}`;
  const filePath = join(UPLOAD_DIR, uniqueName);

  // Save file
  await writeFile(filePath, file.data);

  // Return file URL
  return {
    data: {
      url: `/uploads/${uniqueName}`,
      filename: originalName,
      mimeType,
      size: file.data.length
    }
  };
});
