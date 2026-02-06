import { defineEventHandler } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);

    const notifications = await db.notifications.list(user.id);
    const unreadCount = await db.notifications.getUnreadCount(user.id);

    return {
      data: notifications,
      unread_count: unreadCount
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const store = getStore();

  const notifications = store.notifications
    .filter((item) => item.user_id === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    data: notifications,
    unread_count: notifications.filter((item) => !item.read_at).length
  };
});
