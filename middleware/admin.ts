export default defineNuxtRouteMiddleware(async (to) => {
  // Only apply to admin routes
  if (!to.path.startsWith('/admin')) {
    return;
  }

  const api = useWorkbenchApi();

  try {
    const response = await api.get<{
      data: {
        user: { id: string; email: string; name: string };
        organizations: { id: string; system_role: string }[];
      };
    }>('/api/auth/session');

    if (!response.data) {
      return navigateTo('/login');
    }

    // Check if user is super_admin in any organization
    const isSuperAdmin = response.data.organizations.some(
      (org) => org.system_role === 'super_admin'
    );

    if (!isSuperAdmin) {
      // Not a super admin - redirect to projects
      return navigateTo('/projects');
    }

    // User is a super admin, allow access
  } catch {
    // Not authenticated
    return navigateTo('/login');
  }
});
