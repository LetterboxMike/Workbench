import { createError, defineEventHandler } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { nowIso } from '~/server/utils/id';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const notificationId = event.context.params?.id;

  if (!notificationId) {
    throw createError({ statusCode: 400, statusMessage: 'Notification id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);

    const notification = await db.notifications.get(notificationId);

    if (!notification || notification.user_id !== user.id) {
      throw createError({ statusCode: 404, statusMessage: 'Notification not found.' });
    }

    const updated = await db.notifications.markRead(notificationId);

    return {
      data: updated
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);

  const store = getStore();
  const notification = store.notifications.find((item) => item.id === notificationId && item.user_id === user.id);

  if (!notification) {
    throw createError({ statusCode: 404, statusMessage: 'Notification not found.' });
  }

  notification.read_at = nowIso();

  return {
    data: notification
  };
});
