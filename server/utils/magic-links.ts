import type { MagicLink, SystemRole } from '~/types/domain';
import { createId, nowIso } from './id';
import { getStore } from './store';
import { dbMagicLinks } from './db';
import { getAuthMode } from './auth';

const MAGIC_LINK_EXPIRY_HOURS = 24;

/**
 * Generate a secure magic link token using double createId() for extra entropy
 * @returns A cryptographically random token (~52 characters)
 */
export const generateMagicLinkToken = (): string => {
  return createId() + createId();
};

/**
 * Create a magic link in local store mode
 */
export const createMagicLink = (
  orgId: string,
  email: string,
  systemRole: SystemRole,
  invitedBy: string
): MagicLink => {
  const store = getStore();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

  const link: MagicLink = {
    id: createId(),
    token: generateMagicLinkToken(),
    org_id: orgId,
    email: email.toLowerCase().trim(),
    system_role: systemRole,
    invited_by: invitedBy,
    created_at: nowIso(),
    expires_at: expiresAt.toISOString(),
    redeemed_at: null,
    redeemed_by: null
  };

  store.magic_links.push(link);
  return link;
};

/**
 * Create a magic link in Supabase mode
 */
export const createMagicLinkDb = async (
  orgId: string,
  email: string,
  systemRole: SystemRole,
  invitedBy: string
): Promise<MagicLink> => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

  return dbMagicLinks.create({
    token: generateMagicLinkToken(),
    org_id: orgId,
    email: email.toLowerCase().trim(),
    system_role: systemRole,
    invited_by: invitedBy,
    expires_at: expiresAt.toISOString()
  });
};

/**
 * Auto-switching create magic link (uses appropriate backend)
 */
export const createMagicLinkAuto = async (
  orgId: string,
  email: string,
  systemRole: SystemRole,
  invitedBy: string
): Promise<MagicLink> => {
  const authMode = getAuthMode();

  if (authMode === 'supabase') {
    return createMagicLinkDb(orgId, email, systemRole, invitedBy);
  }

  return createMagicLink(orgId, email, systemRole, invitedBy);
};

/**
 * Get magic link by token from local store (with expiry validation)
 */
export const getMagicLinkByToken = (token: string): MagicLink | null => {
  const store = getStore();
  const now = new Date();

  const link = store.magic_links.find(
    (l) => l.token === token && !l.redeemed_at
  );

  if (!link) return null;

  // Check expiry
  if (new Date(link.expires_at) <= now) {
    return null;
  }

  return link;
};

/**
 * Get magic link by token from database (with expiry validation)
 */
export const getMagicLinkByTokenDb = async (token: string): Promise<MagicLink | null> => {
  const link = await dbMagicLinks.getByToken(token);

  if (!link) return null;

  // Check expiry
  const now = new Date();
  if (new Date(link.expires_at) <= now) {
    return null;
  }

  return link;
};

/**
 * Auto-switching get magic link by token
 */
export const getMagicLinkByTokenAuto = async (token: string): Promise<MagicLink | null> => {
  const authMode = getAuthMode();

  if (authMode === 'supabase') {
    return getMagicLinkByTokenDb(token);
  }

  return getMagicLinkByToken(token);
};

/**
 * Mark magic link as redeemed in local store
 */
export const redeemMagicLink = (linkId: string, userId: string): void => {
  const store = getStore();
  const link = store.magic_links.find((l) => l.id === linkId);

  if (!link) return;

  link.redeemed_at = nowIso();
  link.redeemed_by = userId;
};

/**
 * Mark magic link as redeemed in database
 */
export const redeemMagicLinkDb = async (linkId: string, userId: string): Promise<void> => {
  await dbMagicLinks.redeem(linkId, userId);
};

/**
 * Auto-switching redeem magic link
 */
export const redeemMagicLinkAuto = async (linkId: string, userId: string): Promise<void> => {
  const authMode = getAuthMode();

  if (authMode === 'supabase') {
    return redeemMagicLinkDb(linkId, userId);
  }

  return redeemMagicLink(linkId, userId);
};
