export default defineNuxtRouteMiddleware(async (to) => {
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login'];

  // DEBUG: Log route information
  console.log('[Auth Middleware]', { path: to.path, fullPath: to.fullPath, isPublic: publicRoutes.includes(to.path) });

  if (publicRoutes.includes(to.path)) {
    console.log('[Auth Middleware] Allowing public route:', to.path);
    return;
  }

  const config = useRuntimeConfig();
  const authEnabled = config.public.authMode !== 'disabled';

  if (!authEnabled) {
    return;
  }

  const api = useWorkbenchApi();

  try {
    await api.get('/api/auth/session');
  } catch (error) {
    const status = (error as { statusCode?: number; status?: number } | null)?.statusCode ?? (error as { status?: number } | null)?.status;

    if (status === 401) {
      const redirect = encodeURIComponent(to.fullPath || '/projects');
      return navigateTo(`/login?redirect=${redirect}`);
    }

    throw error;
  }
});
