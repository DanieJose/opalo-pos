export default defineNuxtRouteMiddleware(async (to) => {
  const { user, token, isAuthenticated, isAdmin, canAccessModule, fetchProfile } = useAuth();

  const publicRoutes = ['/login', '/postulacion'];
  const isPublicRoute = publicRoutes.some(route => to.path === route || to.path.startsWith('/postulacion'));

  // 1. Si no está autenticado y no es ruta pública, redirigir a /login
  if (!isAuthenticated.value && !isPublicRoute) {
    if (to.path !== '/login') {
      return navigateTo('/login');
    }
    return;
  }

  // 2. Si ya está autenticado e intenta ir a /login, redirigir a apertura de caja
  if (isAuthenticated.value && to.path === '/login') {
    return navigateTo('/apertura-caja');
  }

  // Si está en una ruta pública o apertura de caja, permitir navegación directa
  if (isPublicRoute || to.path === '/apertura-caja') {
    return;
  }

  // 3. Cargar perfil si aún no está en memoria
  if (isAuthenticated.value && !user.value) {
    try {
      await fetchProfile();
    } catch (e) {
      token.value = null;
      if (to.path !== '/login') {
        return navigateTo('/login');
      }
      return;
    }
  }

  // Si el usuario es administrador, tiene acceso irrestricto
  if (isAdmin.value) {
    return;
  }

  // 4. Mapeo de rutas a módulos del sistema POS
  const routeModuleMap: Record<string, string> = {
    '/': 'pos',
    '/inventario': 'inventario',
    '/etiquetas': 'etiquetas',
    '/ventas': 'ventas',
    '/clientes': 'clientes',
    '/proveedores': 'proveedores',
    '/finanzas': 'finanzas',
    '/reportes': 'reportes',
    '/reclutamiento': 'reclutamiento',
    '/usuarios': 'usuarios',
    '/logs': 'logs',
    '/configuracion': 'configuracion'
  };

  const requiredModule = routeModuleMap[to.path];
  if (requiredModule) {
    // Módulos reservados exclusivamente para el rol ADMIN
    if (['usuarios', 'logs', 'configuracion'].includes(requiredModule)) {
      if (to.path !== '/') {
        return navigateTo('/');
      }
      return;
    }

    // Verificar permiso granular para cajeros
    if (!canAccessModule(requiredModule)) {
      // Solo redirigir a '/' si la ruta actual no es ya '/' (evita recursión infinita en router)
      if (to.path !== '/') {
        return navigateTo('/');
      }
    }
  }
});
