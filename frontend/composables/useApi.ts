export const useApi = () => {
  const config = useRuntimeConfig();

  const apiFetch = async <T = any>(endpoint: string, options: any = {}): Promise<T> => {
    const tokenCookie = useCookie<string | null>('opalo_token');
    const token = tokenCookie.value;

    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${config.public.apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      return await $fetch<T>(url, {
        ...options,
        headers
      });
    } catch (err: any) {
      if (err?.statusCode === 401 && !endpoint.includes('/auth/')) {
        const { logout } = useAuth();
        logout();
      }
      throw err;
    }
  };

  return { apiFetch };
};

