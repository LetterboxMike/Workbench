import { defineEventHandler } from 'h3';
import { getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { nowIso } from '~/server/utils/id';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);

    // Get unread count before marking all as read
    const unreadCount = await db.notifications.getUnreadCount(user.id);
    await db.notifications.markAllRead(user.id);

    return {
      data: {
        updated: unreadCount
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const store = getStore();

  let changed = 0;

  for (const notification of store.notifications) {
    if (notification.user_id === user.id && !notification.read_at) {
      notification.read_at = nowIso();
      changed += 1;
    }
  }

  return {
    data: {
      updated: changed
    }
  };
});
