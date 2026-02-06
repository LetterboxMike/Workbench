import { defineEventHandler } from 'h3';
import { clearSessionCookie } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  clearSessionCookie(event);

  return {
    data: {
      signed_out: true
    }
  };
});
