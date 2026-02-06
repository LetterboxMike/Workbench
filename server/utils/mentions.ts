import type { User } from '~/types/domain';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

/**
 * Extracts mentioned user IDs from comment body text.
 * Matches markdown-style mentions: @[Display Name](user-id)
 *
 * @param body - The comment body text
 * @returns Array of unique user IDs mentioned in the text
 */
export function extractMentionedUserIds(body: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const userIds: string[] = [];
  let match;

  while ((match = mentionRegex.exec(body)) !== null) {
    const userId = match[2];
    if (userId && !userIds.includes(userId)) {
      userIds.push(userId);
    }
  }

  return userIds;
}

/**
 * Validates that mentioned user IDs are members of the given project.
 * Works in both local (in-memory) and Supabase database modes.
 *
 * @param userIds - Array of user IDs to validate
 * @param projectId - The project ID to check membership against
 * @param useDb - Whether to use database mode (true) or local store (false)
 * @returns Promise resolving to array of valid user IDs (members of the project)
 */
export async function validateProjectMembers(
  userIds: string[],
  projectId: string,
  useDb: boolean = false
): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }

  if (useDb) {
    // Supabase mode: query project members
    const members = await db.projectMembers.list(projectId);
    const memberUserIds = new Set(members.map((m) => m.user_id));

    return userIds.filter((userId) => memberUserIds.has(userId));
  } else {
    // Local mode: use in-memory store
    const store = getStore();
    const memberUserIds = new Set(
      store.project_members
        .filter((m) => m.project_id === projectId)
        .map((m) => m.user_id)
    );

    return userIds.filter((userId) => memberUserIds.has(userId));
  }
}

/**
 * Renders mention markdown as HTML with styled chips.
 * Converts @[Name](user-id) to clickable HTML spans.
 *
 * @param body - The comment body with markdown mentions
 * @param users - Array of user objects to look up names
 * @returns HTML string with mentions rendered as chips
 */
export function renderMentionHtml(body: string, users: User[]): string {
  const userMap = new Map(users.map((u) => [u.id, u]));
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

  return body.replace(mentionRegex, (match, displayName, userId) => {
    const user = userMap.get(userId);
    const name = user ? user.name : displayName;

    return `<span class="mention" data-user-id="${userId}" title="${name}">${name}</span>`;
  });
}

/**
 * Extracts plain text from markdown mentions for display.
 * Useful for showing clean text without markdown syntax.
 *
 * @param body - The comment body with markdown mentions
 * @returns Plain text with @mentions but without markdown syntax
 */
export function extractPlainMentions(body: string): string {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  return body.replace(mentionRegex, '@$1');
}
