<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
    
    <!-- Cabecera de Página -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
      <div>
        <div class="flex items-center space-x-3">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-opalo-600 to-rose-400 flex items-center justify-center text-white text-xl shadow-md shadow-opalo-200 shrink-0">
            🧾
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Historial de Ventas y Cierre de Caja</h1>
            <p class="text-xs text-slate-500 font-medium">
              Control de ingresos, arqueo de caja y gestión de devoluciones con reintegro a inventario
            </p>
          </div>
        </div>
      </div>

      <!-- Filtro por Fecha y Botones Rápidos -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <input 
            v-model="selectedDate" 
            type="date" 
            @change="loadAllData"
            class="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-opalo-500"
          />
        </div>
        <button 
          @click="loadAllData" 
          title="Actualizar datos"
          class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>🔄</span>
          <span>Actualizar</span>
        </button>

        <!-- Botón Finalizar Día / Cierre de Caja -->
        <button 
          v-if="dashboardData?.cierre_caja?.turno_activo?.estado === 'ABIERTA'"
          @click="openFinalizarDiaModal" 
          class="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
          title="Realizar arqueo y finalizar el día cerrando la caja"
        >
          <span>🏁</span>
          <span>Finalizar Día</span>
        </button>
        <button 
          v-else-if="dashboardData?.cierre_caja?.turno_activo?.estado === 'CERRADA'"
          @click="printArqueoTicket(dashboardData?.cierre_caja?.turno_activo)" 
          class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
          title="Ver o reimprimir comprobante de arqueo de este día"
        >
          <span>🖨️</span>
          <span>Reimprimir Arqueo</span>
        </button>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- PANEL DESTACADO: INFORMACIÓN RESUMIDA PARA CUADRAR CAJA Y ARQUEO      -->
    <!-- ===================================================================== -->
    <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-700/80">
      
      <!-- Cabecera del Panel con Estado del Turno -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/80 gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl font-bold">
            ⚖️
          </div>
          <div>
            <h2 class="text-base font-black tracking-tight flex items-center gap-2">
              <span>Cuadre de Caja y Arqueo Diario</span>
              <span 
                v-if="dashboardData?.cierre_caja?.turno_activo?.estado === 'ABIERTA'"
                class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Turno Abierto (En Curso)
              </span>
              <span 
                v-else-if="dashboardData?.cierre_caja?.turno_activo?.estado === 'CERRADA'"
                class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30"
              >
                🔒 Día Finalizado (Caja Cerrada)
              </span>
              <span 
                v-else
                class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-700 text-slate-300"
              >
                Sin Turno Registrado
              </span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              <span v-if="dashboardData?.cierre_caja?.turno_activo?.usuario_nombre">
                Cajero: <b class="text-white font-bold">{{ dashboardData.cierre_caja.turno_activo.usuario_nombre }}</b> •
              </span>
              <span>Apertura: {{ formatDateTime(dashboardData?.cierre_caja?.turno_activo?.fecha_apertura) || 'Hoy' }}</span>
              <span v-if="dashboardData?.cierre_caja?.turno_activo?.estado === 'CERRADA'">
                • Cierre: {{ formatDateTime(dashboardData.cierre_caja.turno_activo.fecha_cierre) }}
              </span>
            </p>
          </div>
        </div>

        <!-- Botón de Acción en el Panel -->
        <div>
          <button 
            v-if="dashboardData?.cierre_caja?.turno_activo?.estado === 'ABIERTA'"
            @click="openFinalizarDiaModal" 
            class="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
          >
            <span>🏁</span>
            <span>Finalizar Día / Cerrar Caja</span>
          </button>
          <button 
            v-else-if="dashboardData?.cierre_caja?.turno_activo?.estado === 'CERRADA'"
            @click="printArqueoTicket(dashboardData?.cierre_caja?.turno_activo)" 
            class="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🖨️</span>
            <span>Reimprimir Arqueo Térmico</span>
          </button>
        </div>
      </div>

      <!-- Grid de Cuadre: Columna 1 (Efectivo en Gaveta) vs Columna 2 (Ingresos Totales) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5">
        
        <!-- COLUMNA 1: CUADRE DE EFECTIVO FÍSICO EN GAVETA (FÓRMULA CLAVE) -->
        <div class="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-700">
            <span class="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <span>💵</span>
              <span>Cuadre de Efectivo Físico en Gaveta</span>
            </span>
            <span class="text-[10px] text-slate-400 font-mono">Arqueo de Gaveta</span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center text-slate-300">
              <span class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md bg-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Fondo Inicial de Apertura:</span>
              </span>
              <span class="font-mono font-bold text-white">L. {{ (dashboardData?.cierre_caja?.fondo_inicial_caja || 0).toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center text-emerald-400">
              <span class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">+</span>
                <span>Ventas Cobradas en Efectivo:</span>
              </span>
              <span class="font-mono font-extrabold">+ L. {{ (dashboardData?.cierre_caja?.ventas_efectivo || 0).toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center text-rose-400">
              <span class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] font-bold">-</span>
                <span>Salidas de Caja (Vales / Gastos):</span>
                <span v-if="dashboardData?.cierre_caja?.salidas_efectivo_cantidad > 0" class="text-[9px] bg-rose-500/20 px-1 rounded text-rose-300">
                  {{ dashboardData.cierre_caja.salidas_efectivo_cantidad }} vales
                </span>
              </span>
              <span class="font-mono font-extrabold">- L. {{ (dashboardData?.cierre_caja?.salidas_efectivo_total || 0).toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center text-rose-300">
              <span class="flex items-center gap-1.5">
                <span class="w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] font-bold">-</span>
                <span>Devoluciones Pagadas en Efectivo:</span>
              </span>
              <span class="font-mono font-extrabold">- L. {{ (dashboardData?.cierre_caja?.devoluciones_efectivo_total || 0).toFixed(2) }}</span>
            </div>
          </div>

          <!-- Total Esperado en Gaveta -->
          <div class="pt-3 border-t border-slate-700 flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-amber-500/20">
            <div>
              <p class="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                Efectivo Físico que Debe Haber en Gaveta:
              </p>
              <p class="text-[10px] text-slate-400">Dinero exacto a contar físicamente para cuadrar</p>
            </div>
            <p class="text-xl font-black text-amber-300 font-mono">
              L. {{ (dashboardData?.cierre_caja?.efectivo_esperado_gaveta || 0).toFixed(2) }}
            </p>
          </div>

          <!-- Si el turno ya está cerrado, mostrar resultado del conteo -->
          <div v-if="dashboardData?.cierre_caja?.turno_activo?.estado === 'CERRADA'" class="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div class="bg-slate-900/40 p-2.5 rounded-xl border border-slate-700">
              <p class="text-[10px] text-slate-400">Efectivo Real Contado:</p>
              <p class="text-sm font-bold text-white font-mono">
                L. {{ parseFloat(dashboardData?.cierre_caja?.turno_activo?.monto_final_real || 0).toFixed(2) }}
              </p>
            </div>
            <div 
              class="p-2.5 rounded-xl border font-mono"
              :class="parseFloat(dashboardData?.cierre_caja?.turno_activo?.diferencia || 0) === 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : parseFloat(dashboardData?.cierre_caja?.turno_activo?.diferencia || 0) > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'"
            >
              <p class="text-[10px]">Diferencia de Cuadre:</p>
              <p class="text-sm font-black">
                {{ parseFloat(dashboardData?.cierre_caja?.turno_activo?.diferencia || 0) > 0 ? '+' : '' }}L. {{ parseFloat(dashboardData?.cierre_caja?.turno_activo?.diferencia || 0).toFixed(2) }}
                <span class="text-[10px] font-sans font-bold">
                  {{ parseFloat(dashboardData?.cierre_caja?.turno_activo?.diferencia || 0) === 0 ? '(Exacto)' : parseFloat(dashboardData?.cierre_caja?.turno_activo?.diferencia || 0) > 0 ? '(Sobrante)' : '(Faltante)' }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- COLUMNA 2: RESUMEN GENERAL DE INGRESOS Y RESULTADO NETO -->
        <div class="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-700">
            <span class="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
              <span>💳</span>
              <span>Canales de Cobro y Facturación del Día</span>
            </span>
            <span class="text-[10px] text-slate-400 font-mono">{{ dashboardData?.cierre_caja?.ventas_realizadas || 0 }} Ventas</span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center text-slate-300">
              <span class="flex items-center gap-1.5">
                <span>💵 Efectivo Registrado:</span>
              </span>
              <span class="font-mono font-bold text-white">L. {{ (dashboardData?.cierre_caja?.ventas_efectivo || 0).toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center text-slate-300">
              <span class="flex items-center gap-1.5">
                <span>💳 Tarjeta (POS Bancario):</span>
              </span>
              <span class="font-mono font-bold text-white">L. {{ (dashboardData?.cierre_caja?.ventas_tarjeta || 0).toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center text-slate-300">
              <span class="flex items-center gap-1.5">
                <span>🏦 Transferencias Bancarias (BAC/Otros):</span>
              </span>
              <span class="font-mono font-bold text-white">L. {{ (dashboardData?.cierre_caja?.ventas_transferencia || 0).toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-700/60">
              <span>Total Facturado Bruto:</span>
              <span class="font-mono font-bold text-slate-200">L. {{ (dashboardData?.cierre_caja?.total_ingresos || 0).toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center text-rose-400">
              <span>Devoluciones Totales del Día:</span>
              <span class="font-mono font-bold">- L. {{ (dashboardData?.cierre_caja?.total_devoluciones_monto || 0).toFixed(2) }}</span>
            </div>
          </div>

          <!-- Total Ingreso Neto -->
          <div class="pt-3 border-t border-slate-700 flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-sky-500/20">
            <div>
              <p class="text-[10px] uppercase font-black text-sky-400 tracking-wider">
                Ingreso Neto Real del Negocio:
              </p>
              <p class="text-[10px] text-slate-400">Ventas brutas menos devoluciones</p>
            </div>
            <p class="text-xl font-black text-sky-300 font-mono">
              L. {{ (dashboardData?.cierre_caja?.total_neto_ingresos || 0).toFixed(2) }}
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- Tarjetas de Arqueo y Resumen del Día -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      
      <!-- 1. Fondo Inicial -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Fondo Inicial de Caja</p>
        <p class="text-xl font-black text-opalo-600 mt-1">
          L. {{ dashboardData?.cierre_caja?.fondo_inicial_caja?.toFixed(2) || '0.00' }}
        </p>
        <p class="text-[10px] text-slate-400 mt-0.5">Efectivo inicial en apertura</p>
      </div>

      <!-- 2. Ventas Facturadas Brutas -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Total Facturado Bruto</p>
        <p class="text-xl font-black text-slate-900 mt-1">
          L. {{ dashboardData?.cierre_caja?.total_ingresos?.toFixed(2) || '0.00' }}
        </p>
        <p class="text-[10px] text-slate-400 mt-0.5">
          {{ dashboardData?.cierre_caja?.ventas_realizadas || 0 }} transacciones
        </p>
      </div>

      <!-- 3. Total Devoluciones Realizadas -->
      <div class="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-rose-600 flex items-center gap-1">
          <span>↩️</span>
          <span>Devoluciones del Día</span>
        </p>
        <p class="text-xl font-black text-rose-700 mt-1">
          -L. {{ dashboardData?.cierre_caja?.total_devoluciones_monto?.toFixed(2) || '0.00' }}
        </p>
        <p class="text-[10px] text-rose-500 mt-0.5 font-semibold">
          {{ dashboardData?.cierre_caja?.total_devoluciones_cantidad || 0 }} reembolsos procesados
        </p>
      </div>

      <!-- 4. Ingreso Neto Real en Caja (Ventas - Devoluciones) -->
      <div class="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-emerald-700 flex items-center gap-1">
          <span>💰</span>
          <span>Ingreso Neto en Caja</span>
        </p>
        <p class="text-xl font-black text-emerald-600 mt-1">
          L. {{ dashboardData?.cierre_caja?.total_neto_ingresos?.toFixed(2) || dashboardData?.cierre_caja?.total_ingresos?.toFixed(2) || '0.00' }}
        </p>
        <p class="text-[10px] text-emerald-600 mt-0.5 font-semibold">
          ISV 15%: L. {{ dashboardData?.cierre_caja?.isv_15?.toFixed(2) || '0.00' }}
        </p>
      </div>

      <!-- 5. Desglose de Pagos -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Desglose por Métodos</p>
        <div class="mt-1 space-y-0.5">
          <div v-for="p in dashboardData?.cierre_caja?.desglose_pagos" :key="p.metodo_pago" class="flex justify-between text-[11px]">
            <span class="text-slate-500 font-semibold">{{ p.metodo_pago }}:</span>
            <span class="font-bold text-slate-800">L. {{ parseFloat(p.total).toFixed(2) }}</span>
          </div>
          <div v-if="!dashboardData?.cierre_caja?.desglose_pagos?.length" class="text-[11px] text-slate-400">
            Sin operaciones en esta fecha
          </div>
        </div>
      </div>
    </div>

    <!-- Pestañas de Navegación: Facturas vs Historial de Devoluciones -->
    <div class="flex items-center justify-between border-b border-slate-200 pb-2">
      <div class="flex space-x-2">
        <button
          @click="activeTab = 'ventas'"
          class="px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer"
          :class="activeTab === 'ventas' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <span>🧾</span>
          <span>Facturas Registradas</span>
          <span class="px-2 py-0.5 text-[10px] rounded-full" :class="activeTab === 'ventas' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'">
            {{ filteredSales.length }}
          </span>
        </button>

        <button
          @click="activeTab = 'devoluciones'"
          class="px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer"
          :class="activeTab === 'devoluciones' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <span>↩️</span>
          <span>Historial de Devoluciones</span>
          <span class="px-2 py-0.5 text-[10px] rounded-full" :class="activeTab === 'devoluciones' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700 font-bold'">
            {{ returnsList.length }}
          </span>
        </button>
      </div>

      <!-- Buscador de Texto -->
      <div class="w-72">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar factura, cliente o cajero..."
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-opalo-500"
        />
      </div>
    </div>

    <!-- PESTAÑA 1: TABLA DE VENTAS FACTURADAS -->
    <div v-if="activeTab === 'ventas'" class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <th class="py-3.5 px-4">Factura</th>
              <th class="py-3.5 px-4">Fecha y Hora</th>
              <th class="py-3.5 px-4">Cajero</th>
              <th class="py-3.5 px-4">Cliente</th>
              <th class="py-3.5 px-4">Método de Pago</th>
              <th class="py-3.5 px-4 text-right">Total Facturado</th>
              <th class="py-3.5 px-4 text-center">Estado</th>
              <th class="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredSales.length === 0" class="text-center py-10">
              <td colspan="8" class="py-10 text-slate-400 font-semibold">
                No se encontraron facturas registradas en esta fecha
              </td>
            </tr>
            <tr v-for="s in filteredSales" :key="s.id" class="hover:bg-slate-50/70 transition">
              <td class="py-3.5 px-4 font-mono font-bold text-slate-900">{{ s.numero_factura }}</td>
              <td class="py-3.5 px-4 text-slate-500">{{ new Date(s.created_at).toLocaleString('es-HN') }}</td>
              <td class="py-3.5 px-4 font-semibold text-slate-800">{{ s.cajero_nombre }}</td>
              <td class="py-3.5 px-4 text-slate-600 font-medium">{{ s.cliente_nombre || 'Consumidor Final' }}</td>
              <td class="py-3.5 px-4">
                <span v-if="s.metodo_pago === 'MIXTO'" class="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-200">
                  🔀 Mixto
                </span>
                <span v-else class="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700">
                  {{ s.metodo_pago }} {{ s.banco_transferencia ? `(${s.banco_transferencia})` : '' }}
                </span>
                <div v-if="s.metodo_pago === 'MIXTO'" class="text-[9px] text-slate-500 font-mono mt-0.5 space-y-0.5">
                  <span v-if="Number(s.monto_efectivo) > 0" class="block text-emerald-700 font-semibold">Efec: L. {{ Number(s.monto_efectivo).toFixed(2) }}</span>
                  <span v-if="Number(s.monto_tarjeta) > 0" class="block text-indigo-700 font-semibold">Tarj: L. {{ Number(s.monto_tarjeta).toFixed(2) }}</span>
                  <span v-if="Number(s.monto_transferencia) > 0" class="block text-amber-700 font-semibold">Transf: L. {{ Number(s.monto_transferencia).toFixed(2) }}</span>
                </div>
              </td>
              <td class="py-3.5 px-4 text-right font-black text-slate-900">
                L. {{ parseFloat(s.total).toFixed(2) }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span 
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase inline-block border"
                  :class="getStatusBadgeClass(s.estado)"
                >
                  {{ formatStatusText(s.estado) }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  
                  <!-- BOTÓN ACCIÓN DE DEVOLUCIÓN -->
                  <button
                    v-if="s.estado === 'COMPLETADA' || s.estado === 'DEVOLUCION_PARCIAL'"
                    @click="openReturnModal(s)"
                    title="Procesar Devolución / Reembolso de Prendas"
                    class="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>↩️</span>
                    <span>Devolución</span>
                  </button>

                  <!-- BOTÓN VER DETALLE / RECIBO -->
                  <button
                    @click="openDetailModal(s)"
                    title="Ver Detalle de Factura"
                    class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                  >
                    <span>👁️</span>
                    <span>Detalle</span>
                  </button>

                  <!-- BOTÓN ANULAR FACTURA (Sólo si no está anulada) -->
                  <button 
                    v-if="s.estado === 'COMPLETADA'"
                    @click="anularVenta(s)"
                    title="Anular Factura Completa"
                    class="px-2 py-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-[11px] transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PESTAÑA 2: TABLA DE HISTORIAL DE DEVOLUCIONES -->
    <div v-if="activeTab === 'devoluciones'" class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <th class="py-3.5 px-4">N° Devolución</th>
              <th class="py-3.5 px-4">Factura Original</th>
              <th class="py-3.5 px-4">Fecha y Hora</th>
              <th class="py-3.5 px-4">Cajero</th>
              <th class="py-3.5 px-4">Cliente</th>
              <th class="py-3.5 px-4">Motivo</th>
              <th class="py-3.5 px-4">Método Reembolso</th>
              <th class="py-3.5 px-4 text-right">Monto Reembolsado</th>
              <th class="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredReturns.length === 0" class="text-center py-10">
              <td colspan="9" class="py-10 text-slate-400 font-semibold">
                No se registraron devoluciones en la fecha seleccionada
              </td>
            </tr>
            <tr v-for="dev in filteredReturns" :key="dev.id" class="hover:bg-slate-50/70 transition">
              <td class="py-3.5 px-4 font-mono font-black text-rose-700">{{ dev.numero_devolucion }}</td>
              <td class="py-3.5 px-4 font-mono font-bold text-slate-800">{{ dev.numero_factura }}</td>
              <td class="py-3.5 px-4 text-slate-500">{{ new Date(dev.created_at).toLocaleString('es-HN') }}</td>
              <td class="py-3.5 px-4 font-semibold text-slate-800">{{ dev.cajero_nombre }}</td>
              <td class="py-3.5 px-4 text-slate-600">{{ dev.cliente_nombre || 'Consumidor Final' }}</td>
              <td class="py-3.5 px-4">
                <span class="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700">
                  {{ dev.motivo }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
                  {{ dev.metodo_reembolso }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                -L. {{ parseFloat(dev.monto_total).toFixed(2) }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <button
                  @click="openReturnReceipt(dev)"
                  class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] transition cursor-pointer"
                >
                  🖨️ Ver Comprobante
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 1: PROCESAR DEVOLUCIÓN DE PRENDAS / ARTÍCULOS                  -->
    <!-- ===================================================================== -->
    <div v-if="isReturnModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto space-y-5">
        
        <!-- Encabezado del Modal -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-bold">
              ↩️
            </div>
            <div>
              <h2 class="text-base font-black text-slate-900">Procesar Devolución / Reembolso</h2>
              <p class="text-xs text-slate-500">
                Factura: <strong class="font-mono text-slate-800">{{ activeSaleDetail?.numero_factura }}</strong> • Cliente: {{ activeSaleDetail?.cliente_nombre || 'Consumidor Final' }}
              </p>
            </div>
          </div>
          <button @click="isReturnModalOpen = false" class="text-slate-400 hover:text-slate-700 font-bold text-lg p-1">
            ✕
          </button>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-600">
          <p>
            Selecciona las prendas y cantidades a devolver. El inventario de cada talla y color será reintegrado automáticamente.
          </p>
          <div class="flex gap-2 shrink-0">
            <button 
              type="button" 
              @click="returnAllAvailableItems" 
              class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer transition"
            >
              ↩️ Devolver Todo
            </button>
            <button 
              type="button" 
              @click="clearAllReturnItems" 
              class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer transition"
            >
              Limpiar
            </button>
          </div>
        </div>

        <!-- Tabla de Artículos Comprados Disponibles para Devolución -->
        <div class="border border-slate-200 rounded-2xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th class="py-2.5 px-3">Prenda / Talla / Color</th>
                <th class="py-2.5 px-3 text-center">Comprado</th>
                <th class="py-2.5 px-3 text-center">Disponible</th>
                <th class="py-2.5 px-3 text-center">Cant. a Devolver</th>
                <th class="py-2.5 px-3 text-right">Reembolso</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr 
                v-for="it in returnItemsState" 
                :key="it.detalle_venta_id" 
                :class="it.cantidad_devolver > 0 ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'"
                class="transition"
              >
                <td class="py-2.5 px-3">
                  <p class="font-bold text-slate-800">{{ it.producto_nombre }}</p>
                  <p class="text-[10px] text-slate-400">Talla: {{ it.talla }} • Color: {{ it.color }}</p>
                  <div class="text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>L. {{ it.precio_efectivo.toFixed(2) }} c/u</span>
                    <span v-if="it.descuento_unit > 0" class="text-emerald-700 font-semibold ml-1.5">
                      (Rebaja: -L. {{ it.descuento_unit.toFixed(2) }})
                    </span>
                  </div>
                </td>
                <td class="py-2.5 px-3 text-center font-bold text-slate-700">{{ it.cantidad_comprada }}</td>
                <td class="py-2.5 px-3 text-center">
                  <span class="px-2 py-0.5 rounded-full font-bold text-[10px]" :class="it.cantidad_disponible > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'">
                    {{ it.cantidad_disponible }}
                  </span>
                </td>
                <td class="py-2.5 px-3 text-center">
                  <div class="flex items-center justify-center gap-1.5" v-if="it.cantidad_disponible > 0">
                    <button 
                      @click="decreaseReturnQty(it)"
                      type="button"
                      class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer transition"
                    >
                      -
                    </button>
                    <span class="w-7 text-center font-black text-slate-900 font-mono text-xs">{{ it.cantidad_devolver }}</span>
                    <button 
                      @click="increaseReturnQty(it)"
                      type="button"
                      class="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer transition"
                    >
                      +
                    </button>
                    <button 
                      v-if="it.cantidad_disponible > 1"
                      @click="setAllReturnQty(it)"
                      type="button"
                      class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 transition cursor-pointer"
                      title="Devolver toda la cantidad disponible de esta prenda"
                    >
                      Todo
                    </button>
                  </div>
                  <span v-else class="text-[10px] text-slate-400 italic">Totalmente devuelto</span>
                </td>
                <td class="py-2.5 px-3 text-right font-black text-slate-900 font-mono">
                  L. {{ (it.cantidad_devolver * it.precio_efectivo).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Opciones de Devolución -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Motivo -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Motivo de Devolución *</label>
            <select
              v-model="returnForm.motivo"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
            >
              <option value="Talla o medida no adecuada">Talla o medida no adecuada</option>
              <option value="Defecto o daño de fábrica">Defecto o daño de fábrica</option>
              <option value="Cambio por otra prenda / modelo">Cambio por otra prenda / modelo</option>
              <option value="Inconformidad del cliente con el producto">Inconformidad del cliente con el producto</option>
              <option value="Artículo cobrado por equivocación">Artículo cobrado por equivocación</option>
              <option value="Otro motivo">Otro motivo</option>
            </select>
          </div>

          <!-- Método de Reembolso -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Método de Reembolso *</label>
            <select
              v-model="returnForm.metodo_reembolso"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
            >
              <option value="EFECTIVO">💵 Efectivo (Salida de Gaveta / Caja)</option>
              <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
              <option value="NOTA_CREDITO">🎟️ Nota de Crédito / Vale de Tienda</option>
              <option value="SALDO_A_FAVOR">💎 Saldo a Favor para Próxima Compra</option>
            </select>
          </div>

          <!-- Observaciones -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-slate-700 mb-1">Observaciones / Notas Internas</label>
            <input
              v-model="returnForm.observaciones"
              type="text"
              placeholder="Ej: Prenda recibida en perfecto estado con etiqueta intacta"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <div v-if="returnForm.metodo_reembolso === 'EFECTIVO' && returnTotal > 0" class="sm:col-span-2 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-semibold flex items-center gap-2">
            <span>ℹ️</span>
            <span>El reembolso en efectivo (-L. {{ returnTotal.toFixed(2) }}) se descontará del efectivo físico de la gaveta en el arqueo del turno actual.</span>
          </div>
        </div>

        <!-- Resumen de Reembolso -->
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-600">
          <div class="flex justify-between">
            <span>Prendas a Reincorporar:</span>
            <span class="font-bold text-slate-900">{{ totalReturnUnits }} unidades</span>
          </div>
          <div class="flex justify-between">
            <span>Subtotal Reembolso:</span>
            <span class="font-bold">L. {{ returnSubtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>ISV 15% Reembolso:</span>
            <span class="font-bold">L. {{ returnIsv.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-sm font-black text-rose-700 pt-1.5 border-t border-slate-200">
            <span>TOTAL A REEMBOLSAR:</span>
            <span>L. {{ returnTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Acciones del Modal -->
        <div class="flex gap-2 justify-end pt-2">
          <button
            @click="isReturnModalOpen = false"
            type="button"
            class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            @click="submitReturn"
            :disabled="totalReturnUnits === 0 || isSubmittingReturn"
            type="button"
            class="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <span v-if="isSubmittingReturn" class="animate-spin">⏳</span>
            <span v-else>↩️</span>
            <span>{{ isSubmittingReturn ? 'Procesando Reintegro...' : 'Confirmar Devolución e Ingresar a Stock' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 2: DETALLE COMPLETO DE FACTURA                                -->
    <!-- ===================================================================== -->
    <div v-if="isDetailModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-y-auto space-y-4">
        
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-base font-black text-slate-900">Detalle de Factura</h2>
            <p class="font-mono text-xs text-opalo-600 font-bold">{{ activeSaleDetail?.numero_factura }}</p>
          </div>
          <button @click="isDetailModalOpen = false" class="text-slate-400 hover:text-slate-700 font-bold text-lg p-1">
            ✕
          </button>
        </div>

        <div class="space-y-1 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <p><strong>Fecha:</strong> {{ new Date(activeSaleDetail?.created_at).toLocaleString('es-HN') }}</p>
          <p><strong>Cajero:</strong> {{ activeSaleDetail?.cajero_nombre }}</p>
          <p><strong>Cliente:</strong> {{ activeSaleDetail?.cliente_nombre || 'Consumidor Final' }}</p>
          <p v-if="activeSaleDetail?.cliente_rtn"><strong>RTN Cliente:</strong> {{ activeSaleDetail.cliente_rtn }}</p>
          <p>
            <strong>Método de Pago:</strong> 
            <span v-if="activeSaleDetail?.metodo_pago === 'MIXTO'" class="font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">
              🔀 Mixto
            </span>
            <span v-else>{{ activeSaleDetail?.metodo_pago }} {{ activeSaleDetail?.banco_transferencia ? `(${activeSaleDetail.banco_transferencia})` : '' }}</span>
          </p>
          <div v-if="activeSaleDetail?.metodo_pago === 'MIXTO'" class="pl-2.5 border-l-2 border-purple-400 space-y-0.5 text-[11px] font-mono text-slate-700 py-1 bg-white rounded-r-lg">
            <p v-if="Number(activeSaleDetail?.monto_efectivo) > 0">💵 Efectivo: L. {{ Number(activeSaleDetail.monto_efectivo).toFixed(2) }}</p>
            <p v-if="Number(activeSaleDetail?.monto_tarjeta) > 0">💳 Tarjeta POS: L. {{ Number(activeSaleDetail.monto_tarjeta).toFixed(2) }}</p>
            <p v-if="Number(activeSaleDetail?.monto_transferencia) > 0">🏦 Transferencia ({{ activeSaleDetail?.banco_transferencia || 'Banco' }}): L. {{ Number(activeSaleDetail.monto_transferencia).toFixed(2) }}</p>
          </div>
          <p><strong>Estado:</strong> <span class="font-bold">{{ activeSaleDetail?.estado }}</span></p>
        </div>

        <!-- Prendas Compradas -->
        <div>
          <h4 class="text-xs font-black uppercase text-slate-700 mb-2">Prendas y Artículos Vendidos</h4>
          <div class="border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
            <div v-for="it in activeSaleDetail?.items" :key="it.id" class="p-3 flex justify-between items-center">
              <div>
                <p class="font-bold text-slate-800">{{ it.cantidad }}x {{ it.producto_nombre }}</p>
                <p class="text-[10px] text-slate-400">Talla: {{ it.talla }} • Color: {{ it.color }}</p>
                <p v-if="it.descuento > 0" class="text-[10px] font-bold text-emerald-700">
                  🏷️ Rebaja / Descuento: -L. {{ parseFloat(it.descuento).toFixed(2) }}
                </p>
                <p v-if="it.cantidad_devuelta > 0" class="text-[10px] font-bold text-rose-600">
                  ↩️ Devueltas: {{ it.cantidad_devuelta }} unid.
                </p>
              </div>
              <span class="font-black text-slate-900">L. {{ parseFloat(it.subtotal).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Devoluciones Previas si existen -->
        <div v-if="activeSaleDetail?.devoluciones?.length > 0">
          <h4 class="text-xs font-black uppercase text-rose-700 mb-2">Devoluciones Aplicadas</h4>
          <div class="border border-rose-200 bg-rose-50/20 rounded-2xl divide-y divide-rose-100 text-xs">
            <div v-for="d in activeSaleDetail.devoluciones" :key="d.id" class="p-2.5 flex justify-between items-center">
              <div>
                <p class="font-mono font-bold text-rose-800">{{ d.numero_devolucion }}</p>
                <p class="text-[10px] text-slate-500">{{ d.motivo }} • Reembolso: {{ d.metodo_reembolso }}</p>
              </div>
              <span class="font-black text-rose-600">-L. {{ parseFloat(d.monto_total).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-200 pt-2 space-y-1 text-right text-xs">
          <div class="flex justify-between text-slate-600">
            <span>Subtotal Gravable (15%):</span>
            <span>L. {{ parseFloat(activeSaleDetail?.subtotal || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>ISV (15%):</span>
            <span>L. {{ parseFloat(activeSaleDetail?.isv_15 || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Subtotal Gravable (18%):</span>
            <span>L. 0.00</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>ISV (18%):</span>
            <span>L. 0.00</span>
          </div>
          <div class="flex justify-between" :class="activeSaleDetail?.total_descuento > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'">
            <span>Descuentos y Rebajas Otorgados:</span>
            <span>- L. {{ parseFloat(activeSaleDetail?.total_descuento || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1">
            <span>TOTAL:</span>
            <span>L. {{ parseFloat(activeSaleDetail?.total || 0).toFixed(2) }}</span>
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button
            @click="printSaleReceipt"
            class="flex-1 py-2.5 bg-opalo-600 hover:bg-opalo-700 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>🖨️</span>
            <span>Imprimir Ticket</span>
          </button>
          <button
            @click="isDetailModalOpen = false"
            class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 3: COMPROBANTE DE DEVOLUCIÓN IMPRIMIBLE (80mm)                 -->
    <!-- ===================================================================== -->
    <div v-if="isReturnReceiptModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center">
        
        <!-- Contenedor del Comprobante Térmico -->
        <div id="thermal-return-receipt" class="w-full font-mono text-[11px] text-slate-800 border-b border-dashed border-slate-300 pb-4">
          <div class="text-center mb-3">
            <img 
              v-if="companyConfig?.logo_url && !logoError" 
              :src="getFullLogoUrl(companyConfig.logo_url)" 
              alt="Logo" 
              class="h-10 mx-auto mb-1.5 object-contain"
              @error="logoError = true"
            />
            <h2 class="text-sm font-black tracking-tight">{{ companyConfig?.nombre_empresa || 'ÓPALO ACCESORIOS' }}</h2>
            <p class="text-[10px] text-slate-500">{{ companyConfig?.direccion || 'Tocoa, Colón • Honduras' }}</p>
            <p class="text-[10px] text-slate-700 font-bold">RTN: {{ companyConfig?.rtn || '02091995001230' }}</p>
            <div class="mt-2 py-1 px-2 bg-rose-50 border border-rose-200 rounded text-rose-800 font-bold text-[10px]">
              COMPROBANTE DE DEVOLUCIÓN
            </div>
            <p class="text-[10px] font-mono font-bold mt-1 text-slate-900">{{ activeReturnReceipt?.numero_devolucion }}</p>
            <p class="text-[9px] text-slate-400">Factura de Origen: {{ activeReturnReceipt?.numero_factura }}</p>
            <p class="text-[9px] text-slate-400">{{ activeReturnReceipt?.created_at ? new Date(activeReturnReceipt.created_at).toLocaleString('es-HN') : new Date().toLocaleString('es-HN') }}</p>
          </div>

          <div class="border-t border-b border-dashed border-slate-200 py-1.5 my-2 text-[10px]">
            <p><strong>Cajero:</strong> {{ activeReturnReceipt?.cajero_nombre }}</p>
            <p><strong>Cliente:</strong> {{ activeReturnReceipt?.cliente_nombre || 'Consumidor Final' }}</p>
            <p><strong>Motivo:</strong> {{ activeReturnReceipt?.motivo }}</p>
            <p><strong>Reembolso:</strong> {{ activeReturnReceipt?.metodo_reembolso }}</p>
          </div>

          <!-- Prendas Devueltas -->
          <div class="space-y-1 my-2">
            <p class="text-[9px] uppercase font-bold text-slate-400">Artículos Reintegrados:</p>
            <div v-for="it in activeReturnReceipt?.items" :key="it.id" class="flex justify-between border-b border-dotted border-slate-200 pb-1">
              <span class="truncate mr-2">{{ it.cantidad }}x {{ it.producto_nombre }} ({{ it.talla }}/{{ it.color }})</span>
              <span class="font-bold shrink-0">L. {{ (parseFloat(it.total_linea || it.subtotal || 0)).toFixed(2) }}</span>
            </div>
          </div>

          <!-- Total Reembolsado -->
          <div class="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right">
            <div class="flex justify-between">
              <span>Subtotal Reembolsado:</span>
              <span>L. {{ parseFloat(activeReturnReceipt?.monto_subtotal || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>ISV 15%:</span>
              <span>L. {{ parseFloat(activeReturnReceipt?.monto_isv_15 || 0).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-xs font-black text-rose-700 pt-1 border-t border-slate-200">
              <span>TOTAL REEMBOLSADO:</span>
              <span>L. {{ parseFloat(activeReturnReceipt?.monto_total || 0).toFixed(2) }}</span>
            </div>
          </div>

          <div class="text-center mt-4 text-[9px] text-slate-400 pt-2 border-t border-dashed border-slate-200">
            <p>Artículos reintegrados al inventario de Ópalo.</p>
            <p>Conserva este comprobante para cualquier aclaración.</p>
          </div>
        </div>

        <div class="w-full flex gap-2 mt-4">
          <button 
            @click="printReturnReceipt" 
            class="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Imprimir Comprobante</span>
          </button>
          <button 
            @click="isReturnReceiptModalOpen = false" 
            class="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 4: FINALIZAR DÍA Y ARQUEO DE CAJA                               -->
    <!-- ===================================================================== -->
    <div v-if="isFinalizarDiaModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
        
        <!-- Cabecera -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-700 text-white flex items-center justify-center text-xl shadow-md shadow-rose-200">
              🏁
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Finalizar Día y Arqueo de Caja</h3>
              <p class="text-xs text-slate-500">Conteo físico del efectivo y cierre oficial de turno</p>
            </div>
          </div>
          <button 
            type="button"
            @click="isFinalizarDiaModalOpen = false" 
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- 1. Resumen Matemático del Cuadre -->
        <div class="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
          <p class="text-[10px] font-black uppercase text-amber-400 tracking-wider">
            Resumen de la Gaveta de Efectivo:
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div class="bg-slate-800 p-2 rounded-xl">
              <span class="text-[10px] text-slate-400 block">Fondo Inicial:</span>
              <b class="text-white">L. {{ (dashboardData?.cierre_caja?.fondo_inicial_caja || 0).toFixed(2) }}</b>
            </div>
            <div class="bg-slate-800 p-2 rounded-xl">
              <span class="text-[10px] text-emerald-400 block">(+) Ventas Ef.:</span>
              <b class="text-emerald-300">+L. {{ (dashboardData?.cierre_caja?.ventas_efectivo || 0).toFixed(2) }}</b>
            </div>
            <div class="bg-slate-800 p-2 rounded-xl">
              <span class="text-[10px] text-rose-400 block">(-) Salidas/Vales:</span>
              <b class="text-rose-300">-L. {{ (dashboardData?.cierre_caja?.salidas_efectivo_total || 0).toFixed(2) }}</b>
            </div>
            <div class="bg-slate-800 p-2 rounded-xl">
              <span class="text-[10px] text-rose-300 block">(-) Devoluciones:</span>
              <b class="text-rose-300">-L. {{ (dashboardData?.cierre_caja?.devoluciones_efectivo_total || 0).toFixed(2) }}</b>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-300">Total Efectivo Esperado en Gaveta:</span>
            <span class="text-base font-black text-amber-300 font-mono">
              L. {{ (dashboardData?.cierre_caja?.efectivo_esperado_gaveta || 0).toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- 2. Formulario de Conteo Físico -->
        <div class="space-y-3">
          
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-800">
              Efectivo Físico Contado en Gaveta (Lempiras) *
            </label>
            <button 
              type="button"
              @click="showDenominations = !showDenominations" 
              class="text-xs font-bold text-opalo-600 hover:text-opalo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>{{ showDenominations ? '🔽 Ocultar' : '🧮 Abrir' }} Calculadora de Billetes</span>
            </button>
          </div>

          <!-- Calculadora Desplegable de Billetes -->
          <div v-if="showDenominations" class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Conteo por Denominación de Billetes y Monedas
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Billetes L. 500</label>
                <input 
                  v-model.number="conteoForm.b500" 
                  @input="recalculateFromDenominations"
                  type="number" 
                  min="0" 
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Billetes L. 200</label>
                <input 
                  v-model.number="conteoForm.b200" 
                  @input="recalculateFromDenominations"
                  type="number" 
                  min="0" 
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Billetes L. 100</label>
                <input 
                  v-model.number="conteoForm.b100" 
                  @input="recalculateFromDenominations"
                  type="number" 
                  min="0" 
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Billetes L. 50</label>
                <input 
                  v-model.number="conteoForm.b50" 
                  @input="recalculateFromDenominations"
                  type="number" 
                  min="0" 
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Billetes L. 20</label>
                <input 
                  v-model.number="conteoForm.b20" 
                  @input="recalculateFromDenominations"
                  type="number" 
                  min="0" 
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                  placeholder="0"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Billetes L. 10 y Monedas</label>
                <input 
                  v-model.number="conteoForm.monedas" 
                  @input="recalculateFromDenominations"
                  type="number" 
                  min="0" 
                  step="0.01"
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" 
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <!-- Input Principal de Dinero Contado -->
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">L.</span>
            <input 
              v-model="conteoForm.monto_real" 
              type="number" 
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              class="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-opalo-500 bg-slate-50 focus:bg-white text-lg font-black font-mono focus:outline-none transition"
            />
          </div>

          <!-- Indicador de Diferencia en Tiempo Real -->
          <div 
            v-if="cashDifference !== null" 
            class="p-3 rounded-2xl border text-xs flex items-center justify-between transition-all"
            :class="cashDifference === 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : cashDifference > 0 ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-rose-50 border-rose-300 text-rose-800'"
          >
            <div>
              <p class="font-black text-sm flex items-center gap-1.5">
                <span v-if="cashDifference === 0">✅ Cuadre Exacto</span>
                <span v-else-if="cashDifference > 0">🟢 Sobrante en Caja</span>
                <span v-else>🔴 Faltante en Caja</span>
              </p>
              <p class="text-[11px] mt-0.5">
                {{ cashDifference === 0 ? 'El dinero físico coincide exactamente con lo esperado en sistema.' : cashDifference > 0 ? `Hay L. ${cashDifference.toFixed(2)} más de lo registrado en sistema.` : `Faltan L. ${Math.abs(cashDifference).toFixed(2)} respecto a lo esperado.` }}
              </p>
            </div>
            <div class="text-right font-mono font-black text-base shrink-0 ml-3">
              {{ cashDifference > 0 ? '+' : '' }}L. {{ cashDifference.toFixed(2) }}
            </div>
          </div>

          <!-- Notas y Observaciones -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Notas u Observaciones del Cierre de Día (Opcional)
            </label>
            <textarea 
              v-model="conteoForm.notas" 
              rows="2" 
              placeholder="Ej: Se entregó el dinero a gerencia, depósito realizado en BAC Credomatic, turno sin novedades..."
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
            ></textarea>
          </div>

          <p v-if="cierreError" class="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            ⚠️ {{ cierreError }}
          </p>

          <!-- Acciones del Modal -->
          <div class="pt-2 flex gap-2">
            <button 
              type="button"
              @click="submitFinalizarDia" 
              :disabled="isSubmittingCierre || conteoForm.monto_real === '' || isNaN(conteoForm.monto_real)"
              class="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              <span>{{ isSubmittingCierre ? 'Finalizando Día y Cerrando Caja...' : '🏁 Confirmar Cierre e Imprimir Arqueo' }}</span>
            </button>
            <button 
              type="button"
              @click="isFinalizarDiaModalOpen = false" 
              class="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>

        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { user } = useAuth();
const { onEvent } = useSocket();
const { companyConfig, getFullLogoUrl } = useCompanyConfig();
const logoError = ref(false);

watch(() => companyConfig.value?.logo_url, () => {
  logoError.value = false;
});

const getTodayLocalDate = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tegucigalpa' }).format(new Date());
  } catch (e) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

const selectedDate = ref(getTodayLocalDate());
const dashboardData = ref(null);
const sales = ref([]);
const returnsList = ref([]);
const activeTab = ref('ventas');
const searchQuery = ref('');

// Modales
const isReturnModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const isReturnReceiptModalOpen = ref(false);
const isSubmittingReturn = ref(false);

const activeSaleDetail = ref(null);
const activeReturnReceipt = ref(null);
const returnItemsState = ref([]);

const returnForm = reactive({
  motivo: 'Talla o medida no adecuada',
  metodo_reembolso: 'EFECTIVO',
  observaciones: ''
});

// Finalizar Día y Arqueo de Caja
const isFinalizarDiaModalOpen = ref(false);
const isSubmittingCierre = ref(false);
const cierreError = ref('');
const showDenominations = ref(false);

const conteoForm = reactive({
  monto_real: '',
  notas: '',
  b500: 0,
  b200: 0,
  b100: 0,
  b50: 0,
  b20: 0,
  monedas: 0
});

const recalculateFromDenominations = () => {
  const sum = (Number(conteoForm.b500) || 0) * 500 +
              (Number(conteoForm.b200) || 0) * 200 +
              (Number(conteoForm.b100) || 0) * 100 +
              (Number(conteoForm.b50) || 0) * 50 +
              (Number(conteoForm.b20) || 0) * 20 +
              (Number(conteoForm.monedas) || 0);
  conteoForm.monto_real = sum > 0 ? sum.toFixed(2) : '';
};

const expectedCashInDrawer = computed(() => {
  return parseFloat(dashboardData.value?.cierre_caja?.efectivo_esperado_gaveta || 0);
});

const cashDifference = computed(() => {
  if (conteoForm.monto_real === '' || isNaN(conteoForm.monto_real)) return null;
  const real = parseFloat(conteoForm.monto_real);
  return parseFloat((real - expectedCashInDrawer.value).toFixed(2));
});

const openFinalizarDiaModal = () => {
  cierreError.value = '';
  showDenominations.value = false;
  conteoForm.monto_real = '';
  conteoForm.notas = '';
  conteoForm.b500 = 0;
  conteoForm.b200 = 0;
  conteoForm.b100 = 0;
  conteoForm.b50 = 0;
  conteoForm.b20 = 0;
  conteoForm.monedas = 0;
  isFinalizarDiaModalOpen.value = true;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('es-HN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Cargar Datos del Dashboard y Arqueo
const loadDashboard = async () => {
  try {
    const res = await apiFetch(`/reportes/dashboard?fecha=${selectedDate.value}`);
    if (res.success) {
      dashboardData.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar dashboard:', err);
  }
};

// Cargar Ventas Facturadas
const loadSales = async () => {
  try {
    const res = await apiFetch(`/ventas?fecha_inicio=${selectedDate.value}&fecha_fin=${selectedDate.value}`);
    if (res.success) {
      sales.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar ventas:', err);
  }
};

// Cargar Devoluciones
const loadReturns = async () => {
  try {
    const res = await apiFetch(`/ventas/devoluciones?fecha=${selectedDate.value}`);
    if (res.success) {
      returnsList.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar devoluciones:', err);
  }
};

const loadAllData = () => {
  loadDashboard();
  loadSales();
  loadReturns();
};

// Filtrado reactivo de ventas
const filteredSales = computed(() => {
  if (!searchQuery.value.trim()) return sales.value;
  const q = searchQuery.value.toLowerCase();
  return sales.value.filter(s => 
    s.numero_factura?.toLowerCase().includes(q) ||
    s.cajero_nombre?.toLowerCase().includes(q) ||
    s.cliente_nombre?.toLowerCase().includes(q)
  );
});

// Filtrado reactivo de devoluciones
const filteredReturns = computed(() => {
  if (!searchQuery.value.trim()) return returnsList.value;
  const q = searchQuery.value.toLowerCase();
  return returnsList.value.filter(d => 
    d.numero_devolucion?.toLowerCase().includes(q) ||
    d.numero_factura?.toLowerCase().includes(q) ||
    d.cajero_nombre?.toLowerCase().includes(q) ||
    d.cliente_nombre?.toLowerCase().includes(q)
  );
});

// Estilos de estado
const getStatusBadgeClass = (estado) => {
  switch (estado) {
    case 'COMPLETADA':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DEVOLUCION_PARCIAL':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'DEVUELTA':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'ANULADA':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const formatStatusText = (estado) => {
  switch (estado) {
    case 'DEVOLUCION_PARCIAL':
      return 'Dev. Parcial';
    case 'DEVUELTA':
      return 'Devuelta';
    default:
      return estado;
  }
};

// Abrir Modal de Devolución
const openReturnModal = async (sale) => {
  try {
    const res = await apiFetch(`/ventas/${sale.id}`);
    if (res.success && res.data) {
      activeSaleDetail.value = res.data;
      
      returnForm.motivo = 'Talla o medida no adecuada';
      returnForm.metodo_reembolso = 'EFECTIVO';
      returnForm.observaciones = '';

      returnItemsState.value = (res.data.items || []).map(it => {
        const precioUnit = parseFloat(it.precio_unitario);
        const descTotal = parseFloat(it.descuento || 0);
        const descUnit = it.cantidad > 0 ? parseFloat((descTotal / it.cantidad).toFixed(2)) : 0;
        const precioEfectivo = parseFloat((precioUnit - descUnit).toFixed(2));
        const cantDisp = it.cantidad_disponible !== undefined ? it.cantidad_disponible : (it.cantidad - (it.cantidad_devuelta || 0));
        return {
          detalle_venta_id: it.id,
          variante_id: it.variante_id,
          producto_nombre: it.producto_nombre,
          talla: it.talla,
          color: it.color,
          cantidad_comprada: it.cantidad,
          cantidad_devuelta: it.cantidad_devuelta || 0,
          cantidad_disponible: Math.max(0, cantDisp),
          cantidad_devolver: 0,
          precio_unitario: precioUnit,
          descuento_unit: descUnit,
          precio_efectivo: precioEfectivo,
          tipo_impuesto: it.tipo_impuesto || 'ISV_15',
          precio_incluye_isv: it.precio_incluye_isv !== undefined ? Boolean(it.precio_incluye_isv) : true
        };
      });

      isReturnModalOpen.value = true;
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al obtener detalle de venta para devolución');
  }
};

// Ajustar cantidades a devolver
const increaseReturnQty = (item) => {
  if (item.cantidad_devolver < item.cantidad_disponible) {
    item.cantidad_devolver++;
  }
};

const decreaseReturnQty = (item) => {
  if (item.cantidad_devolver > 0) {
    item.cantidad_devolver--;
  }
};

const setAllReturnQty = (item) => {
  item.cantidad_devolver = item.cantidad_disponible;
};

const returnAllAvailableItems = () => {
  for (const it of returnItemsState.value) {
    it.cantidad_devolver = it.cantidad_disponible;
  }
};

const clearAllReturnItems = () => {
  for (const it of returnItemsState.value) {
    it.cantidad_devolver = 0;
  }
};

// Totales calculados de devolución con desglose fiscal exacto de Honduras
const totalReturnUnits = computed(() => {
  return returnItemsState.value.reduce((acc, it) => acc + (parseInt(it.cantidad_devolver, 10) || 0), 0);
});

const returnCalculations = computed(() => {
  let subtotal = 0;
  let isv15 = 0;
  let total = 0;

  for (const it of returnItemsState.value) {
    const qty = parseInt(it.cantidad_devolver, 10) || 0;
    if (qty <= 0) continue;

    const totalLinea = parseFloat((it.precio_efectivo * qty).toFixed(2));

    if (it.tipo_impuesto === 'EXENTO') {
      subtotal += totalLinea;
    } else if (it.precio_incluye_isv) {
      const base = parseFloat((totalLinea / 1.15).toFixed(2));
      const impuesto = parseFloat((totalLinea - base).toFixed(2));
      subtotal += base;
      isv15 += impuesto;
    } else {
      const impuesto = parseFloat((totalLinea * 0.15).toFixed(2));
      subtotal += totalLinea;
      isv15 += impuesto;
    }
    total += totalLinea;
  }

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    isv15: parseFloat(isv15.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
});

const returnSubtotal = computed(() => returnCalculations.value.subtotal);
const returnIsv = computed(() => returnCalculations.value.isv15);
const returnTotal = computed(() => returnCalculations.value.total);

// Enviar Devolución
const submitReturn = async () => {
  if (totalReturnUnits.value === 0) {
    alert('Debes seleccionar al menos una prenda para devolver');
    return;
  }

  if (!confirm(`¿Confirmas la devolución de ${totalReturnUnits.value} artículo(s) por un monto total de L. ${returnTotal.value.toFixed(2)}? El inventario será restituido inmediatamente.`)) {
    return;
  }

  isSubmittingReturn.value = true;
  try {
    const itemsPayload = returnItemsState.value
      .filter(it => it.cantidad_devolver > 0)
      .map(it => ({
        detalle_venta_id: it.detalle_venta_id,
        variante_id: it.variante_id,
        cantidad: it.cantidad_devolver
      }));

    const body = {
      items: itemsPayload,
      motivo: returnForm.motivo,
      metodo_reembolso: returnForm.metodo_reembolso,
      observaciones: returnForm.observaciones
    };

    const res = await apiFetch(`/ventas/${activeSaleDetail.value.id}/devolucion`, {
      method: 'POST',
      body
    });

    if (res && res.success) {
      isReturnModalOpen.value = false;
      alert(`¡${res.message}!`);
      loadAllData();
      
      // Abrir comprobante de devolución
      if (res.data) {
        activeReturnReceipt.value = {
          ...res.data,
          cajero_nombre: activeSaleDetail.value.cajero_nombre || user.value?.nombre || 'Cajero',
          cliente_nombre: activeSaleDetail.value.cliente_nombre || 'Consumidor Final',
          created_at: res.data.created_at || new Date().toISOString()
        };
        isReturnReceiptModalOpen.value = true;
      }
    }
  } catch (err) {
    console.error('Error al procesar devolución:', err);
    alert(err?.data?.message || 'Error al procesar la devolución');
  } finally {
    isSubmittingReturn.value = false;
  }
};

// Abrir Modal de Detalle Completo
const openDetailModal = async (sale) => {
  try {
    const res = await apiFetch(`/ventas/${sale.id}`);
    if (res.success && res.data) {
      activeSaleDetail.value = res.data;
      isDetailModalOpen.value = true;
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al cargar detalle');
  }
};

// Abrir Comprobante Térmico de Devolución
const openReturnReceipt = (dev) => {
  activeReturnReceipt.value = {
    ...dev,
    cajero_nombre: dev.cajero_nombre || 'Cajero',
    cliente_nombre: dev.cliente_nombre || 'Consumidor Final'
  };
  isReturnReceiptModalOpen.value = true;
};

// Imprimir Comprobante de Devolución en formato Térmico (80mm)
const printReturnReceipt = () => {
  const receiptEl = document.getElementById('thermal-return-receipt');
  if (!receiptEl) {
    window.print();
    return;
  }
  printThermalDocument(receiptEl.innerHTML, `Comprobante de Devolución - ${activeReturnReceipt.value?.numero_devolucion || 'DEV'}`);
};

// Impresora Térmica Reutilizable (80mm) con aislamiento sin pantalla en blanco
const printThermalDocument = (htmlContent, title = 'Impresión') => {
  let printFrame = document.getElementById('ventas-print-frame');
  if (printFrame) printFrame.remove();

  printFrame = document.createElement('iframe');
  printFrame.id = 'ventas-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '80mm';
  printFrame.style.height = '600px';
  printFrame.style.border = 'none';
  printFrame.style.opacity = '0.01'; // Permite que Chromium renderice completamente el documento
  printFrame.style.pointerEvents = 'none';
  printFrame.style.zIndex = '-9999';
  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
        body {
          font-family: 'Courier New', Courier, monospace, ui-monospace;
          font-size: 11px;
          line-height: 1.35;
          width: 76mm;
          margin: 0 auto;
          padding: 8px 4px 16px 4px;
          color: #111827;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        img { max-height: 48px; max-width: 140px; display: block; margin: 0 auto 6px auto; filter: grayscale(100%); }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-4 { gap: 16px; }
        .border-t { border-top: 1px solid #cbd5e1; }
        .border-b { border-bottom: 1px solid #cbd5e1; }
        .border-dashed { border-style: dashed; }
        .border-dotted { border-style: dotted; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .p-2 { padding: 8px; }
        .my-1 { margin-top: 4px; margin-bottom: 4px; }
        .my-1\\.5 { margin-top: 6px; margin-bottom: 6px; }
        .my-2 { margin-top: 8px; margin-bottom: 8px; }
        .pt-1 { padding-top: 4px; }
        .pt-4 { padding-top: 16px; }
        .mt-1 { margin-top: 4px; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .mt-8 { margin-top: 32px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .text-xs { font-size: 12px; }
        .text-sm { font-size: 13px; }
        .text-\\[11px\\] { font-size: 11px; }
        .text-\\[10px\\] { font-size: 10px; }
        .text-\\[9px\\] { font-size: 9px; }
        .text-\\[8px\\] { font-size: 8px; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .font-mono { font-family: monospace; }
        .text-rose-700 { color: #be123c; }
        .text-rose-800 { color: #9f1239; }
        .text-blue-800 { color: #1e40af; }
        .text-emerald-700 { color: #047857; }
        .bg-slate-50 { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (e) {
      console.error('Error al imprimir documento:', e);
      window.print();
    }
  }, 350);
};

// Confirmar y Procesar Finalización del Día (Cierre de Caja)
const submitFinalizarDia = async () => {
  if (conteoForm.monto_real === '' || isNaN(conteoForm.monto_real) || Number(conteoForm.monto_real) < 0) {
    cierreError.value = 'Debe ingresar el monto en efectivo físico contado en la gaveta';
    return;
  }

  isSubmittingCierre.value = true;
  cierreError.value = '';

  try {
    const res = await apiFetch('/caja/cerrar', {
      method: 'POST',
      body: {
        monto_final_real: parseFloat(conteoForm.monto_real),
        notas: conteoForm.notas ? conteoForm.notas.trim() : null,
        turno_id: dashboardData.value?.cierre_caja?.turno_activo?.id
      }
    });

    if (res && res.success) {
      isFinalizarDiaModalOpen.value = false;
      alert(`¡Día finalizado exitosamente! Caja cerrada con una diferencia de L. ${res.data.diferencia.toFixed(2)}.`);
      
      // Imprimir comprobante térmico de arqueo
      printArqueoTicket(res.data);

      // Recargar métricas actualizadas
      loadAllData();
    } else {
      cierreError.value = res?.message || 'Error al cerrar caja';
    }
  } catch (err) {
    cierreError.value = err?.data?.message || err?.message || 'Error al finalizar el día';
  } finally {
    isSubmittingCierre.value = false;
  }
};

// Imprimir Comprobante Oficial de Arqueo y Cierre del Día
const printArqueoTicket = (turno) => {
  if (!turno) return;
  const cierre = dashboardData.value?.cierre_caja || {};
  
  const fondoInicial = parseFloat(turno.monto_inicial || cierre.fondo_inicial_caja || 0);
  const ventasEf = parseFloat(turno.ventas_efectivo || cierre.ventas_efectivo || 0);
  const ventasTarj = parseFloat(turno.ventas_tarjeta || cierre.ventas_tarjeta || 0);
  const ventasTransf = parseFloat(turno.ventas_transferencia || cierre.ventas_transferencia || 0);
  const totalFacturado = ventasEf + ventasTarj + ventasTransf;
  const salidasEf = parseFloat(turno.salidas_efectivo || cierre.salidas_efectivo_total || 0);
  const devEf = parseFloat(turno.devoluciones_efectivo || cierre.devoluciones_efectivo_total || 0);
  const montoEsperado = parseFloat(turno.monto_final_esperado || cierre.efectivo_esperado_gaveta || (fondoInicial + ventasEf - salidasEf - devEf));
  const montoReal = parseFloat(turno.monto_final_real || 0);
  const diferencia = parseFloat(turno.diferencia !== null && turno.diferencia !== undefined ? turno.diferencia : (montoReal - montoEsperado));

  const logoHtml = companyConfig.value?.logo_url 
    ? `<img src="${getFullLogoUrl(companyConfig.value.logo_url)}" alt="Logo" />` 
    : '';

  const ticketHtml = `
    <div class="text-center mb-2">
      ${logoHtml}
      <h2 class="text-xs font-black tracking-tight">${companyConfig.value?.nombre_empresa || 'ÓPALO ACCESORIOS'}</h2>
      <p class="text-[9px] text-slate-500">${companyConfig.value?.direccion || companyConfig.value?.ciudad || 'Tocoa, Colón • Honduras'}</p>
      <p class="text-[9px] font-bold">RTN: ${companyConfig.value?.rtn || '02091995001230'}</p>
      
      <div class="my-1.5 py-1 border-t border-b border-dashed border-slate-300">
        <h3 class="text-xs font-black uppercase tracking-wider">COMPROBANTE DE ARQUEO Y CIERRE DE CAJA</h3>
        <p class="text-[9px] font-bold">FINALIZACIÓN DE OPERACIONES DEL DÍA</p>
      </div>

      <p class="text-[10px] font-bold">Turno de Caja: #${turno.id}</p>
      <p class="text-[9px] text-slate-500">Apertura: ${formatDateTime(turno.fecha_apertura)}</p>
      <p class="text-[9px] text-slate-500">Cierre: ${formatDateTime(turno.fecha_cierre || new Date())}</p>
    </div>

    <div class="border-t border-b border-dashed border-slate-200 py-1 my-2 text-[10px] space-y-0.5">
      <div class="flex justify-between">
        <span class="font-bold">Cajero(a):</span>
        <span>${turno.usuario_nombre || user.value?.nombre || 'Cajero'}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Cerrado por:</span>
        <span>${turno.cerrado_por || user.value?.nombre || 'Administración'}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Estado:</span>
        <span class="font-black text-rose-700">FINALIZADO / CERRADO</span>
      </div>
    </div>

    <!-- CUADRE DE EFECTIVO EN GAVETA -->
    <div class="my-2 border border-slate-200 rounded p-2 bg-slate-50">
      <p class="text-[9px] font-black uppercase text-slate-700 mb-1">1. ARQUEO DE EFECTIVO EN GAVETA</p>
      
      <div class="flex justify-between text-[10px]">
        <span>Fondo Inicial de Apertura:</span>
        <span class="font-mono">L. ${fondoInicial.toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-[10px]">
        <span>(+) Ventas en Efectivo:</span>
        <span class="font-mono font-bold">+ L. ${ventasEf.toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-[10px]">
        <span>(-) Salidas de Caja (Vales):</span>
        <span class="font-mono font-bold text-rose-700">- L. ${salidasEf.toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-[10px]">
        <span>(-) Devoluciones Efectivo:</span>
        <span class="font-mono font-bold text-rose-700">- L. ${devEf.toFixed(2)}</span>
      </div>
      
      <div class="border-t border-slate-300 pt-1 mt-1 flex justify-between text-[10px] font-bold">
        <span>(=) Efectivo Físico Esperado:</span>
        <span class="font-mono">L. ${montoEsperado.toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-[10px] font-black">
        <span>Efectivo Físico Contado:</span>
        <span class="font-mono">L. ${montoReal.toFixed(2)}</span>
      </div>
      
      <div class="border-t border-slate-400 pt-1 mt-1 flex justify-between text-xs font-black ${diferencia === 0 ? '' : diferencia > 0 ? 'text-blue-800' : 'text-rose-800'}">
        <span>DIFERENCIA DE CUADRE:</span>
        <span class="font-mono">${diferencia > 0 ? '+' : ''}L. ${diferencia.toFixed(2)} ${diferencia === 0 ? '(EXACTO)' : diferencia > 0 ? '(SOBRANTE)' : '(FALTANTE)'}</span>
      </div>
    </div>

    <!-- RESUMEN DE INGRESOS POR MEDIOS -->
    <div class="my-2 border border-slate-200 rounded p-2">
      <p class="text-[9px] font-black uppercase text-slate-700 mb-1">2. TOTALES FACTURADOS POR CANAL</p>
      <div class="flex justify-between text-[10px]">
        <span>Cobros en Efectivo:</span>
        <span class="font-mono">L. ${ventasEf.toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-[10px]">
        <span>Cobros con Tarjeta (POS):</span>
        <span class="font-mono">L. ${ventasTarj.toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-[10px]">
        <span>Transferencias Bancarias:</span>
        <span class="font-mono">L. ${ventasTransf.toFixed(2)}</span>
      </div>
      <div class="border-t border-slate-300 pt-1 mt-1 flex justify-between text-[11px] font-black">
        <span>GRAN TOTAL FACTURADO:</span>
        <span class="font-mono">L. ${totalFacturado.toFixed(2)}</span>
      </div>
    </div>

    ${turno.notas ? `
      <div class="my-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px]">
        <p class="font-bold">Observaciones del Cierre:</p>
        <p class="italic">${turno.notas}</p>
      </div>
    ` : ''}

    <!-- Firmas -->
    <div class="mt-8 pt-4 grid grid-cols-2 gap-4 text-center text-[9px]">
      <div>
        <div class="border-t border-slate-400 pt-1">
          <p class="font-bold">Entregado por</p>
          <p class="text-[8px] text-slate-400">${turno.usuario_nombre || user.value?.nombre || 'Firma Cajero'}</p>
        </div>
      </div>
      <div>
        <div class="border-t border-slate-400 pt-1">
          <p class="font-bold">Recibido por</p>
          <p class="text-[8px] text-slate-400">${turno.cerrado_por || 'Gerencia / Supervisor'}</p>
        </div>
      </div>
    </div>

    <div class="text-center mt-4 text-[8px] text-slate-400">
      <p>Comprobante Oficial de Arqueo y Cierre de Operaciones</p>
      <p>Ópalo Accesorios • Sistema POS</p>
    </div>
  `;

  printThermalDocument(ticketHtml, `Arqueo de Cierre - Turno #${turno.id}`);
};

const printSaleReceipt = () => {
  if (!activeSaleDetail.value) return;

  const s = activeSaleDetail.value;
  const itemsHtml = (s.items || []).map(it => `
    <div style="border-bottom: 1px dotted #cbd5e1; padding-bottom: 4px; margin-bottom: 4px;">
      <div style="display: flex; justify-content: space-between;">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px;">
          ${it.cantidad}x ${it.producto_nombre} (${it.talla}/${it.color})
        </span>
        <span style="font-weight: bold; flex-shrink: 0;">L. ${(parseFloat(it.precio_unitario) * it.cantidad).toFixed(2)}</span>
      </div>
      ${it.descuento > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 9px; color: #047857; padding-left: 8px;">
          <span>↳ Rebaja / Descuento:</span>
          <span>- L. ${parseFloat(it.descuento).toFixed(2)}</span>
        </div>
      ` : ''}
    </div>
  `).join('');

  const saleHtml = `
    <div class="text-center" style="margin-bottom: 8px;">
      <h2 style="font-size: 14px; font-weight: 900; margin: 0;">${companyConfig.value?.nombre_empresa || 'ÓPALO ACCESORIOS'}</h2>
      <p style="font-size: 10px; color: #64748b; margin: 2px 0;">${companyConfig.value?.direccion || 'Tocoa, Colón • Honduras'}</p>
      <p style="font-size: 10px; font-weight: bold; margin: 2px 0;">RTN: ${companyConfig.value?.rtn || '02091995001230'}</p>
      <p style="font-size: 10px; font-weight: bold; margin-top: 4px;">Factura: ${s.numero_factura}</p>
      <p style="font-size: 9px; color: #64748b;">${new Date(s.created_at).toLocaleString('es-HN')}</p>
    </div>

    <div class="border-t border-b" style="font-size: 10px; padding: 6px 0;">
      <p><strong>Cajero:</strong> ${s.cajero_nombre || 'Caja'}</p>
      <p><strong>Cliente:</strong> ${s.cliente_nombre || 'Consumidor Final'}</p>
      ${s.cliente_rtn ? `<p><strong>RTN Cliente:</strong> ${s.cliente_rtn}</p>` : ''}
      <p><strong>Método:</strong> ${s.metodo_pago} ${s.banco_transferencia ? `(${s.banco_transferencia})` : ''}</p>
      ${s.metodo_pago === 'MIXTO' ? `
        <div style="padding-left: 8px; border-left: 2px solid #a855f7; margin-top: 4px; font-size: 9px;">
          ${Number(s.monto_efectivo) > 0 ? `<div class="flex"><span>↳ Efectivo:</span><span class="font-bold">L. ${Number(s.monto_efectivo).toFixed(2)}</span></div>` : ''}
          ${Number(s.monto_tarjeta) > 0 ? `<div class="flex"><span>↳ Tarjeta POS:</span><span class="font-bold">L. ${Number(s.monto_tarjeta).toFixed(2)}</span></div>` : ''}
          ${Number(s.monto_transferencia) > 0 ? `<div class="flex"><span>↳ Transf. (${s.banco_transferencia || 'Banco'}):</span><span class="font-bold">L. ${Number(s.monto_transferencia).toFixed(2)}</span></div>` : ''}
        </div>
      ` : ''}
    </div>

    <div style="margin: 8px 0;">
      ${itemsHtml}
    </div>

    <div class="border-t" style="text-align: right; padding-top: 6px;">
      <div class="flex"><span>Subtotal Gravable (15%):</span><span>L. ${parseFloat(s.subtotal || 0).toFixed(2)}</span></div>
      <div class="flex"><span>ISV (15%):</span><span>L. ${parseFloat(s.isv_15 || 0).toFixed(2)}</span></div>
      <div class="flex" style="color: #64748b;"><span>Subtotal Gravable (18%):</span><span>L. 0.00</span></div>
      <div class="flex" style="color: #64748b;"><span>ISV (18%):</span><span>L. 0.00</span></div>
      <div class="flex" style="font-weight: bold; color: ${s.total_descuento > 0 ? '#047857' : '#64748b'};">
        <span>Descuentos y Rebajas Otorgados:</span><span>${s.total_descuento > 0 ? `- L. ${parseFloat(s.total_descuento).toFixed(2)}` : 'L. 0.00'}</span>
      </div>
      <div class="flex" style="font-size: 12px; font-weight: 900; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 4px;">
        <span>TOTAL A PAGAR:</span><span>L. ${parseFloat(s.total || 0).toFixed(2)}</span>
      </div>
      <div class="flex" style="font-size: 10px; color: #64748b;"><span>Recibido:</span><span>L. ${parseFloat(s.monto_recibido || s.total).toFixed(2)}</span></div>
      <div class="flex" style="font-size: 10px; color: #64748b;"><span>Cambio:</span><span>L. ${parseFloat(s.cambio || 0).toFixed(2)}</span></div>
    </div>

    <div class="text-center" style="margin-top: 12px; font-size: 9px; color: #64748b; white-space: pre-line;">
      <p>${companyConfig.value?.mensaje_ticket_pie || '¡Gracias por su compra en Ópalo Accesorios!\nNo se aceptan devoluciones sin este recibo.'}</p>
    </div>
  `;

  printThermalDocument(saleHtml, `Factura - ${s.numero_factura}`);
};

// Anular Venta Completa
const anularVenta = async (s) => {
  if (!confirm(`¿Estás seguro de anular la factura ${s.numero_factura}? El inventario de todas las variantes será devuelto automáticamente.`)) {
    return;
  }

  try {
    const res = await apiFetch(`/ventas/${s.id}/anular`, { method: 'PUT' });
    if (res.success) {
      alert(res.message);
      loadAllData();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al anular la venta');
  }
};

onMounted(() => {
  loadAllData();

  onEvent('pos:sale_created', () => {
    loadAllData();
  });

  onEvent('pos:sale_cancelled', () => {
    loadAllData();
  });

  onEvent('pos:devolucion_created', () => {
    loadAllData();
  });

  onEvent('pos:caja_abierta', () => {
    loadAllData();
  });

  onEvent('pos:caja_cerrada', () => {
    loadAllData();
  });

  onEvent('pos:salida_caja', () => {
    loadAllData();
  });
});
</script>
