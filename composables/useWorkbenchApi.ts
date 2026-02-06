import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';

const isUnauthorized = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const withStatus = error as { statusCode?: number; status?: number };
  return withStatus.statusCode === 401 || withStatus.status === 401;
};

export const useWorkbenchApi = () => {
  const request = async <T>(url: NitroFetchRequest, options: NitroFetchOptions<NitroFetchRequest> & { skipAuthRedirect?: boolean } = {}) => {
    const forwardedHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {};
    const { skipAuthRedirect, ...fetchOptions } = options;

    try {
      return await $fetch<T>(url, {
        ...fetchOptions,
        credentials: 'include',
        headers: {
          ...(forwardedHeaders || {}),
          ...(fetchOptions.headers || {})
        }
      });
    } catch (error) {
      if (import.meta.client && isUnauthorized(error) && !skipAuthRedirect) {
        const route = useRoute();
        const redirect = encodeURIComponent(route.fullPath || '/projects');
        await navigateTo(`/login?redirect=${redirect}`);
      }

      throw error;
    }
  };

  return {
    get: <T>(url: NitroFetchRequest, options: NitroFetchOptions<NitroFetchRequest> = {}) => request<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: NitroFetchRequest, body?: NitroFetchOptions<NitroFetchRequest>['body'], options: NitroFetchOptions<NitroFetchRequest> = {}) =>
      request<T>(url, { ...options, method: 'POST', body }),
    patch: <T>(url: NitroFetchRequest, body?: NitroFetchOptions<NitroFetchRequest>['body'], options: NitroFetchOptions<NitroFetchRequest> = {}) =>
      request<T>(url, { ...options, method: 'PATCH', body }),
    put: <T>(url: NitroFetchRequest, body?: NitroFetchOptions<NitroFetchRequest>['body'], options: NitroFetchOptions<NitroFetchRequest> = {}) =>
      request<T>(url, { ...options, method: 'PUT', body }),
    del: <T>(url: NitroFetchRequest, options: NitroFetchOptions<NitroFetchRequest> = {}) => request<T>(url, { ...options, method: 'DELETE' })
  };
};
