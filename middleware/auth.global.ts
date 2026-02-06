export default defineNuxtRouteMiddleware(async (to) => {
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login'];

  if (publicRoutes.includes(to.path)) {
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
