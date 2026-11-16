export const useAuth = () => {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>('opalo_token', {
    maxAge: 60 * 60 * 24, // 1 día
    path: '/'
  });

  const user = useState<any | null>('auth_user', () => null);
  const isLoading = useState<boolean>('auth_loading', () => false);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.rol?.nombre === 'ADMIN');
  const isCashier = computed(() => user.value?.rol?.nombre === 'CAJERO');

  // Permisos granulares de acceso por módulo
  const canAccessModule = (moduleKey: string): boolean => {
    // Si aún no ha terminado de cargar el perfil en el cliente/SSR, permitir los módulos básicos para evitar redirecciones prematuras
    if (!user.value) {
      const defaultCashier = ['pos', 'inventario', 'etiquetas', 'ventas', 'clientes'];
      return defaultCashier.includes(moduleKey);
    }
    // Administradores tienen acceso irrestricto a todos los módulos
    if (isAdmin.value) return true;

    const allowed = user.value.modulos_permitidos;
    if (Array.isArray(allowed)) {
      return allowed.includes(moduleKey);
    }
    // Fallback estándar si aún no tiene asignados
    const defaultCashier = ['pos', 'inventario', 'etiquetas', 'ventas', 'clientes'];
    return defaultCashier.includes(moduleKey);
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    try {
      const response: any = await $fetch(`${config.public.apiBase}/auth/login`, {
        method: 'POST',
        body: { email, password }
      });

      if (response && response.success && response.data) {
        token.value = response.data.token;
        user.value = response.data.user;
        return { success: true };
      }
      return { success: false, message: response.message || 'Error al iniciar sesión' };
    } catch (err: any) {
      const message = err?.data?.message || err.message || 'Error en conexión con el servidor';
      return { success: false, message };
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    try {
      if (useRoute().path !== '/login') {
        navigateTo('/login');
      }
    } catch (e) {
      // Ignorar si se ejecuta fuera de contexto de ruta
    }
  };

  const fetchProfile = async () => {
    if (!token.value) return null;
    try {
      const response: any = await $fetch(`${config.public.apiBase}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      });
      if (response && response.success && response.data) {
        user.value = {
          id: response.data.id,
          nombre: response.data.nombre,
          email: response.data.email,
          telefono: response.data.telefono,
          rol: response.data.rol,
          modulos_permitidos: response.data.modulos_permitidos
        };
        return user.value;
      }
    } catch (err) {
      token.value = null;
      user.value = null;
    }
    return null;
  };

  return {
    token,
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isCashier,
    canAccessModule,
    login,
    logout,
    fetchProfile
  };
};

