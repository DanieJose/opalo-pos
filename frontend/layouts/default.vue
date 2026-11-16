<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
    <!-- Barra Superior / Header POS -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div class="px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        <!-- Botón Menú Móvil (Hamburguesa) + Logotipo y Nombre de Tienda -->
        <div class="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <!-- Botón Hamburguesa en Móviles y Tablets (< lg) -->
          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen" 
            type="button"
            class="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <span class="text-xl leading-none">☰</span>
          </button>

          <!-- Logotipo Oficial de la Empresa -->
          <NuxtLink to="/" class="flex items-center space-x-2.5 sm:space-x-3 group">
            <img 
              v-if="companyConfig?.logo_url && !logoError" 
              :src="getFullLogoUrl(companyConfig.logo_url)" 
              alt="Logo Empresa" 
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-200 shadow-xs group-hover:scale-105 transition" 
              @error="logoError = true"
            />
            <div 
              v-else 
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-opalo-600 to-rose-400 flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-md shadow-opalo-200 group-hover:scale-105 transition"
            >
              {{ (companyConfig?.nombre_empresa || 'Ó')[0].toUpperCase() }}
            </div>
            <div class="hidden xs:block">
              <div class="flex items-center space-x-1.5">
                <h1 class="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-none truncate max-w-[130px] sm:max-w-[200px] md:max-w-xs">
                  {{ companyConfig?.nombre_empresa || 'ÓPALO ACCESORIOS' }}
                </h1>
                <span class="hidden sm:inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  POS
                </span>
              </div>
              <p class="hidden sm:block text-[11px] text-slate-400 font-medium truncate">
                {{ companyConfig?.ciudad || 'Tocoa, Colón' }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <!-- Menú de Navegación Rápida para Pantallas Grandes (Desktop / Laptop) -->
        <nav class="hidden lg:flex items-center space-x-1 overflow-x-auto scrollbar-none py-1 max-w-[60vw] 2xl:max-w-none">
          <NuxtLink 
            v-if="canAccessModule('pos')"
            to="/" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>🛒</span>
            <span>Caja (POS)</span>
          </NuxtLink>

          <NuxtLink 
            v-if="canAccessModule('inventario')"
            to="/inventario" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/inventario' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>👗</span>
            <span>Inventario</span>
          </NuxtLink>

          <NuxtLink 
            v-if="canAccessModule('etiquetas')"
            to="/etiquetas" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/etiquetas' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>🏷️</span>
            <span>Etiquetas</span>
          </NuxtLink>

          <NuxtLink 
            v-if="canAccessModule('ventas')"
            to="/ventas" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/ventas' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>🧾</span>
            <span>Ventas y Cierre</span>
          </NuxtLink>

          <NuxtLink 
            v-if="canAccessModule('clientes')"
            to="/clientes" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/clientes' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>💎</span>
            <span>Clientes</span>
          </NuxtLink>

          <NuxtLink 
            v-if="canAccessModule('proveedores')"
            to="/proveedores" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/proveedores' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>🏭</span>
            <span>Proveedores</span>
          </NuxtLink>

          <NuxtLink 
            v-if="canAccessModule('finanzas')"
            to="/finanzas" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/finanzas' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>💰</span>
            <span>Finanzas</span>
          </NuxtLink>

          <NuxtLink 
            v-if="canAccessModule('reportes')"
            to="/reportes" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/reportes' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>📊</span>
            <span>Reportes</span>
          </NuxtLink>

          <NuxtLink 
            v-if="canAccessModule('reclutamiento')"
            to="/reclutamiento" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/reclutamiento' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>💼</span>
            <span>Reclutamiento</span>
          </NuxtLink>

          <NuxtLink 
            v-if="isAdmin"
            to="/usuarios" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/usuarios' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>👥</span>
            <span>Usuarios</span>
          </NuxtLink>

          <NuxtLink 
            v-if="isAdmin"
            to="/logs" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/logs' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>📜</span>
            <span>Logs</span>
          </NuxtLink>

          <NuxtLink 
            v-if="isAdmin"
            to="/configuracion" 
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            :class="$route.path === '/configuracion' ? 'bg-opalo-50 text-opalo-700 font-black' : 'text-slate-600 hover:bg-slate-100'"
          >
            <span>⚙️</span>
            <span>Configuración</span>
          </NuxtLink>
        </nav>

        <!-- Información de Cajero / Usuario y Salir -->
        <div class="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
              {{ user?.nombre || 'Personal Ópalo' }}
            </p>
            <span class="inline-block text-[10px] font-extrabold px-2 py-0.2 rounded-full"
                  :class="user?.rol?.nombre === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'">
              {{ user?.rol?.nombre || 'Cajero' }}
            </span>
          </div>

          <button 
            @click="logout" 
            title="Cerrar Sesión"
            class="p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200 flex items-center gap-1.5 cursor-pointer text-xs font-bold"
          >
            <span>🚪</span>
            <span class="hidden md:inline">Salir</span>
          </button>
        </div>

      </div>
    </header>

    <!-- ===================================================================== -->
    <!-- DRAWER / MENÚ LATERAL MÓVIL Y TABLET (Slide-Over con fondo desenfocado)-->
    <!-- ===================================================================== -->
    <Teleport to="body">
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-50 lg:hidden flex">
        <!-- Fondo Oscuro Backdrop con Desenfoque -->
        <div 
          @click="isMobileMenuOpen = false" 
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        ></div>

        <!-- Contenedor del Drawer Deslizable -->
        <div class="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 animate-slide-right">
          
          <!-- Encabezado del Menú Móvil -->
          <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-opalo-950 text-white">
            <div class="flex items-center space-x-3">
              <img 
                v-if="companyConfig?.logo_url && !logoError" 
                :src="getFullLogoUrl(companyConfig.logo_url)" 
                alt="Logo Empresa" 
                class="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-white/20 shadow-xs" 
                @error="logoError = true"
              />
              <div 
                v-else 
                class="w-10 h-10 rounded-xl bg-gradient-to-tr from-opalo-600 to-rose-400 flex items-center justify-center text-white font-black text-xl"
              >
                {{ (companyConfig?.nombre_empresa || 'Ó')[0].toUpperCase() }}
              </div>
              <div class="truncate">
                <h3 class="text-xs font-black uppercase tracking-tight truncate">
                  {{ companyConfig?.nombre_empresa || 'ÓPALO ACCESORIOS' }}
                </h3>
                <p class="text-[10px] text-slate-300">
                  {{ companyConfig?.ciudad || 'Tocoa, Colón' }}
                </p>
              </div>
            </div>

            <button 
              @click="isMobileMenuOpen = false" 
              class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              title="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <!-- Perfil de Usuario Activo en Móvil -->
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {{ (user?.nombre || 'U')[0].toUpperCase() }}
              </div>
              <div>
                <p class="text-xs font-bold text-slate-900 leading-tight">
                  {{ user?.nombre || 'Personal Ópalo' }}
                </p>
                <span class="inline-block text-[10px] font-extrabold px-2 py-0.2 rounded-full mt-0.5"
                      :class="user?.rol?.nombre === 'ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'">
                  {{ user?.rol?.nombre || 'Cajero' }}
                </span>
              </div>
            </div>
            <span class="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Online
            </span>
          </div>

          <!-- Listado de Enlaces de Navegación Móvil -->
          <nav class="flex-1 overflow-y-auto p-3 space-y-1">
            <NuxtLink 
              v-if="canAccessModule('pos')"
              to="/" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">🛒</span>
              <span>Caja (POS)</span>
            </NuxtLink>

            <NuxtLink 
              v-if="canAccessModule('inventario')"
              to="/inventario" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/inventario' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">👗</span>
              <span>Inventario y Variantes</span>
            </NuxtLink>

            <NuxtLink 
              v-if="canAccessModule('etiquetas')"
              to="/etiquetas" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/etiquetas' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">🏷️</span>
              <span>Impresión de Etiquetas</span>
            </NuxtLink>

            <NuxtLink 
              v-if="canAccessModule('ventas')"
              to="/ventas" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/ventas' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">🧾</span>
              <span>Ventas, Cierre y Devoluciones</span>
            </NuxtLink>

            <NuxtLink 
              v-if="canAccessModule('clientes')"
              to="/clientes" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/clientes' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">💎</span>
              <span>Clientes & Lealtad</span>
            </NuxtLink>

            <NuxtLink 
              v-if="canAccessModule('proveedores')"
              to="/proveedores" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/proveedores' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">🏭</span>
              <span>Proveedores & Cuentas por Pagar</span>
            </NuxtLink>

            <NuxtLink 
              v-if="canAccessModule('finanzas')"
              to="/finanzas" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/finanzas' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">💰</span>
              <span>Finanzas & Flujo de Caja</span>
            </NuxtLink>

            <NuxtLink 
              v-if="canAccessModule('reportes')"
              to="/reportes" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/reportes' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">📊</span>
              <span>Centro de Reportes</span>
            </NuxtLink>

            <NuxtLink 
              v-if="canAccessModule('reclutamiento')"
              to="/reclutamiento" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/reclutamiento' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">💼</span>
              <span>Reclutamiento y Vacantes</span>
            </NuxtLink>

            <!-- Sección de Administración -->
            <div v-if="isAdmin" class="pt-3 pb-1 px-3">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Administración
              </span>
            </div>

            <NuxtLink 
              v-if="isAdmin"
              to="/usuarios" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/usuarios' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">👥</span>
              <span>Usuarios y Roles</span>
            </NuxtLink>

            <NuxtLink 
              v-if="isAdmin"
              to="/logs" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/logs' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">📜</span>
              <span>Logs y Auditoría</span>
            </NuxtLink>

            <NuxtLink 
              v-if="isAdmin"
              to="/configuracion" 
              @click="isMobileMenuOpen = false"
              class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition"
              :class="$route.path === '/configuracion' ? 'bg-opalo-600 text-white shadow-md shadow-opalo-500/20' : 'text-slate-700 hover:bg-slate-100'"
            >
              <span class="text-base">⚙️</span>
              <span>Configuración del Sistema</span>
            </NuxtLink>
          </nav>

          <!-- Pie del Drawer con Cerrar Sesión -->
          <div class="p-3 border-t border-slate-200 bg-slate-50">
            <button 
              @click="logout" 
              type="button"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100/70 bg-rose-50 border border-rose-200 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- Contenido Principal -->
    <main class="flex-1 flex flex-col min-h-0">
      <slot />
    </main>
  </div>
</template>

<script setup>
const route = useRoute();
const { user, isAdmin, canAccessModule, logout, fetchProfile } = useAuth();
const { companyConfig, getFullLogoUrl, fetchCompanyConfig } = useCompanyConfig();
const logoError = ref(false);
const isMobileMenuOpen = ref(false);

watch(() => companyConfig.value?.logo_url, () => {
  logoError.value = false;
});

// Cerrar drawer móvil automáticamente al cambiar de ruta
watch(() => route.path, () => {
  isMobileMenuOpen.value = false;
});

onMounted(async () => {
  if (!user.value) {
    await fetchProfile();
  }
  await fetchCompanyConfig();
});
</script>

