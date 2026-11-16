<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans">
    
    <!-- Cabecera de Página -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Directorio de Clientes y Programa de Lealtad</h1>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            Fidelización Ópalo
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">Gestión de clientas, historial de compras, acumulación de puntos y beneficios VIP</p>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="exportToCSV"
          class="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          title="Exportar directorio de clientas a archivo CSV"
        >
          <span>📥</span>
          <span>Exportar</span>
        </button>

        <button 
          @click="openNewCustomerModal"
          class="px-4 py-2.5 bg-opalo-600 hover:bg-opalo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span>
          <span>Registrar Clienta</span>
        </button>
      </div>
    </div>

    <!-- 4 Tarjetas de Métricas en Vivo -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Total Clientas</p>
          <p class="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{{ resumenStats.total_clientes }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5 font-medium">{{ resumenStats.clientes_con_puntos }} con puntos activos</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">👥</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Puntos en Circulación</p>
          <p class="text-xl sm:text-2xl font-black text-rose-600 mt-0.5 font-mono">💎 {{ resumenStats.total_puntos }}</p>
          <p class="text-[10px] text-rose-500 mt-0.5 font-medium">1 pt = L. 50 gastados</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shrink-0">✨</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Clientas VIP / Frecuentes</p>
          <p class="text-xl sm:text-2xl font-black text-purple-600 mt-0.5">{{ resumenStats.clientes_vip }}</p>
          <p class="text-[10px] text-purple-500 mt-0.5 font-medium">Nivel Plata, Oro y Diamante</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0">👑</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Ventas Fidelizadas</p>
          <p class="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 font-mono">L. {{ Number(resumenStats.ventas_fidelizadas).toFixed(2) }}</p>
          <p class="text-[10px] text-emerald-500 mt-0.5 font-medium">Consumo acumulado</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">🛍️</span>
      </div>
    </div>

    <!-- Banner Informativo del Programa de Lealtad (Niveles) -->
    <div class="bg-gradient-to-r from-slate-900 via-opalo-950 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="text-base">💎</span>
          <h2 class="text-sm font-black tracking-wide uppercase">Programa de Beneficios & Niveles Ópalo</h2>
        </div>
        <p class="text-xs text-slate-300 max-w-xl">
          Tus clientas acumulan <strong>1 punto de lealtad por cada L. 50.00</strong> en cada compra. Pueden canjear sus puntos por descuentos directos en caja.
        </p>
      </div>

      <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 md:pb-0 text-xs">
        <div class="bg-white/10 px-3 py-2 rounded-2xl border border-white/10 shrink-0 text-center min-w-[90px]">
          <p class="text-xs">🥉</p>
          <p class="font-extrabold text-[11px] text-amber-200">Bronce</p>
          <p class="text-[9px] text-slate-400">0 - 49 pts</p>
        </div>
        <div class="bg-white/10 px-3 py-2 rounded-2xl border border-white/10 shrink-0 text-center min-w-[90px]">
          <p class="text-xs">🥈</p>
          <p class="font-extrabold text-[11px] text-slate-200">Plata</p>
          <p class="text-[9px] text-slate-400">50 - 149 pts</p>
        </div>
        <div class="bg-white/10 px-3 py-2 rounded-2xl border border-white/10 shrink-0 text-center min-w-[90px]">
          <p class="text-xs">🥇</p>
          <p class="font-extrabold text-[11px] text-amber-300">Oro</p>
          <p class="text-[9px] text-slate-400">150 - 299 pts</p>
        </div>
        <div class="bg-white/10 px-3 py-2 rounded-2xl border border-white/10 shrink-0 text-center min-w-[90px]">
          <p class="text-xs">💎</p>
          <p class="font-extrabold text-[11px] text-cyan-200">Diamante</p>
          <p class="text-[9px] text-slate-400">300+ pts</p>
        </div>
      </div>
    </div>

    <!-- Barra de Búsqueda y Filtros de Segmentación -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
      <div class="relative flex-1 w-full">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar clienta por nombre, teléfono, RTN/DNI, correo o código QR..."
          @input="debounceSearch"
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-medium"
        />
      </div>

      <div class="flex items-center space-x-1.5 shrink-0 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        <button 
          @click="filterByNivel(null)"
          :class="selectedNivel === null ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
        >
          Todas
        </button>
        <button 
          @click="filterByNivel('BRONCE')"
          :class="selectedNivel === 'BRONCE' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
        >
          🥉 Bronce
        </button>
        <button 
          @click="filterByNivel('PLATA')"
          :class="selectedNivel === 'PLATA' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
        >
          🥈 Plata
        </button>
        <button 
          @click="filterByNivel('ORO')"
          :class="selectedNivel === 'ORO' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
        >
          🥇 Oro
        </button>
        <button 
          @click="filterByNivel('DIAMANTE')"
          :class="selectedNivel === 'DIAMANTE' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
        >
          💎 Diamante VIP
        </button>
      </div>
    </div>

    <!-- Tabla Maestra de Clientas -->
    <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <th class="py-3.5 px-4 min-w-[200px]">Clienta & Contacto</th>
              <th class="py-3.5 px-4 min-w-[140px]">Documento / DNI</th>
              <th class="py-3.5 px-4 min-w-[150px]">Código QR Lealtad</th>
              <th class="py-3.5 px-4 min-w-[160px]">Nivel & Puntos</th>
              <th class="py-3.5 px-4 min-w-[140px]">Historial de Compra</th>
              <th class="py-3.5 px-4 text-center">Estado</th>
              <th class="py-3.5 px-4 text-right min-w-[200px]">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <!-- Cargando -->
            <tr v-if="isLoading" class="text-center py-10">
              <td colspan="7" class="py-10 text-slate-400 font-semibold">
                <span class="inline-block animate-spin text-lg mb-1">⏳</span>
                <p>Cargando directorio de clientas...</p>
              </td>
            </tr>

            <!-- Sin resultados -->
            <tr v-else-if="customers.length === 0" class="text-center py-10">
              <td colspan="7" class="py-10 text-slate-400">
                <span class="text-3xl block mb-2">💎</span>
                <p class="font-bold text-slate-700 text-sm">No se encontraron clientas registradas</p>
                <p class="text-xs text-slate-400 mt-1">Haz clic en "+ Registrar Clienta" para dar de alta socias en el programa</p>
              </td>
            </tr>

            <!-- Filas de Clientas -->
            <tr v-for="c in customers" :key="c.id" class="hover:bg-slate-50/80 transition-colors group">
              <!-- 1. Clienta, Avatar & WhatsApp -->
              <td class="py-3.5 px-4">
                <div class="flex items-center space-x-3">
                  <div 
                    class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border shadow-2xs"
                    :class="getTierBadgeClass(c.puntos_lealtad)"
                  >
                    {{ c.nombre.charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-extrabold text-sm text-slate-900 group-hover:text-opalo-700 transition leading-snug truncate max-w-[180px]">
                      {{ c.nombre }}
                    </h3>
                    <p class="text-[11px] text-slate-400 truncate max-w-[180px]">
                      {{ c.email || 'Sin correo electrónico' }}
                    </p>
                    <div v-if="c.telefono" class="flex items-center gap-1 mt-0.5">
                      <a 
                        :href="getWhatsAppLink(c)" 
                        target="_blank"
                        class="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.2 rounded hover:underline"
                        title="Enviar mensaje de WhatsApp a la clienta"
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </td>

              <!-- 2. Documento RTN / Teléfono -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <p class="font-mono font-bold text-slate-800 text-xs">
                    {{ c.rtn_dni || 'Consumidor Final' }}
                  </p>
                  <p class="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <span>📞</span>
                    <span>{{ c.telefono || 'Sin teléfono' }}</span>
                  </p>
                </div>
              </td>

              <!-- 3. Código QR de Lealtad -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <div class="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-800 border border-slate-200">
                    <span>📱</span>
                    <span class="truncate max-w-[120px]">{{ c.codigo_qr_lealtad || 'N/A' }}</span>
                  </div>
                  <button 
                    @click="openLoyaltyCardModal(c)"
                    class="block text-[10px] font-bold text-opalo-600 hover:underline cursor-pointer"
                  >
                    Ver Credencial QR →
                  </button>
                </div>
              </td>

              <!-- 4. Puntos & Nivel de Lealtad -->
              <td class="py-3.5 px-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-2xs border bg-rose-50 text-rose-700 border-rose-200">
                      💎 {{ c.puntos_lealtad }} pts
                    </span>
                    <span 
                      class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider"
                      :class="getTierBadgeClass(c.puntos_lealtad)"
                    >
                      {{ getTierName(c.puntos_lealtad) }}
                    </span>
                  </div>

                  <!-- Barra de Progreso hacia el siguiente nivel -->
                  <div class="w-full max-w-[140px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      class="bg-gradient-to-r from-opalo-500 to-rose-500 h-full rounded-full transition-all duration-500"
                      :style="{ width: `${getTierProgress(c.puntos_lealtad)}%` }"
                    ></div>
                  </div>
                  <p class="text-[9px] text-slate-400 font-medium">
                    {{ getTierNextRequirement(c.puntos_lealtad) }}
                  </p>
                </div>
              </td>

              <!-- 5. Métricas de Compra -->
              <td class="py-3.5 px-4">
                <div class="space-y-0.5 font-mono">
                  <p class="text-xs font-black text-slate-900">
                    L. {{ Number(c.total_gastado || 0).toFixed(2) }}
                  </p>
                  <p class="text-[11px] font-sans text-slate-500">
                    {{ c.total_compras || 0 }} {{ c.total_compras === 1 ? 'compra' : 'compras' }}
                  </p>
                  <p v-if="c.ultima_compra" class="text-[10px] font-sans text-slate-400">
                    Última: {{ new Date(c.ultima_compra).toLocaleDateString('es-HN') }}
                  </p>
                </div>
              </td>

              <!-- 6. Estado -->
              <td class="py-3.5 px-4 text-center">
                <span 
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  :class="c.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="c.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                  {{ c.estado }}
                </span>
              </td>

              <!-- 7. Acciones Rápidas -->
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center justify-end bg-slate-50/90 p-1 rounded-2xl border border-slate-200 shadow-2xs gap-1">
                  <!-- 1. Ver Perfil e Historial -->
                  <button 
                    @click="openProfileModal(c)"
                    class="h-7 px-2.5 rounded-xl bg-white hover:bg-opalo-50 text-slate-700 hover:text-opalo-700 font-bold text-[11px] transition border border-slate-200/80 hover:border-opalo-300 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                    title="Ver perfil completo e historial de compras"
                  >
                    <span>👁️</span>
                    <span>Perfil</span>
                  </button>

                  <!-- 2. Ajustar / Canjear Puntos -->
                  <button 
                    @click="openPointsModal(c)"
                    class="h-7 px-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-[11px] transition border border-slate-200/80 hover:border-rose-300 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                    title="Acreditar puntos de cortesía o canjear puntos acumulados"
                  >
                    <span>💎</span>
                    <span>Puntos</span>
                  </button>

                  <!-- 3. Editar Clienta -->
                  <button 
                    @click="openEditModal(c)"
                    class="h-7 px-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition border border-slate-200/80 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                    title="Editar información de contacto y RTN"
                  >
                    <span>✏️</span>
                    <span>Editar</span>
                  </button>

                  <!-- 4. Toggle Estado -->
                  <button 
                    @click="toggleCustomerStatus(c)"
                    class="h-7 px-2 rounded-xl font-bold text-[10px] transition cursor-pointer"
                    :class="c.estado === 'ACTIVO' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'"
                    :title="c.estado === 'ACTIVO' ? 'Desactivar clienta' : 'Activar clienta'"
                  >
                    {{ c.estado === 'ACTIVO' ? '✕' : '✓' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pie de Tabla con Resumen -->
      <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
        <span>Mostrando <strong>{{ customers.length }}</strong> clientas registradas</span>
        <span class="text-[11px] text-slate-400">Ópalo Accesorios • Directorio Fidelizado de Clientes</span>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 1: REGISTRAR / EDITAR CLIENTA                                  -->
    <!-- ===================================================================== -->
    <div v-if="isCustomerModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-opalo-50 text-opalo-600 flex items-center justify-center text-xl font-black">
              {{ editingCustomerId ? '✏️' : '💎' }}
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900">
                {{ editingCustomerId ? 'Editar Datos de la Clienta' : 'Registrar Nueva Clienta' }}
              </h3>
              <p class="text-xs text-slate-400">Directorio y asignación al programa de lealtad Ópalo</p>
            </div>
          </div>
          <button @click="isCustomerModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <form @submit.prevent="saveCustomer" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
            <input 
              v-model="customerForm.nombre" 
              type="text" 
              required 
              placeholder="Ej: Katherine Melissa Peña"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-semibold"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">DNI o RTN (Opcional para Factura)</label>
              <input 
                v-model="customerForm.rtn_dni" 
                type="text" 
                placeholder="0209-1995-00123"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-mono"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Teléfono Móvil (WhatsApp)</label>
              <input 
                v-model="customerForm.telefono" 
                type="text" 
                placeholder="+504 9999-0000"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
            <input 
              v-model="customerForm.email" 
              type="email" 
              placeholder="cliente@gmail.com"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Dirección / Ciudad</label>
            <input 
              v-model="customerForm.direccion" 
              type="text" 
              placeholder="Barrio El Centro, Tocoa, Colón"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <div v-if="editingCustomerId">
            <label class="block font-bold text-slate-700 mb-1">Código QR de Lealtad</label>
            <input 
              v-model="customerForm.codigo_qr_lealtad" 
              type="text" 
              class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-mono text-xs"
            />
          </div>

          <p class="text-[10px] text-slate-400 italic">
            * Al registrar una clienta, el sistema le asigna un código QR único para que acumule puntos automáticamente en cada venta.
          </p>

          <button 
            type="submit" 
            :disabled="isSaving"
            class="w-full mt-2 py-3 bg-opalo-600 hover:bg-opalo-700 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
          >
            {{ isSaving ? 'Guardando...' : (editingCustomerId ? 'Guardar Cambios' : 'Crear Clienta y Asignar QR') }}
          </button>
        </form>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 2: PERFIL DE CLIENTA E HISTORIAL COMPLETO DE COMPRAS           -->
    <!-- ===================================================================== -->
    <div v-if="isProfileModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
        
        <div class="flex items-start justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-3">
            <div 
              class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border shadow-sm"
              :class="getTierBadgeClass(selectedCustomer?.puntos_lealtad)"
            >
              {{ selectedCustomer?.nombre?.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">{{ selectedCustomer?.nombre }}</h3>
              <p class="text-xs text-slate-500">{{ selectedCustomer?.email || 'Sin correo registrado' }} • {{ selectedCustomer?.telefono || 'Sin teléfono' }}</p>
            </div>
          </div>
          <button @click="isProfileModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <!-- Tarjetas Resumen del Cliente -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
            <p class="text-[10px] font-extrabold uppercase text-slate-400">Puntos</p>
            <p class="text-base font-black text-rose-600 font-mono mt-0.5">💎 {{ selectedCustomer?.puntos_lealtad || 0 }}</p>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
            <p class="text-[10px] font-extrabold uppercase text-slate-400">Nivel</p>
            <p class="text-xs font-black text-slate-800 uppercase mt-1">
              {{ getTierName(selectedCustomer?.puntos_lealtad) }}
            </p>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
            <p class="text-[10px] font-extrabold uppercase text-slate-400">Total Gastado</p>
            <p class="text-base font-black text-slate-900 font-mono mt-0.5">L. {{ Number(selectedCustomer?.total_gastado || 0).toFixed(0) }}</p>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
            <p class="text-[10px] font-extrabold uppercase text-slate-400">Compras</p>
            <p class="text-base font-black text-slate-900 font-mono mt-0.5">{{ selectedCustomer?.total_compras || 0 }}</p>
          </div>
        </div>

        <!-- Tarjeta QR Lealtad del Cliente -->
        <div class="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="space-y-1 text-center sm:text-left">
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/20 uppercase tracking-widest text-cyan-200">
              Tarjeta de Fidelización
            </span>
            <p class="font-mono text-sm font-black">{{ selectedCustomer?.codigo_qr_lealtad }}</p>
            <p class="text-[11px] text-slate-400">Escanear este código en caja para acumular puntos automáticamente</p>
          </div>
          <button 
            @click="openLoyaltyCardModal(selectedCustomer)" 
            class="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl text-xs hover:bg-slate-100 transition shadow-xs cursor-pointer shrink-0"
          >
            Imprimir Credencial 🖨️
          </button>
        </div>

        <!-- Historial de Facturas y Compras -->
        <div class="space-y-2">
          <h4 class="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
            <span>🧾</span>
            <span>Historial de Compras Recientes</span>
          </h4>

          <div v-if="!selectedCustomer?.ultimas_compras || selectedCustomer.ultimas_compras.length === 0" class="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl">
            <p class="text-xs">Esta clienta aún no tiene facturas registradas en el sistema.</p>
          </div>

          <div v-else class="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                <tr>
                  <th class="py-2.5 px-3">Factura</th>
                  <th class="py-2.5 px-3">Fecha</th>
                  <th class="py-2.5 px-3">Cajero</th>
                  <th class="py-2.5 px-3">Método</th>
                  <th class="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="sale in selectedCustomer.ultimas_compras" :key="sale.id" class="hover:bg-slate-50">
                  <td class="py-2.5 px-3 font-mono font-bold text-slate-800">{{ sale.numero_factura }}</td>
                  <td class="py-2.5 px-3 text-slate-500">{{ new Date(sale.created_at).toLocaleString('es-HN') }}</td>
                  <td class="py-2.5 px-3 text-slate-600">{{ sale.cajero_nombre || 'Cajero' }}</td>
                  <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {{ sale.metodo_pago }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                    L. {{ Number(sale.total).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 3: AJUSTE Y CANJE MANUAL DE PUNTOS                             -->
    <!-- ===================================================================== -->
    <div v-if="isPointsModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2.5">
            <span class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-base font-black">
              💎
            </span>
            <div>
              <h3 class="text-sm font-black text-slate-900">Gestionar Puntos de Lealtad</h3>
              <p class="text-[11px] text-slate-400">Clienta: <strong>{{ pointsCustomer?.nombre }}</strong></p>
            </div>
          </div>
          <button @click="isPointsModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <!-- Saldo Actual -->
        <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <p class="text-[10px] font-extrabold uppercase text-slate-400">Saldo Actual Disponible</p>
            <p class="text-xl font-black text-rose-600 font-mono mt-0.5">💎 {{ pointsCustomer?.puntos_lealtad || 0 }} pts</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-lg font-bold" :class="getTierBadgeClass(pointsCustomer?.puntos_lealtad)">
            {{ getTierName(pointsCustomer?.puntos_lealtad) }}
          </span>
        </div>

        <form @submit.prevent="submitPointsAdjust" class="space-y-3">
          <!-- Selector: Sumar o Canjear -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">Acción a Realizar *</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                @click="pointsForm.tipo = 'SUMAR'"
                :class="pointsForm.tipo === 'SUMAR' ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-700 font-bold hover:bg-slate-200'"
                class="py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>➕</span>
                <span>Acreditar Puntos</span>
              </button>

              <button 
                type="button" 
                @click="pointsForm.tipo = 'CANJEAR'"
                :class="pointsForm.tipo === 'CANJEAR' ? 'bg-rose-600 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-700 font-bold hover:bg-slate-200'"
                class="py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🎁</span>
                <span>Canjear Puntos</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Cantidad de Puntos *</label>
            <input 
              v-model.number="pointsForm.puntos" 
              type="number" 
              required 
              min="1" 
              :max="pointsForm.tipo === 'CANJEAR' ? pointsCustomer?.puntos_lealtad : 9999"
              placeholder="Ej: 50"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-mono font-bold text-sm"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Motivo o Justificación *</label>
            <input 
              v-model="pointsForm.motivo" 
              type="text" 
              required 
              placeholder="Ej: Bono de cumpleaños / Descuento canjeado en tienda"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <div class="p-2.5 bg-blue-50 rounded-xl text-[11px] text-blue-800 border border-blue-200 flex items-start gap-1.5">
            <span>ℹ️</span>
            <p>
              Nuevo saldo proyectado: 
              <strong>
                {{ pointsForm.tipo === 'SUMAR' ? (pointsCustomer?.puntos_lealtad + (pointsForm.puntos || 0)) : Math.max(0, pointsCustomer?.puntos_lealtad - (pointsForm.puntos || 0)) }} pts
              </strong>
            </p>
          </div>

          <button 
            type="submit" 
            :disabled="isSaving || (pointsForm.tipo === 'CANJEAR' && pointsCustomer?.puntos_lealtad < pointsForm.puntos)"
            class="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
          >
            {{ isSaving ? 'Guardando...' : 'Aplicar Ajuste de Puntos' }}
          </button>
        </form>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 4: TARJETA DIGITAL DE LEALTAD IMPRIMIBLE                      -->
    <!-- ===================================================================== -->
    <div v-if="isCardModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
        
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider">Credencial de Lealtad</h3>
          <button @click="isCardModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <!-- Tarjeta Física Virtual (Elegante y lista para imprimir) -->
        <div id="loyalty-card-print" class="bg-gradient-to-tr from-slate-900 via-opalo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-white/20 text-left relative overflow-hidden">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-lg">👗</span>
              <span class="font-black text-sm tracking-widest uppercase text-white">ÓPALO</span>
            </div>
            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-cyan-200">
              {{ getTierName(cardCustomer?.puntos_lealtad) }}
            </span>
          </div>

          <div class="py-2">
            <p class="text-[10px] text-slate-400 uppercase tracking-wider">Socia del Programa</p>
            <h4 class="text-base font-black text-white leading-tight truncate">{{ cardCustomer?.nombre }}</h4>
            <p class="text-xs text-slate-300 font-mono mt-0.5">{{ cardCustomer?.rtn_dni || 'Cliente Frecuente' }}</p>
          </div>

          <div class="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-slate-900">
            <!-- Representación QR Escaneable -->
            <div class="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-2 text-center">
              <span class="text-3xl mb-1">📱</span>
              <span class="text-[9px] font-mono font-black break-all text-slate-700">{{ cardCustomer?.codigo_qr_lealtad }}</span>
            </div>
            <p class="text-[9px] text-slate-400 mt-1 font-semibold uppercase">Escanear para acumular puntos</p>
          </div>

          <div class="flex items-center justify-between text-[11px] pt-1 border-t border-white/10 text-slate-300">
            <span>Tocoa, Colón, Honduras</span>
            <span class="font-bold text-rose-300">💎 {{ cardCustomer?.puntos_lealtad || 0 }} pts</span>
          </div>
        </div>

        <button 
          @click="printLoyaltyCard"
          class="w-full py-2.5 bg-opalo-600 hover:bg-opalo-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
        >
          🖨️ Imprimir Credencial de Clienta
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { onEvent } = useSocket();

const customers = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedNivel = ref(null);

const resumenStats = ref({
  total_clientes: 0,
  total_puntos: 0,
  clientes_vip: 0,
  clientes_con_puntos: 0,
  ventas_fidelizadas: 0
});

// Modales
const isCustomerModalOpen = ref(false);
const isProfileModalOpen = ref(false);
const isPointsModalOpen = ref(false);
const isCardModalOpen = ref(false);

const isSaving = ref(false);
const editingCustomerId = ref(null);

const selectedCustomer = ref(null);
const pointsCustomer = ref(null);
const cardCustomer = ref(null);

const customerForm = ref({
  nombre: '',
  rtn_dni: '',
  telefono: '',
  email: '',
  direccion: '',
  codigo_qr_lealtad: ''
});

const pointsForm = ref({
  tipo: 'SUMAR',
  puntos: 10,
  motivo: ''
});

// Temporizador para búsqueda debounce
let searchTimeout = null;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadCustomers();
  }, 300);
};

// Cargar listado de clientas y estadísticas
const loadCustomers = async () => {
  isLoading.value = true;
  try {
    let url = '/clientes?limit=100';
    if (searchQuery.value) {
      url += `&search=${encodeURIComponent(searchQuery.value)}`;
    }
    if (selectedNivel.value) {
      url += `&nivel=${selectedNivel.value}`;
    }

    const res = await apiFetch(url);
    if (res.success) {
      customers.value = res.data;
      if (res.resumen) {
        resumenStats.value = res.resumen;
      }
    }
  } catch (err) {
    console.error('Error cargando clientas:', err);
  } finally {
    isLoading.value = false;
  }
};

const filterByNivel = (nivel) => {
  selectedNivel.value = nivel;
  loadCustomers();
};

// Cálculo de niveles de lealtad
const getTierName = (pts = 0) => {
  const p = Number(pts || 0);
  if (p >= 300) return 'Diamante VIP';
  if (p >= 150) return 'Oro';
  if (p >= 50) return 'Plata';
  return 'Bronce';
};

const getTierBadgeClass = (pts = 0) => {
  const p = Number(pts || 0);
  if (p >= 300) return 'bg-cyan-100 text-cyan-800 border-cyan-300';
  if (p >= 150) return 'bg-amber-100 text-amber-800 border-amber-300';
  if (p >= 50) return 'bg-slate-200 text-slate-800 border-slate-300';
  return 'bg-amber-50 text-amber-800 border-amber-200';
};

const getTierProgress = (pts = 0) => {
  const p = Number(pts || 0);
  if (p >= 300) return 100;
  if (p >= 150) return Math.min(100, Math.round(((p - 150) / 150) * 100));
  if (p >= 50) return Math.min(100, Math.round(((p - 50) / 100) * 100));
  return Math.min(100, Math.round((p / 50) * 100));
};

const getTierNextRequirement = (pts = 0) => {
  const p = Number(pts || 0);
  if (p >= 300) return 'Máximo nivel VIP alcanzado ✨';
  if (p >= 150) return `Faltan ${300 - p} pts para Diamante`;
  if (p >= 50) return `Faltan ${150 - p} pts para Oro`;
  return `Faltan ${50 - p} pts para Plata`;
};

// Enlace directo a WhatsApp
const getWhatsAppLink = (c) => {
  const tel = (c.telefono || '').replace(/[^0-9]/g, '');
  const msg = encodeURIComponent(`¡Hola ${c.nombre}! Te saludamos de Ópalo Accesorios. Tienes ${c.puntos_lealtad || 0} puntos de lealtad acumulados disponibles para tu próxima compra.`);
  return `https://wa.me/${tel}?text=${msg}`;
};

// Modal Crear
const openNewCustomerModal = () => {
  editingCustomerId.value = null;
  customerForm.value = {
    nombre: '',
    rtn_dni: '',
    telefono: '',
    email: '',
    direccion: '',
    codigo_qr_lealtad: ''
  };
  isCustomerModalOpen.value = true;
};

// Modal Editar
const openEditModal = (c) => {
  editingCustomerId.value = c.id;
  customerForm.value = {
    nombre: c.nombre,
    rtn_dni: c.rtn_dni || '',
    telefono: c.telefono || '',
    email: c.email || '',
    direccion: c.direccion || '',
    codigo_qr_lealtad: c.codigo_qr_lealtad || ''
  };
  isCustomerModalOpen.value = true;
};

// Guardar Clienta (Crear o Editar)
const saveCustomer = async () => {
  isSaving.value = true;
  try {
    if (editingCustomerId.value) {
      const res = await apiFetch(`/clientes/${editingCustomerId.value}`, {
        method: 'PUT',
        body: customerForm.value
      });
      if (res.success) {
        alert('Datos de la clienta actualizados correctamente');
        isCustomerModalOpen.value = false;
        loadCustomers();
      }
    } else {
      const res = await apiFetch('/clientes', {
        method: 'POST',
        body: customerForm.value
      });
      if (res.success) {
        alert(`Clienta registrada exitosamente con código QR: ${res.data.codigo_qr_lealtad}`);
        isCustomerModalOpen.value = false;
        loadCustomers();
      }
    }
  } catch (err) {
    alert(err?.data?.message || 'Error guardando clienta');
  } finally {
    isSaving.value = false;
  }
};

// Modal Perfil e Historial
const openProfileModal = async (c) => {
  try {
    const res = await apiFetch(`/clientes/${c.id}`);
    if (res.success) {
      selectedCustomer.value = res.data;
      isProfileModalOpen.value = true;
    }
  } catch (err) {
    alert('Error al obtener perfil de la clienta');
  }
};

// Modal Ajustar / Canjear Puntos
const openPointsModal = (c) => {
  pointsCustomer.value = c;
  pointsForm.value = {
    tipo: 'SUMAR',
    puntos: 10,
    motivo: 'Cortesía por fidelidad'
  };
  isPointsModalOpen.value = true;
};

const submitPointsAdjust = async () => {
  if (!pointsCustomer.value) return;
  isSaving.value = true;
  try {
    const res = await apiFetch(`/clientes/${pointsCustomer.value.id}/ajustar-puntos`, {
      method: 'POST',
      body: pointsForm.value
    });
    if (res.success) {
      alert(res.message);
      isPointsModalOpen.value = false;
      loadCustomers();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al ajustar puntos');
  } finally {
    isSaving.value = false;
  }
};

// Activar o desactivar clienta
const toggleCustomerStatus = async (c) => {
  const accion = c.estado === 'ACTIVO' ? 'desactivar' : 'activar';
  if (!confirm(`¿Estás seguro de ${accion} a la clienta "${c.nombre}"?`)) return;

  try {
    const res = await apiFetch(`/clientes/${c.id}/toggle-estado`, {
      method: 'PATCH'
    });
    if (res.success) {
      loadCustomers();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al cambiar estado');
  }
};

// Modal Tarjeta Credencial
const openLoyaltyCardModal = (c) => {
  cardCustomer.value = c;
  isCardModalOpen.value = true;
};

const printLoyaltyCard = () => {
  window.print();
};

// Exportar a CSV
const exportToCSV = () => {
  if (customers.value.length === 0) {
    alert('No hay clientas para exportar');
    return;
  }
  const headers = ['ID', 'Nombre', 'RTN/DNI', 'Telefono', 'Email', 'Direccion', 'Codigo_QR', 'Puntos', 'Nivel', 'Total_Gastado', 'Total_Compras', 'Estado'];
  const rows = customers.value.map(c => [
    c.id,
    `"${(c.nombre || '').replace(/"/g, '""')}"`,
    `"${c.rtn_dni || ''}"`,
    `"${c.telefono || ''}"`,
    `"${c.email || ''}"`,
    `"${(c.direccion || '').replace(/"/g, '""')}"`,
    `"${c.codigo_qr_lealtad || ''}"`,
    c.puntos_lealtad || 0,
    getTierName(c.puntos_lealtad),
    c.total_gastado || 0,
    c.total_compras || 0,
    c.estado
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Directorio_Clientas_Opalo_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  loadCustomers();

  // Sincronización en tiempo real
  onEvent('pos:customer_created', () => loadCustomers());
  onEvent('pos:customer_updated', () => loadCustomers());
  onEvent('pos:sale_created', () => loadCustomers());
});
</script>
