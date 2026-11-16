<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
    
    <!-- Cabecera de Página -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Control de Usuarios, Roles & Permisos</h1>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            Módulo Exclusivo ADMIN
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">Gestión de accesos, roles y permisos granulares por módulo para Ópalo Accesorios</p>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="openCreateModal"
          class="px-4 py-2.5 bg-opalo-600 hover:bg-opalo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span>
          <span>Registrar Usuario</span>
        </button>
      </div>
    </div>

    <!-- Tarjetas de Resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Total Usuarios</p>
          <p class="text-2xl font-black text-slate-900 mt-0.5">{{ users.length }}</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">👥</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Administradores</p>
          <p class="text-2xl font-black text-purple-600 mt-0.5">{{ totalAdmins }}</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">🛡️</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Cajeros de Turno</p>
          <p class="text-2xl font-black text-blue-600 mt-0.5">{{ totalCashiers }}</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">💳</span>
      </div>
    </div>

    <!-- Barra de Búsqueda y Filtro de Roles -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
      <div class="relative flex-1 w-full">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar usuario por nombre, correo o teléfono..."
          @input="loadUsers"
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-medium"
        />
      </div>

      <div class="flex items-center space-x-1.5 shrink-0">
        <button 
          @click="filterByRole(null)"
          :class="selectedRoleFilter === null ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          Todos
        </button>
        <button 
          @click="filterByRole(1)"
          :class="selectedRoleFilter === 1 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          Admins
        </button>
        <button 
          @click="filterByRole(2)"
          :class="selectedRoleFilter === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          Cajeros
        </button>
      </div>
    </div>

    <!-- Tabla de Usuarios -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <th class="py-3 px-4">Usuario</th>
              <th class="py-3 px-4">Correo Electrónico</th>
              <th class="py-3 px-4">Teléfono</th>
              <th class="py-3 px-4">Rol Asignado</th>
              <th class="py-3 px-4 min-w-[200px]">Módulos de Acceso</th>
              <th class="py-3 px-4 text-center">Estado</th>
              <th class="py-3 px-4">Fecha Alta</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLoading" class="text-center py-8">
              <td colspan="8" class="py-8 text-slate-400 font-semibold">Cargando usuarios...</td>
            </tr>
            <tr v-else-if="users.length === 0" class="text-center py-8">
              <td colspan="8" class="py-8 text-slate-400 font-semibold">No se encontraron usuarios</td>
            </tr>
            <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50/60 transition">
              <!-- Nombre y Avatar -->
              <td class="py-3 px-4 font-bold text-slate-900">
                <div class="flex items-center space-x-2.5">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                       :class="u.rol_nombre === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                    {{ u.nombre.charAt(0).toUpperCase() }}
                  </div>
                  <span>{{ u.nombre }}</span>
                </div>
              </td>

              <!-- Correo -->
              <td class="py-3 px-4 font-medium text-slate-600">{{ u.email }}</td>

              <!-- Teléfono -->
              <td class="py-3 px-4 text-slate-600 font-mono">{{ u.telefono || 'Sin teléfono' }}</td>

              <!-- Rol Asignado -->
              <td class="py-3 px-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      :class="u.rol_nombre === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'">
                  {{ u.rol_nombre === 'ADMIN' ? '🛡️ Administrador' : '💳 Cajero POS' }}
                </span>
              </td>

              <!-- Módulos de Acceso Granulares -->
              <td class="py-3 px-4">
                <div v-if="u.rol_nombre === 'ADMIN'">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                    <span>🛡️</span>
                    <span>Acceso Total (12 módulos)</span>
                  </span>
                </div>
                <div v-else class="space-y-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span 
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                      :class="(u.modulos_permitidos?.length || 0) > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                    >
                      <span>🔑</span>
                      <span>{{ u.modulos_permitidos?.length || 0 }} de {{ availableModules.length }} módulos</span>
                    </span>
                  </div>
                  <div class="flex items-center gap-1 flex-wrap text-[10px] text-slate-500">
                    <span 
                      v-for="mKey in (u.modulos_permitidos || []).slice(0, 3)" 
                      :key="mKey"
                      class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold"
                    >
                      {{ getModuleIcon(mKey) }} {{ getModuleName(mKey) }}
                    </span>
                    <span v-if="(u.modulos_permitidos || []).length > 3" class="text-slate-400 font-bold text-[9px]">
                      +{{ (u.modulos_permitidos || []).length - 3 }} más
                    </span>
                  </div>
                </div>
              </td>

              <!-- Estado -->
              <td class="py-3 px-4 text-center">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      :class="u.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="u.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                  {{ u.estado }}
                </span>
              </td>

              <!-- Fecha -->
              <td class="py-3 px-4 text-slate-400 text-[11px]">{{ new Date(u.created_at).toLocaleDateString('es-HN') }}</td>

              <!-- Acciones Rápidas -->
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end space-x-1.5">
                  <!-- Botón Permisos Granulares (para Cajeros) -->
                  <button 
                    v-if="u.rol_nombre !== 'ADMIN'"
                    @click="openPermissionsModal(u)"
                    class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition cursor-pointer border border-blue-200 flex items-center gap-1"
                    title="Configurar qué módulos puede ver este cajero"
                  >
                    <span>🔑</span>
                    <span>Permisos</span>
                  </button>

                  <!-- Editar Usuario -->
                  <button 
                    @click="openEditModal(u)"
                    class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                  >
                    Editar
                  </button>

                  <!-- Activar / Desactivar -->
                  <button 
                    @click="toggleUserStatus(u)"
                    class="px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer"
                    :class="u.estado === 'ACTIVO' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'"
                  >
                    {{ u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 1: REGISTRAR NUEVO USUARIO CON SELECCIÓN DE MÓDULOS             -->
    <!-- ===================================================================== -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-black text-slate-900">Registrar Nuevo Usuario</h3>
            <p class="text-xs text-slate-400">Acceso seguro y asignación de permisos para el personal</p>
          </div>
          <button @click="isCreateModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="submitCreateUser" class="space-y-3.5 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
              <input 
                v-model="newUser.nombre" 
                type="text" 
                required 
                placeholder="Ej: Katherine Melissa Peña"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-semibold"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
              <input 
                v-model="newUser.email" 
                type="email" 
                required 
                placeholder="katherine@opalo.hn"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-semibold"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Contraseña Inicial (mín 6 car.) *</label>
              <input 
                v-model="newUser.password" 
                type="password" 
                required 
                minlength="6"
                placeholder="••••••••"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Teléfono (WhatsApp)</label>
              <input 
                v-model="newUser.telefono" 
                type="text" 
                placeholder="+504 9999-0000"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Rol de Acceso *</label>
            <select 
              v-model="newUser.rol_id" 
              required
              class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-bold"
            >
              <option :value="2">💳 Cajero (Configurable por módulos)</option>
              <option :value="1">🛡️ Administrador (Acceso total al sistema)</option>
            </select>
          </div>

          <!-- Selector de Módulos Permitidos para Cajero -->
          <div v-if="newUser.rol_id === 2" class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div class="flex items-center justify-between">
              <div>
                <label class="block font-black text-slate-800 text-xs">Módulos Permitidos para este Cajero</label>
                <p class="text-[10px] text-slate-500">Marca a qué módulos tendrá acceso y a cuáles no</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button 
                  type="button" 
                  @click="selectAllModules(newUser.modulos_permitidos)" 
                  class="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"
                >
                  Todos
                </button>
                <button 
                  type="button" 
                  @click="selectBasicCashierModules(newUser.modulos_permitidos)" 
                  class="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-[10px] font-bold text-blue-800 cursor-pointer"
                >
                  Básico POS
                </button>
                <button 
                  type="button" 
                  @click="clearAllModules(newUser.modulos_permitidos)" 
                  class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-[10px] font-bold text-slate-500 hover:text-rose-700 cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              <div 
                v-for="m in availableModules" 
                :key="m.key"
                @click="toggleModulePermission(newUser.modulos_permitidos, m.key)"
                class="p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between select-none"
                :class="newUser.modulos_permitidos.includes(m.key) 
                  ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-2xs' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-base shrink-0">{{ m.icon }}</span>
                  <div class="truncate">
                    <p class="font-bold text-xs leading-tight truncate">{{ m.name }}</p>
                    <p class="text-[10px] text-slate-400 truncate">{{ m.desc }}</p>
                  </div>
                </div>
                <div 
                  class="w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black transition"
                  :class="newUser.modulos_permitidos.includes(m.key) ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'"
                >
                  {{ newUser.modulos_permitidos.includes(m.key) ? '✓' : '' }}
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full mt-3 py-3 bg-opalo-600 hover:bg-opalo-700 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
          >
            {{ isSubmitting ? 'Guardando...' : 'Crear Usuario' }}
          </button>
        </form>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 2: EDITAR USUARIO / CAMBIO DE ROL, PERMISOS Y CONTRASEÑA        -->
    <!-- ===================================================================== -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-black text-slate-900">Editar Usuario</h3>
            <p class="text-xs text-slate-400">Modificar información, rol y permisos de acceso</p>
          </div>
          <button @click="isEditModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="submitEditUser" class="space-y-3.5 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Nombre Completo</label>
              <input 
                v-model="editUserForm.nombre" 
                type="text" 
                required 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-semibold"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input 
                v-model="editUserForm.email" 
                type="email" 
                required 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-semibold"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Teléfono</label>
              <input 
                v-model="editUserForm.telefono" 
                type="text" 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-mono"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Rol de Acceso</label>
              <select 
                v-model="editUserForm.rol_id" 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-bold"
              >
                <option :value="2">💳 Cajero</option>
                <option :value="1">🛡️ Administrador</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Estado</label>
              <select 
                v-model="editUserForm.estado" 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-bold"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
          </div>

          <!-- Permisos Granulares para Cajeros en Edición -->
          <div v-if="editUserForm.rol_id === 2" class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div class="flex items-center justify-between">
              <div>
                <label class="block font-black text-slate-800 text-xs">Módulos Permitidos para este Cajero</label>
                <p class="text-[10px] text-slate-500">Selecciona qué módulos puede ver en el menú y cuáles tiene bloqueados</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button 
                  type="button" 
                  @click="selectAllModules(editUserForm.modulos_permitidos)" 
                  class="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"
                >
                  Todos
                </button>
                <button 
                  type="button" 
                  @click="selectBasicCashierModules(editUserForm.modulos_permitidos)" 
                  class="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-[10px] font-bold text-blue-800 cursor-pointer"
                >
                  Básico POS
                </button>
                <button 
                  type="button" 
                  @click="clearAllModules(editUserForm.modulos_permitidos)" 
                  class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-[10px] font-bold text-slate-500 hover:text-rose-700 cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              <div 
                v-for="m in availableModules" 
                :key="m.key"
                @click="toggleModulePermission(editUserForm.modulos_permitidos, m.key)"
                class="p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between select-none"
                :class="editUserForm.modulos_permitidos.includes(m.key) 
                  ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-2xs' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-base shrink-0">{{ m.icon }}</span>
                  <div class="truncate">
                    <p class="font-bold text-xs leading-tight truncate">{{ m.name }}</p>
                    <p class="text-[10px] text-slate-400 truncate">{{ m.desc }}</p>
                  </div>
                </div>
                <div 
                  class="w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black transition"
                  :class="editUserForm.modulos_permitidos.includes(m.key) ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'"
                >
                  {{ editUserForm.modulos_permitidos.includes(m.key) ? '✓' : '' }}
                </div>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100">
            <label class="block font-bold text-slate-700 mb-1">Resetear Contraseña (dejar vacío para no cambiar)</label>
            <input 
              v-model="editUserForm.password" 
              type="password" 
              placeholder="Nueva contraseña opcional (mín 6)"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full mt-3 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
          >
            {{ isSubmitting ? 'Actualizando...' : 'Guardar Cambios' }}
          </button>
        </form>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 3: GESTIÓN RÁPIDA DE PERMISOS DE MÓDULOS                        -->
    <!-- ===================================================================== -->
    <div v-if="isPermissionsModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        
        <!-- Cabecera del Modal de Permisos -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-black">
              🔑
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900">
                Permisos de Acceso a Módulos
              </h3>
              <p class="text-xs text-slate-500">
                Usuario: <strong>{{ permissionsUser?.nombre }}</strong> ({{ permissionsUser?.email }})
              </p>
            </div>
          </div>
          <button @click="isPermissionsModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- Botones de Preconfiguración Rápida -->
          <div class="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="text-[11px] font-bold text-slate-500">Configuración Rápida:</span>
            <div class="flex items-center gap-1.5">
              <button 
                type="button" 
                @click="selectAllModules(permissionsList)" 
                class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold cursor-pointer transition shadow-2xs"
              >
                ✨ Todos ({{ availableModules.length }})
              </button>
              <button 
                type="button" 
                @click="selectBasicCashierModules(permissionsList)" 
                class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer transition shadow-2xs"
              >
                ⚡ Básico POS (5)
              </button>
              <button 
                type="button" 
                @click="clearAllModules(permissionsList)" 
                class="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-700 text-[10px] font-bold cursor-pointer transition"
              >
                🧹 Bloquear Todo
              </button>
            </div>
          </div>

          <!-- Cuadrícula de Selección de Módulos -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            <div 
              v-for="m in availableModules" 
              :key="m.key"
              @click="toggleModulePermission(permissionsList, m.key)"
              class="p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between select-none"
              :class="permissionsList.includes(m.key) 
                ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-xs' 
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="text-xl shrink-0">{{ m.icon }}</span>
                <div class="truncate">
                  <p class="font-extrabold text-xs leading-tight truncate" :class="permissionsList.includes(m.key) ? 'text-slate-900' : 'text-slate-500'">
                    {{ m.name }}
                  </p>
                  <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ m.desc }}</p>
                </div>
              </div>
              <div 
                class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-xs font-black transition"
                :class="permissionsList.includes(m.key) ? 'bg-blue-600 text-white shadow-xs' : 'border border-slate-300 bg-white'"
              >
                {{ permissionsList.includes(m.key) ? '✓' : '' }}
              </div>
            </div>
          </div>

          <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <span>ℹ️</span>
            <p>
              Los cambios de permisos se aplican inmediatamente. Al guardar, el cajero verá únicamente los módulos autorizados en su menú y no podrá navegar a los módulos no permitidos.
            </p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button 
              type="button" 
              @click="isPermissionsModalOpen = false"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              @click="savePermissions"
              :disabled="isSubmitting"
              class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-40"
            >
              {{ isSubmitting ? 'Guardando...' : 'Guardar Permisos' }}
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { onEvent } = useSocket();

const users = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedRoleFilter = ref(null);

const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isPermissionsModalOpen = ref(false);
const isSubmitting = ref(false);

// Catálogo maestro de módulos del sistema disponibles para control de acceso
const availableModules = [
  { key: 'pos', name: 'Caja (POS)', icon: '🛒', desc: 'Cobro de prendas, carrito, facturación y tickets' },
  { key: 'inventario', name: 'Inventario & Variantes', icon: '👗', desc: 'Prendas, tallas, colores, precios y stock' },
  { key: 'etiquetas', name: 'Impresión de Etiquetas', icon: '🏷️', desc: 'Códigos de barra y etiquetas de precio' },
  { key: 'ventas', name: 'Ventas y Cierres', icon: '🧾', desc: 'Historial de ventas, devoluciones y caja' },
  { key: 'clientes', name: 'Clientes & Lealtad', icon: '💎', desc: 'Directorio de clientes y estado de cuenta' },
  { key: 'proveedores', name: 'Proveedores & Pagos', icon: '🏭', desc: 'Cuentas por pagar y abonos a proveedores' },
  { key: 'finanzas', name: 'Finanzas & Metas', icon: '💰', desc: 'Flujo de caja, gastos y metas proyectadas' },
  { key: 'reportes', name: 'Reportes & Estadísticas', icon: '📊', desc: 'Analítica ejecutiva y ventas por cajero' },
  { key: 'reclutamiento', name: 'Reclutamiento & Vacantes', icon: '💼', desc: 'Bolsa de empleo y postulaciones' },
];

const getModuleIcon = (key) => {
  const m = availableModules.find(x => x.key === key);
  return m ? m.icon : '📦';
};

const getModuleName = (key) => {
  const m = availableModules.find(x => x.key === key);
  return m ? m.name : key;
};

// Formulario de creación
const newUser = ref({
  nombre: '',
  email: '',
  password: '',
  telefono: '',
  rol_id: 2,
  modulos_permitidos: ['pos', 'inventario', 'etiquetas', 'ventas', 'clientes']
});

// Formulario de edición
const editUserForm = ref({
  id: null,
  nombre: '',
  email: '',
  telefono: '',
  rol_id: 2,
  estado: 'ACTIVO',
  password: '',
  modulos_permitidos: []
});

// Estado para modal de permisos rápidos
const permissionsUser = ref(null);
const permissionsList = ref([]);

const totalAdmins = computed(() => users.value.filter(u => u.rol_id === 1 && u.estado === 'ACTIVO').length);
const totalCashiers = computed(() => users.value.filter(u => u.rol_id === 2 && u.estado === 'ACTIVO').length);

const toggleModulePermission = (targetList, moduleKey) => {
  const index = targetList.indexOf(moduleKey);
  if (index > -1) {
    targetList.splice(index, 1);
  } else {
    targetList.push(moduleKey);
  }
};

const selectAllModules = (targetList) => {
  targetList.length = 0;
  targetList.push(...availableModules.map(m => m.key));
};

const selectBasicCashierModules = (targetList) => {
  targetList.length = 0;
  targetList.push('pos', 'inventario', 'etiquetas', 'ventas', 'clientes');
};

const clearAllModules = (targetList) => {
  targetList.length = 0;
};

const loadUsers = async () => {
  isLoading.value = true;
  try {
    let url = '/usuarios?';
    if (searchQuery.value) url += `search=${encodeURIComponent(searchQuery.value)}&`;
    if (selectedRoleFilter.value) url += `rol_id=${selectedRoleFilter.value}&`;

    const res = await apiFetch(url);
    if (res.success) {
      users.value = res.data;
    }
  } catch (err) {
    console.error('Error cargando usuarios:', err);
  } finally {
    isLoading.value = false;
  }
};

const filterByRole = (rolId) => {
  selectedRoleFilter.value = rolId;
  loadUsers();
};

const openCreateModal = () => {
  newUser.value = {
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    rol_id: 2,
    modulos_permitidos: ['pos', 'inventario', 'etiquetas', 'ventas', 'clientes']
  };
  isCreateModalOpen.value = true;
};

const submitCreateUser = async () => {
  isSubmitting.value = true;
  try {
    const res = await apiFetch('/usuarios', {
      method: 'POST',
      body: newUser.value
    });

    if (res.success) {
      alert(`Usuario "${res.data.nombre}" registrado exitosamente.`);
      isCreateModalOpen.value = false;
      loadUsers();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al registrar usuario');
  } finally {
    isSubmitting.value = false;
  }
};

const openEditModal = (user) => {
  editUserForm.value = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    telefono: user.telefono || '',
    rol_id: user.rol_id,
    estado: user.estado,
    password: '',
    modulos_permitidos: Array.isArray(user.modulos_permitidos) ? [...user.modulos_permitidos] : ['pos', 'inventario', 'etiquetas', 'ventas', 'clientes']
  };
  isEditModalOpen.value = true;
};

const submitEditUser = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      nombre: editUserForm.value.nombre,
      email: editUserForm.value.email,
      telefono: editUserForm.value.telefono,
      rol_id: editUserForm.value.rol_id,
      estado: editUserForm.value.estado,
      modulos_permitidos: editUserForm.value.modulos_permitidos
    };

    if (editUserForm.value.password && editUserForm.value.password.trim().length >= 6) {
      payload.password = editUserForm.value.password.trim();
    }

    const res = await apiFetch(`/usuarios/${editUserForm.value.id}`, {
      method: 'PUT',
      body: payload
    });

    if (res.success) {
      alert('Usuario actualizado exitosamente');
      isEditModalOpen.value = false;
      loadUsers();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al actualizar usuario');
  } finally {
    isSubmitting.value = false;
  }
};

// Modal rápido de permisos
const openPermissionsModal = (user) => {
  permissionsUser.value = user;
  permissionsList.value = Array.isArray(user.modulos_permitidos) 
    ? [...user.modulos_permitidos] 
    : ['pos', 'inventario', 'etiquetas', 'ventas', 'clientes'];
  isPermissionsModalOpen.value = true;
};

const savePermissions = async () => {
  if (!permissionsUser.value) return;
  isSubmitting.value = true;
  try {
    const res = await apiFetch(`/usuarios/${permissionsUser.value.id}`, {
      method: 'PUT',
      body: {
        modulos_permitidos: permissionsList.value
      }
    });

    if (res.success) {
      alert(`Permisos actualizados correctamente para ${permissionsUser.value.nombre}.`);
      isPermissionsModalOpen.value = false;
      loadUsers();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al actualizar permisos del usuario');
  } finally {
    isSubmitting.value = false;
  }
};

const toggleUserStatus = async (user) => {
  const accion = user.estado === 'ACTIVO' ? 'desactivar' : 'activar';
  if (!confirm(`¿Estás seguro de ${accion} al usuario ${user.nombre}?`)) return;

  try {
    const res = await apiFetch(`/usuarios/${user.id}/toggle-estado`, {
      method: 'PATCH'
    });
    if (res.success) {
      loadUsers();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al cambiar estado del usuario');
  }
};

onMounted(() => {
  loadUsers();

  // Sincronización en tiempo real
  onEvent('pos:user_created', () => loadUsers());
  onEvent('pos:user_updated', () => loadUsers());
});
</script>
