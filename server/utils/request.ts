import { createError, readBody } from 'h3';

export const readJsonBody = async <T>(event: Parameters<typeof readBody>[0]): Promise<T> => {
  try {
    return (await readBody(event)) as T;
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body.' });
  }
};

export const ensureString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: `${field} is required.` });
  }

  return value.trim();
};

export const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};