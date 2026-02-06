import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

const splitHash = (storedHash: string): { salt: string; key: string } | null => {
  const [salt, key] = storedHash.split(':');

  if (!salt || !key) {
    return null;
  }

  return { salt, key };
};

export const hashPassword = (password: string, salt = randomBytes(SALT_BYTES).toString('hex')): string => {
  const key = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${key}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const parsed = splitHash(storedHash);

  if (!parsed) {
    return false;
  }

  const expected = Buffer.from(parsed.key, 'hex');
  const actual = scryptSync(password, parsed.salt, KEY_LENGTH);

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
};
