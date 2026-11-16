<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
    
    <!-- Cabecera de Página con Título y Navegación de Pestañas -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
      <div>
        <div class="flex items-center space-x-3">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-opalo-600 to-rose-400 flex items-center justify-center text-white text-xl shadow-md shadow-opalo-200 shrink-0">
            🏭
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Gestión de Proveedores</h1>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-opalo-700 border border-rose-200">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Cadena de Suministro & Finanzas
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Directorio comercial, cuentas por pagar, abonos bancarios y liquidación de facturas
            </p>
          </div>
        </div>
      </div>

      <!-- Botones de Acción Global -->
      <div class="flex flex-wrap items-center gap-2">
        <button 
          v-if="activeMainTab === 'directorio'"
          @click="exportToCSV"
          :disabled="suppliers.length === 0"
          class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>📥</span>
          <span>Exportar CSV</span>
        </button>

        <button 
          v-if="activeMainTab === 'pagos'"
          @click="openNewInvoiceModal(null)"
          class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>📑</span>
          <span>+ Nueva Factura por Pagar</span>
        </button>

        <button 
          @click="openCreateModal"
          class="px-5 py-2.5 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-opalo-500/25 flex items-center gap-2 cursor-pointer"
        >
          <span>+</span>
          <span>Nuevo Proveedor</span>
        </button>
      </div>
    </div>

    <!-- Barra de Selección de Pestañas Principales -->
    <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
      <button 
        @click="activeMainTab = 'directorio'"
        :class="activeMainTab === 'directorio' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'"
        class="px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer border border-transparent"
      >
        <span>🏭</span>
        <span>Directorio de Proveedores</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="activeMainTab === 'directorio' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'">
          {{ suppliers.length }}
        </span>
      </button>

      <button 
        @click="switchTabToPayments"
        :class="activeMainTab === 'pagos' ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-600/25' : 'bg-white text-slate-600 hover:bg-slate-100'"
        class="px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer border border-transparent relative"
      >
        <span>💳</span>
        <span>Control de Pagos, Abonos y Liquidaciones</span>
        <span 
          v-if="parseFloat(stats.total_deuda_proveedores || 0) > 0"
          class="px-2.5 py-0.5 rounded-full text-[10px] font-black"
          :class="activeMainTab === 'pagos' ? 'bg-white text-rose-700 shadow-xs' : 'bg-rose-100 text-rose-700'"
        >
          Deuda: L. {{ formatMoney(stats.total_deuda_proveedores) }}
        </span>
      </button>
    </div>

    <!-- Tarjetas de Métricas KPI Integradas (Directorio + Cuentas por Pagar) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Proveedores -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-rose-50 text-opalo-600 flex items-center justify-center text-xl font-black">
          🏭
        </div>
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Total Proveedores</p>
          <p class="text-2xl font-black text-slate-900">{{ stats.total_proveedores || suppliers.length }}</p>
          <p class="text-[10px] text-emerald-600 font-bold">{{ stats.activos || activeCount }} activos en catálogo</p>
        </div>
      </div>

      <!-- Saldo Pendiente por Pagar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black">
          ⏳
        </div>
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Deuda Pendiente a Proveedores</p>
          <p class="text-2xl font-black text-rose-600 font-mono">
            L. {{ formatMoney(stats.total_deuda_proveedores || 0) }}
          </p>
          <p class="text-[10px] text-slate-500 font-medium">
            {{ stats.proveedores_con_deuda || 0 }} proveedor(es) con saldo
          </p>
        </div>
      </div>

      <!-- Total Histórico Pagado -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-black">
          ✅
        </div>
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Pagos y Liquidaciones</p>
          <p class="text-2xl font-black text-emerald-600 font-mono">
            L. {{ formatMoney(paymentsOverviewData?.stats?.total_pagos_realizados || stats.total_pagos_historicos || 0) }}
          </p>
          <p class="text-[10px] text-slate-500 font-medium">Histórico de abonos procesados</p>
        </div>
      </div>

      <!-- Categorías de Suministro -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-black">
          💎
        </div>
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Categorías de Suministro</p>
          <p class="text-2xl font-black text-purple-600">{{ stats.total_categorias || categoryCount }}</p>
          <p class="text-[10px] text-slate-500 font-medium">Joyas, Ropa, Bolsos, Empaques</p>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- VISTA 1: DIRECTORIO DE PROVEEDORES                                        -->
    <!-- ========================================================================= -->
    <div v-if="activeMainTab === 'directorio'" class="space-y-4">
      
      <!-- Barra de Búsqueda y Filtros de Proveedores -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Buscador -->
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input 
              v-model="searchQuery"
              @input="debouncedFetch"
              type="text" 
              placeholder="Buscar por empresa, contacto, RTN, teléfono o ciudad..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 focus:border-transparent text-xs transition bg-slate-50/50"
            />
          </div>

          <!-- Filtro con Deuda -->
          <div class="w-full sm:w-48">
            <select 
              v-model="filterConDeuda"
              @change="fetchSuppliers"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            >
              <option value="">Todas las cuentas</option>
              <option value="true">⚠️ Con Saldo Pendiente</option>
            </select>
          </div>

          <!-- Filtro por Estado -->
          <div class="w-full sm:w-44">
            <select 
              v-model="filterEstado"
              @change="fetchSuppliers"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            >
              <option value="">Todos los Estados</option>
              <option value="ACTIVO">Solo Activos</option>
              <option value="INACTIVO">Solo Inactivos</option>
            </select>
          </div>

          <!-- Botón Limpiar Filtros -->
          <button 
            v-if="searchQuery || filterEstado || filterConDeuda"
            @click="resetFilters"
            class="px-3 py-2.5 text-xs text-rose-600 hover:text-rose-700 font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <span>✕</span>
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      <!-- Tabla Principal de Proveedores -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th class="py-3 px-4">Empresa / Distribuidor</th>
                <th class="py-3 px-4">Contacto & Ciudad</th>
                <th class="py-3 px-4">Teléfono & WhatsApp</th>
                <th class="py-3 px-4">Datos Bancarios</th>
                <th class="py-3 px-4">Crédito & Vencimiento</th>
                <th class="py-3 px-4">Saldo Pendiente</th>
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Loading -->
              <tr v-if="isLoading" class="text-center py-12">
                <td colspan="8" class="py-12 text-slate-400 font-semibold">
                  <span class="inline-block animate-spin text-lg mb-1">⏳</span>
                  <p>Cargando directorio de proveedores...</p>
                </td>
              </tr>

              <!-- Sin resultados -->
              <tr v-else-if="suppliers.length === 0" class="text-center py-12">
                <td colspan="8" class="py-12 text-slate-400">
                  <span class="text-3xl block mb-2">🏭</span>
                  <p class="font-bold text-slate-600 text-sm">No se encontraron proveedores</p>
                  <p class="text-xs text-slate-400 mt-1">Registra nuevos proveedores para gestionar tus compras y pagos</p>
                </td>
              </tr>

              <!-- Filas de Proveedores -->
              <tr 
                v-else
                v-for="sup in suppliers" 
                :key="sup.id" 
                class="hover:bg-slate-50/70 transition group"
              >
                <!-- Nombre y Categorías de Suministro -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-opalo-100 to-rose-100 text-opalo-700 flex items-center justify-center font-black text-sm shrink-0">
                      {{ sup.nombre_empresa.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-bold text-slate-900 group-hover:text-opalo-700 transition">
                        {{ sup.nombre_empresa }}
                      </p>
                      <div class="flex flex-wrap gap-1 mt-1 max-w-xs">
                        <span 
                          v-for="cat in parseCategories(sup.categoria_suministro)" 
                          :key="cat"
                          class="inline-block text-[10px] font-semibold text-opalo-700 bg-opalo-50 border border-opalo-100 px-1.5 py-0.5 rounded-md"
                        >
                          {{ cat }}
                        </span>
                        <span 
                          v-if="parseCategories(sup.categoria_suministro).length === 0"
                          class="inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          General
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Contacto y Ciudad -->
                <td class="py-3.5 px-4">
                  <p class="font-semibold text-slate-800">{{ sup.contacto_nombre || 'No asignado' }}</p>
                  <p class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>📍</span>
                    <span>{{ sup.ciudad || 'Tocoa' }}</span>
                  </p>
                </td>

                <!-- Teléfono y WhatsApp -->
                <td class="py-3.5 px-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-slate-800">{{ sup.telefono }}</span>
                      <a 
                        :href="formatWhatsAppUrl(sup.telefono)" 
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chatear por WhatsApp"
                        class="text-emerald-600 hover:text-emerald-700 font-bold text-xs"
                      >
                        💬
                      </a>
                    </div>
                    <p v-if="sup.email" class="text-[11px] text-slate-400 font-mono">{{ sup.email }}</p>
                  </div>
                </td>

                <!-- Datos Bancarios para Pagos -->
                <td class="py-3.5 px-4">
                  <div v-if="sup.banco || sup.cuenta_bancaria">
                    <p class="font-bold text-slate-800 text-[11px]">{{ sup.banco || 'Banco' }}</p>
                    <p class="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <span>{{ sup.cuenta_bancaria }}</span>
                      <button 
                        v-if="sup.cuenta_bancaria"
                        @click="copyToClipboard(sup.cuenta_bancaria)"
                        title="Copiar cuenta bancaria"
                        class="text-[10px] text-opalo-600 hover:underline cursor-pointer"
                      >
                        📋
                      </button>
                    </p>
                  </div>
                  <span v-else class="text-[11px] text-slate-400 italic">No especificada</span>
                </td>

                <!-- RTN y Días de Crédito -->
                <td class="py-3.5 px-4 font-mono">
                  <p class="text-slate-800 font-semibold">{{ sup.rtn || 'Sin RTN' }}</p>
                  <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                        :class="sup.dias_credito > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'">
                    {{ sup.dias_credito > 0 ? `${sup.dias_credito} días crédito` : 'De Contado' }}
                  </span>
                </td>

                <!-- Saldo Pendiente Actual a este Proveedor -->
                <td class="py-3.5 px-4 font-mono">
                  <div v-if="parseFloat(sup.saldo_pendiente || 0) > 0">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      L. {{ formatMoney(sup.saldo_pendiente) }}
                    </span>
                    <p class="text-[10px] text-slate-400 font-sans mt-0.5 font-bold">
                      {{ sup.facturas_pendientes }} factura(s) por pagar
                    </p>
                  </div>
                  <div v-else>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span>✓</span> Al día (L. 0.00)
                    </span>
                  </div>
                </td>

                <!-- Estado -->
                <td class="py-3.5 px-4 text-center">
                  <button 
                    @click="toggleStatus(sup)"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition"
                    :class="sup.estado === 'ACTIVO' 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="sup.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                    <span>{{ sup.estado }}</span>
                  </button>
                </td>

                <!-- Acciones -->
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end space-x-1">
                    <!-- Botón de Estado de Cuenta y Pagos -->
                    <button 
                      @click="openSupplierStatementModal(sup)"
                      class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="Ver Estado de Cuenta, Facturas, Abonos y Liquidaciones"
                    >
                      <span>💳</span>
                      <span>Pagos</span>
                    </button>

                    <!-- Ver Detalle -->
                    <button 
                      @click="openViewModal(sup)"
                      class="p-1.5 text-slate-500 hover:text-opalo-700 hover:bg-opalo-50 rounded-lg transition cursor-pointer"
                      title="Ver ficha completa"
                    >
                      👁️
                    </button>

                    <!-- Editar -->
                    <button 
                      @click="openEditModal(sup)"
                      class="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="Editar información"
                    >
                      ✏️
                    </button>

                    <!-- Eliminar -->
                    <button 
                      @click="confirmDelete(sup)"
                      class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Eliminar proveedor"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ========================================================================= -->
    <!-- VISTA 2: CONTROL DE PAGOS A PROVEEDORES, ABONOS Y LIQUIDACIONES           -->
    <!-- ========================================================================= -->
    <div v-else-if="activeMainTab === 'pagos'" class="space-y-6">
      
      <!-- Barra de Filtros y Búsqueda de Cuentas por Pagar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div class="flex flex-col sm:flex-row gap-3">
          
          <!-- Filtro por Proveedor -->
          <div class="flex-1">
            <select 
              v-model="paymentsFilterSupplierId"
              @change="fetchPaymentsOverview"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-bold text-slate-800 bg-white cursor-pointer"
            >
              <option value="">🏢 Todos los Proveedores</option>
              <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">
                {{ sup.nombre_empresa }} {{ parseFloat(sup.saldo_pendiente || 0) > 0 ? `(Deuda: L. ${formatMoney(sup.saldo_pendiente)})` : '' }}
              </option>
            </select>
          </div>

          <!-- Filtro por Estado de Cuenta -->
          <div class="w-full sm:w-56">
            <select 
              v-model="paymentsFilterStatus"
              @change="fetchPaymentsOverview"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-bold text-slate-800 bg-white cursor-pointer"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="PENDIENTE">⏳ Solo Pendientes</option>
              <option value="PAGADO_PARCIAL">🌗 Con Abonos Parciales</option>
              <option value="PAGADO">✅ Totalmente Liquidadas</option>
              <option value="VENCIDO">⚠️ Facturas Vencidas</option>
            </select>
          </div>

          <!-- Botón Registrar Factura -->
          <button 
            @click="openNewInvoiceModal(null)"
            class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>+</span>
            <span>Registrar Factura</span>
          </button>

          <!-- Botón Actualizar -->
          <button 
            @click="fetchPaymentsOverview"
            class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Recargar datos de cuentas y pagos"
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </button>

        </div>
      </div>

      <!-- Tabla de Facturas por Pagar a Proveedores -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">📑</span>
            <h3 class="text-sm font-black text-slate-900">Facturas de Compra & Cuentas por Pagar</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono font-bold">
            {{ paymentsOverviewData?.facturas?.length || 0 }} documento(s)
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th class="py-3 px-4">Factura & Concepto</th>
                <th class="py-3 px-4">Proveedor / Datos Bancarios</th>
                <th class="py-3 px-4">Emisión & Vencimiento</th>
                <th class="py-3 px-4 text-right">Total Factura</th>
                <th class="py-3 px-4 text-right">Total Abonado</th>
                <th class="py-3 px-4 text-right">Saldo Pendiente</th>
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-right">Acciones de Pago</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-sans">
              
              <!-- Loading -->
              <tr v-if="isLoadingPayments" class="text-center py-12">
                <td colspan="8" class="py-12 text-slate-400 font-semibold">
                  <span class="inline-block animate-spin text-lg mb-1">⏳</span>
                  <p>Cargando cuentas por pagar y saldos...</p>
                </td>
              </tr>

              <!-- Sin Facturas -->
              <tr v-else-if="!paymentsOverviewData?.facturas || paymentsOverviewData.facturas.length === 0" class="text-center py-12">
                <td colspan="8" class="py-12 text-slate-400">
                  <span class="text-3xl block mb-2">🎉</span>
                  <p class="font-bold text-slate-700 text-sm">No hay facturas pendientes con estos filtros</p>
                  <p class="text-xs text-slate-400 mt-1">Todas las cuentas están al día o no se encontraron registros</p>
                </td>
              </tr>

              <!-- Fila de Factura -->
              <tr 
                v-else
                v-for="cxp in paymentsOverviewData.facturas"
                :key="cxp.id"
                class="hover:bg-slate-50/70 transition"
                :class="parseFloat(cxp.saldo_pendiente) > 0 && cxp.dias_para_vencer < 0 ? 'bg-rose-50/20' : ''"
              >
                <!-- Factura y Descripción -->
                <td class="py-3.5 px-4">
                  <p class="font-black text-slate-900 font-mono text-xs">
                    {{ cxp.numero_factura_proveedor }}
                  </p>
                  <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-1" :title="cxp.descripcion">
                    {{ cxp.descripcion || 'Compra de mercadería' }}
                  </p>
                </td>

                <!-- Proveedor y Banco -->
                <td class="py-3.5 px-4">
                  <p class="font-bold text-slate-800">{{ cxp.proveedor_nombre }}</p>
                  <p v-if="cxp.proveedor_banco || cxp.proveedor_cuenta" class="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <span>🏦 {{ cxp.proveedor_banco }}: {{ cxp.proveedor_cuenta }}</span>
                    <button 
                      v-if="cxp.proveedor_cuenta"
                      @click="copyToClipboard(cxp.proveedor_cuenta)"
                      title="Copiar cuenta para transferencia"
                      class="text-opalo-600 hover:underline cursor-pointer"
                    >
                      📋
                    </button>
                  </p>
                </td>

                <!-- Fechas y Alerta de Vencimiento -->
                <td class="py-3.5 px-4">
                  <p class="text-slate-600 text-[11px]">Emisión: {{ formatDate(cxp.fecha_emision) }}</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="text-[11px] font-bold"
                          :class="parseFloat(cxp.saldo_pendiente) <= 0 ? 'text-slate-400' : cxp.dias_para_vencer < 0 ? 'text-rose-600 font-black' : cxp.dias_para_vencer <= 3 ? 'text-amber-600 font-bold' : 'text-slate-700'">
                      Vence: {{ formatDate(cxp.fecha_vencimiento) }}
                    </span>
                    <span 
                      v-if="parseFloat(cxp.saldo_pendiente) > 0"
                      class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase"
                      :class="cxp.dias_para_vencer < 0 ? 'bg-rose-100 text-rose-700' : cxp.dias_para_vencer <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'"
                    >
                      {{ cxp.dias_para_vencer < 0 ? `Vencida (${Math.abs(cxp.dias_para_vencer)}d)` : `${cxp.dias_para_vencer}d restantes` }}
                    </span>
                  </div>
                </td>

                <!-- Total Facturado -->
                <td class="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                  L. {{ formatMoney(cxp.monto_total) }}
                </td>

                <!-- Total Abonado -->
                <td class="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                  L. {{ formatMoney(cxp.monto_pagado) }}
                </td>

                <!-- Saldo Pendiente -->
                <td class="py-3.5 px-4 text-right font-mono font-black"
                    :class="parseFloat(cxp.saldo_pendiente) > 0 ? 'text-rose-600 text-sm' : 'text-slate-400'">
                  L. {{ formatMoney(cxp.saldo_pendiente) }}
                </td>

                <!-- Estado -->
                <td class="py-3.5 px-4 text-center">
                  <span 
                    class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border"
                    :class="getCxpStatusBadgeClass(cxp)"
                  >
                    {{ getCxpStatusLabel(cxp) }}
                  </span>
                </td>

                <!-- Acciones de Pago y Liquidación -->
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    
                    <!-- Botón Abonar Parcial -->
                    <button 
                      v-if="parseFloat(cxp.saldo_pendiente) > 0"
                      @click="openPaymentModal(cxp, false)"
                      class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer flex items-center gap-1"
                      title="Registrar un abono parcial a esta factura"
                    >
                      <span>💵</span>
                      <span>Abonar</span>
                    </button>

                    <!-- Botón Liquidación Total (1 Clic) -->
                    <button 
                      v-if="parseFloat(cxp.saldo_pendiente) > 0"
                      @click="openPaymentModal(cxp, true)"
                      class="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer flex items-center gap-1"
                      title="Liquidar la totalidad del saldo restante en un solo clic"
                    >
                      <span>⚡</span>
                      <span>Liquidar</span>
                    </button>

                    <!-- Botón Ver Estado / Proveedor -->
                    <button 
                      @click="openSupplierStatementById(cxp.proveedor_id)"
                      class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Ver ficha y estado de cuenta completo del proveedor"
                    >
                      👁️
                    </button>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===================================================================== -->
      <!-- SUB-SECCIÓN: HISTORIAL DE ÚLTIMOS PAGOS Y LIQUIDACIONES REALIZADOS     -->
      <!-- ===================================================================== -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">🧾</span>
            <h3 class="text-sm font-black text-slate-900">Historial Reciente de Pagos, Abonos y Liquidaciones</h3>
          </div>
          <span class="text-xs text-slate-400 font-mono">
            Últimos registros bancarios
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th class="py-2.5 px-4">Fecha & Hora</th>
                <th class="py-2.5 px-4">Proveedor Beneficiario</th>
                <th class="py-2.5 px-4">Concepto / Factura</th>
                <th class="py-2.5 px-4">Método & Banco</th>
                <th class="py-2.5 px-4">Comprobante / Ref.</th>
                <th class="py-2.5 px-4 text-right">Monto Pagado</th>
                <th class="py-2.5 px-4 text-center">Comprobante</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-sans">
              
              <tr v-if="!paymentsOverviewData?.ultimos_pagos || paymentsOverviewData.ultimos_pagos.length === 0" class="text-center py-8">
                <td colspan="7" class="py-8 text-slate-400">
                  <p class="font-bold text-slate-600">No se han registrado pagos a proveedores recientemente</p>
                </td>
              </tr>

              <tr 
                v-else
                v-for="pago in paymentsOverviewData.ultimos_pagos"
                :key="pago.id"
                class="hover:bg-slate-50/70 transition"
              >
                <!-- Fecha -->
                <td class="py-3 px-4 font-mono text-slate-600">
                  {{ formatDate(pago.fecha_gasto || pago.created_at) }}
                </td>

                <!-- Proveedor -->
                <td class="py-3 px-4">
                  <p class="font-bold text-slate-900">{{ pago.proveedor_nombre || 'Proveedor' }}</p>
                </td>

                <!-- Concepto -->
                <td class="py-3 px-4">
                  <p class="text-slate-700">{{ pago.descripcion }}</p>
                  <p v-if="pago.numero_factura_proveedor" class="text-[10px] text-opalo-600 font-mono font-bold">
                    Factura: {{ pago.numero_factura_proveedor }}
                  </p>
                </td>

                <!-- Método y Banco -->
                <td class="py-3 px-4">
                  <span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold"
                        :class="pago.metodo_pago === 'TRANSFERENCIA' ? 'bg-blue-50 text-blue-700' : pago.metodo_pago === 'EFECTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'">
                    {{ pago.metodo_pago }}
                  </span>
                  <p v-if="pago.banco_origen" class="text-[10px] text-slate-500 mt-0.5 font-bold">
                    {{ pago.banco_origen }}
                  </p>
                </td>

                <!-- Comprobante / Referencia -->
                <td class="py-3 px-4 font-mono text-slate-600">
                  {{ pago.numero_comprobante || 'N/A' }}
                </td>

                <!-- Monto Pagado -->
                <td class="py-3 px-4 text-right font-mono font-black text-rose-700 text-sm">
                  - L. {{ formatMoney(pago.monto) }}
                </td>

                <!-- Imprimir Comprobante Térmico -->
                <td class="py-3 px-4 text-center">
                  <button 
                    @click="printSupplierPaymentReceipt(pago)"
                    class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Imprimir Comprobante Térmico de Pago"
                  >
                    🖨️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: REGISTRAR ABONO O LIQUIDACIÓN DE FACTURA                           -->
    <!-- ========================================================================= -->
    <div v-if="isPaymentModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
        
        <!-- Cabecera -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-200">
              💵
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">
                {{ isLiquidacionMode ? '⚡ Liquidación Total de Factura' : '💵 Registrar Abono a Proveedor' }}
              </h3>
              <p class="text-xs text-slate-500">Pago a cuenta comercial y registro de egreso bancario</p>
            </div>
          </div>
          <button 
            type="button"
            @click="isPaymentModalOpen = false" 
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Ficha de la Factura y Saldo -->
        <div class="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-[10px] font-black uppercase text-amber-400 tracking-wider">Proveedor Beneficiario:</p>
              <p class="text-sm font-black">{{ activeCxpForPayment?.proveedor_nombre }}</p>
              <p v-if="activeCxpForPayment?.proveedor_banco || activeCxpForPayment?.proveedor_cuenta" class="text-[10px] text-slate-400 font-mono mt-0.5">
                {{ activeCxpForPayment.proveedor_banco }}: {{ activeCxpForPayment.proveedor_cuenta }}
              </p>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block font-mono">Factura:</span>
              <span class="text-xs font-black font-mono text-white">{{ activeCxpForPayment?.numero_factura_proveedor }}</span>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span class="text-[10px] text-slate-400 block">Total Factura:</span>
              <span class="font-bold text-white">L. {{ formatMoney(activeCxpForPayment?.monto_total) }}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-amber-300 block font-bold">Saldo Actual Pendiente:</span>
              <span class="text-base font-black text-amber-300 font-mono">
                L. {{ formatMoney(activeCxpForPayment?.saldo_pendiente) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Formulario de Abono / Liquidación -->
        <form @submit.prevent="submitAbono" class="space-y-3.5">
          
          <!-- Atajos Rápidos de Monto -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="block text-xs font-bold text-slate-800">
                Monto a Pagar / Abonar (Lempiras) *
              </label>
              <span class="text-[11px] font-bold text-slate-500">
                Saldo restante: <b class="font-mono text-rose-600">L. {{ formatMoney(calculatedRemainingBalance) }}</b>
              </span>
            </div>

            <!-- Botones de Porcentaje / Liquidación rápida -->
            <div class="flex gap-2 mb-2">
              <button 
                type="button"
                @click="setPaymentAmount(parseFloat(activeCxpForPayment?.saldo_pendiente || 0))"
                class="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer"
              >
                ⚡ Liquidar Todo (100%)
              </button>
              <button 
                type="button"
                @click="setPaymentAmount(parseFloat(activeCxpForPayment?.saldo_pendiente || 0) / 2)"
                class="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                50% (Mitad)
              </button>
              <button 
                v-if="parseFloat(activeCxpForPayment?.saldo_pendiente || 0) >= 1000"
                type="button"
                @click="setPaymentAmount(1000)"
                class="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                L. 1,000
              </button>
            </div>

            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-black text-slate-400 font-mono">L.</span>
              <input 
                v-model="paymentForm.monto_abono"
                type="number" 
                step="0.01"
                min="0.01"
                :max="parseFloat(activeCxpForPayment?.saldo_pendiente || 0)"
                required
                placeholder="0.00"
                class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-sm font-black font-mono transition bg-slate-50/50"
              />
            </div>
          </div>

          <!-- Método de Pago y Banco -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Método de Pago *
              </label>
              <select 
                v-model="paymentForm.metodo_pago"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                <option value="EFECTIVO">💵 Efectivo de Caja</option>
                <option value="CHEQUE">📝 Cheque</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Banco Origen
              </label>
              <select 
                v-model="paymentForm.banco_origen"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="BAC Credomatic">BAC Credomatic</option>
                <option value="Banco Atlántida">Banco Atlántida</option>
                <option value="Banco Ficohsa">Banco Ficohsa</option>
                <option value="Banrural">Banrural</option>
                <option value="Banco de Occidente">Banco de Occidente</option>
                <option value="Banco Promerica">Banco Promerica</option>
                <option value="Caja Chica POS">Caja Chica POS</option>
              </select>
            </div>
          </div>

          <!-- Número de Comprobante / Referencia Bancaria y Fecha -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                N° de Comprobante / Referencia
              </label>
              <input 
                v-model="paymentForm.numero_comprobante"
                type="text" 
                placeholder="Ej. TRANSF-984321 / Cheque #120"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Fecha del Pago *
              </label>
              <input 
                v-model="paymentForm.fecha_pago"
                type="date" 
                required
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
              />
            </div>
          </div>

          <!-- Observaciones -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Notas u Observaciones del Pago
            </label>
            <textarea 
              v-model="paymentForm.notas"
              rows="2"
              placeholder="Ej. Transferencia efectuada por banca en línea BAC, soporte enviado por WhatsApp..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
            ></textarea>
          </div>

          <!-- Opción de Impresión Térmica -->
          <div class="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <input 
              v-model="paymentForm.imprimir_comprobante"
              type="checkbox" 
              id="chk-imprimir-pago"
              class="w-4 h-4 text-opalo-600 rounded border-slate-300 focus:ring-opalo-500 cursor-pointer"
            />
            <label for="chk-imprimir-pago" class="text-xs font-bold text-slate-700 cursor-pointer">
              🖨️ Imprimir Comprobante Oficial de Pago Térmico al confirmar
            </label>
          </div>

          <p v-if="paymentError" class="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            ⚠️ {{ paymentError }}
          </p>

          <!-- Acciones del Modal -->
          <div class="pt-2 flex gap-2">
            <button 
              type="submit" 
              :disabled="isSubmittingPayment || !paymentForm.monto_abono || parseFloat(paymentForm.monto_abono) <= 0"
              class="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
            >
              <span>{{ isSubmittingPayment ? 'Procesando Pago...' : (isLiquidacionMode || calculatedRemainingBalance <= 0 ? '⚡ Confirmar Liquidación Total' : '💵 Confirmar Abono a Proveedor') }}</span>
            </button>
            <button 
              type="button"
              @click="isPaymentModalOpen = false" 
              class="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: REGISTRAR NUEVA FACTURA DE COMPRA A CRÉDITO                        -->
    <!-- ========================================================================= -->
    <div v-if="isNewInvoiceModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center text-xl shadow-md">
              📑
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Registrar Factura por Pagar</h3>
              <p class="text-xs text-slate-500">Ingreso de cuenta por pagar de mercadería o insumos</p>
            </div>
          </div>
          <button 
            type="button"
            @click="isNewInvoiceModalOpen = false" 
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="submitNewInvoice" class="space-y-3.5">
          
          <!-- Proveedor -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Proveedor / Distribuidor *
            </label>
            <select 
              v-model="newInvoiceForm.proveedor_id"
              @change="onNewInvoiceSupplierChange"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
            >
              <option value="" disabled>Seleccione un Proveedor</option>
              <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">
                {{ sup.nombre_empresa }} ({{ sup.dias_credito || 0 }} días crédito)
              </option>
            </select>
          </div>

          <!-- Número de Factura y Monto -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Número de Factura *
              </label>
              <input 
                v-model="newInvoiceForm.numero_factura_proveedor"
                type="text" 
                required
                placeholder="Ej. FACT-2026-904"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Monto Total (Lempiras) *
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 font-mono">L.</span>
                <input 
                  v-model="newInvoiceForm.monto_total"
                  type="number" 
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white"
                />
              </div>
            </div>
          </div>

          <!-- Concepto / Descripción -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Descripción o Mercadería Adquirida
            </label>
            <input 
              v-model="newInvoiceForm.descripcion"
              type="text" 
              placeholder="Ej. Pedido de 50 aretes y 30 collares en acero inoxidable..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
          </div>

          <!-- Fechas de Emisión y Vencimiento -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Fecha de Emisión *
              </label>
              <input 
                v-model="newInvoiceForm.fecha_emision"
                type="date" 
                required
                @change="recalculateInvoiceDueDate"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Fecha de Vencimiento *
              </label>
              <input 
                v-model="newInvoiceForm.fecha_vencimiento"
                type="date" 
                required
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
              />
            </div>
          </div>

          <!-- Notas -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Notas u Observaciones
            </label>
            <textarea 
              v-model="newInvoiceForm.notas"
              rows="2"
              placeholder="Ej. Recibido conforme por bodega, mercadería en exhibición..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
            ></textarea>
          </div>

          <p v-if="newInvoiceError" class="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            ⚠️ {{ newInvoiceError }}
          </p>

          <div class="pt-2 flex gap-2">
            <button 
              type="submit" 
              :disabled="isSubmittingNewInvoice"
              class="flex-1 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span>{{ isSubmittingNewInvoice ? 'Registrando Factura...' : 'Guardar Factura por Pagar' }}</span>
            </button>
            <button 
              type="button"
              @click="isNewInvoiceModalOpen = false" 
              class="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: ESTADO DE CUENTA COMPLETO & HISTORIAL DE UN PROVEEDOR             -->
    <!-- ========================================================================= -->
    <div v-if="statementModalData" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
        
        <!-- Cabecera del Estado de Cuenta -->
        <div class="flex items-start justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-opalo-600 to-rose-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {{ statementModalData.proveedor.nombre_empresa.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-base font-black text-slate-900">{{ statementModalData.proveedor.nombre_empresa }}</h2>
              <p class="text-xs text-slate-500">
                RTN: <span class="font-mono font-bold">{{ statementModalData.proveedor.rtn || 'Sin RTN' }}</span> • 
                Crédito: <span class="font-bold">{{ statementModalData.proveedor.dias_credito || 0 }} días</span>
              </p>
            </div>
          </div>
          <button 
            @click="statementModalData = null" 
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <!-- Ficha Bancaria de Transferencia -->
        <div class="p-3 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span class="text-[10px] font-black uppercase text-blue-800 tracking-wider block">Cuenta para Transferencias:</span>
            <span class="font-bold text-slate-900">{{ statementModalData.proveedor.banco || 'Banco' }}:</span>
            <span class="font-mono text-slate-800 ml-1 font-bold">{{ statementModalData.proveedor.cuenta_bancaria || 'No especificada' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button 
              v-if="statementModalData.proveedor.cuenta_bancaria"
              @click="copyToClipboard(statementModalData.proveedor.cuenta_bancaria)"
              class="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              📋 Copiar Cuenta
            </button>
            <a 
              :href="formatWhatsAppUrl(statementModalData.proveedor.telefono)"
              target="_blank"
              class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <!-- Resumen Financiero en 3 Bloques -->
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <p class="text-[10px] font-black uppercase text-slate-400">Total Comprado</p>
            <p class="text-base font-black text-slate-900 font-mono mt-0.5">
              L. {{ formatMoney(statementModalData.resumen.total_facturado) }}
            </p>
            <p class="text-[10px] text-slate-400 font-sans">{{ statementModalData.resumen.facturas_totales }} factura(s)</p>
          </div>

          <div class="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
            <p class="text-[10px] font-black uppercase text-emerald-700">Total Abonado</p>
            <p class="text-base font-black text-emerald-600 font-mono mt-0.5">
              L. {{ formatMoney(statementModalData.resumen.total_pagado) }}
            </p>
            <p class="text-[10px] text-emerald-700 font-sans font-bold">Pagos procesados</p>
          </div>

          <div class="p-3 rounded-2xl border font-mono"
               :class="statementModalData.resumen.saldo_pendiente > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-500'">
            <p class="text-[10px] font-black uppercase tracking-wider">Saldo Pendiente</p>
            <p class="text-lg font-black mt-0.5">
              L. {{ formatMoney(statementModalData.resumen.saldo_pendiente) }}
            </p>
            <p class="text-[10px] font-sans font-bold">
              {{ statementModalData.resumen.facturas_pendientes }} factura(s) por pagar
            </p>
          </div>
        </div>

        <!-- Pestañas internas del Modal: Facturas vs Historial de Pagos -->
        <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button 
            @click="statementTab = 'facturas'"
            :class="statementTab === 'facturas' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            📑 Facturas por Pagar ({{ statementModalData.facturas.length }})
          </button>
          <button 
            @click="statementTab = 'historial'"
            :class="statementTab === 'historial' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            🧾 Historial de Abonos ({{ statementModalData.historial_pagos.length }})
          </button>
          <div class="flex-1 text-right">
            <button 
              @click="openNewInvoiceModal(statementModalData.proveedor)"
              class="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              + Nueva Factura
            </button>
          </div>
        </div>

        <!-- Tab Interna 1: Facturas del Proveedor -->
        <div v-if="statementTab === 'facturas'" class="space-y-2">
          <div v-if="statementModalData.facturas.length === 0" class="text-center py-6 text-slate-400 text-xs">
            No hay facturas registradas para este proveedor.
          </div>
          <div 
            v-else
            v-for="factura in statementModalData.facturas"
            :key="factura.id"
            class="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black font-mono text-slate-900">{{ factura.numero_factura_proveedor }}</span>
                <span 
                  class="px-2 py-0.2 rounded-full text-[9px] font-black uppercase border"
                  :class="getCxpStatusBadgeClass(factura)"
                >
                  {{ getCxpStatusLabel(factura) }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ factura.descripcion || 'Compra de mercadería' }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">
                Emisión: {{ formatDate(factura.fecha_emision) }} • 
                <span :class="parseFloat(factura.saldo_pendiente) > 0 && factura.dias_para_vencer < 0 ? 'text-rose-600 font-bold' : ''">
                  Vence: {{ formatDate(factura.fecha_vencimiento) }} ({{ factura.dias_para_vencer < 0 ? `Vencida ${Math.abs(factura.dias_para_vencer)}d` : `${factura.dias_para_vencer}d restantes` }})
                </span>
              </p>
            </div>

            <div class="flex items-center gap-4 shrink-0 font-mono">
              <div class="text-right">
                <span class="text-[10px] text-slate-400 block font-sans">Total: L. {{ formatMoney(factura.monto_total) }}</span>
                <span class="text-xs font-black"
                      :class="parseFloat(factura.saldo_pendiente) > 0 ? 'text-rose-600' : 'text-slate-400'">
                  Saldo: L. {{ formatMoney(factura.saldo_pendiente) }}
                </span>
              </div>

              <div v-if="parseFloat(factura.saldo_pendiente) > 0" class="flex items-center gap-1.5">
                <button 
                  @click="openPaymentModal(factura, false)"
                  class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Abonar a esta factura"
                >
                  Abonar
                </button>
                <button 
                  @click="openPaymentModal(factura, true)"
                  class="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                  title="Liquidar la factura completa"
                >
                  ⚡ Liquidar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Interna 2: Historial de Pagos de este Proveedor -->
        <div v-else-if="statementTab === 'historial'" class="space-y-2">
          <div v-if="statementModalData.historial_pagos.length === 0" class="text-center py-6 text-slate-400 text-xs">
            Aún no se han registrado abonos o liquidaciones a este proveedor.
          </div>
          <div 
            v-else
            v-for="pago in statementModalData.historial_pagos"
            :key="pago.id"
            class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between gap-3"
          >
            <div>
              <p class="font-bold text-slate-800">{{ pago.descripcion }}</p>
              <p class="text-[10px] text-slate-500 font-mono mt-0.5">
                {{ formatDate(pago.fecha_gasto || pago.created_at) }} • {{ pago.metodo_pago }} {{ pago.banco_origen ? `(${pago.banco_origen})` : '' }} • Ref: {{ pago.numero_comprobante || 'N/A' }}
              </p>
            </div>
            <div class="flex items-center gap-3 font-mono">
              <span class="text-xs font-black text-rose-700">
                - L. {{ formatMoney(pago.monto) }}
              </span>
              <button 
                @click="printSupplierPaymentReceipt(pago)"
                class="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                title="Imprimir comprobante térmico"
              >
                🖨️
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL EXISTENTE: REGISTRAR / EDITAR PROVEEDOR                             -->
    <!-- ========================================================================= -->
    <div v-if="showFormModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-lg font-black text-slate-900">
              {{ isEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor' }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ isEditing ? 'Actualiza la información comercial y bancaria' : 'Ingresa los datos del nuevo suplidor para Ópalo Accesorios' }}
            </p>
          </div>
          <button 
            @click="closeFormModal"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <div v-if="formError" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {{ formError }}
        </div>

        <form @submit.prevent="saveSupplier" class="space-y-4">
          
          <!-- Nombre Empresa y Contacto -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Empresa / Distribuidor *
              </label>
              <input 
                v-model="formData.nombre_empresa"
                type="text" 
                required 
                placeholder="Ej. Distribuidora Textil HN"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Contacto / Asesor de Ventas
              </label>
              <input 
                v-model="formData.contacto_nombre"
                type="text" 
                placeholder="Ej. Lic. Carlos Mejía"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
              />
            </div>
          </div>

          <!-- RTN Hondureño -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              RTN Hondureño (14 dígitos)
            </label>
            <input 
              v-model="formData.rtn"
              type="text" 
              maxlength="14"
              placeholder="08011990123456"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-mono transition bg-slate-50/50"
            />
          </div>

          <!-- Selector Múltiple de Categorías de Suministro -->
          <div class="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-xs font-bold text-slate-800">
                  Categorías de Suministro (Selección Múltiple)
                </label>
                <p class="text-[11px] text-slate-400">Puedes asignar múltiples líneas o rubros a este proveedor</p>
              </div>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    :class="selectedSupplyCategories.length > 0 ? 'bg-opalo-100 text-opalo-700' : 'bg-slate-200 text-slate-500'">
                {{ selectedSupplyCategories.length }} seleccionada(s)
              </span>
            </div>

            <!-- Chips de Categorías Seleccionadas -->
            <div v-if="selectedSupplyCategories.length > 0" class="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200 min-h-[38px] items-center">
              <span 
                v-for="(cat, idx) in selectedSupplyCategories" 
                :key="cat"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-opalo-50 text-opalo-700 border border-opalo-200"
              >
                <span>🏷️ {{ cat }}</span>
                <button 
                  type="button"
                  @click="removeSupplyCategory(idx)"
                  class="text-opalo-400 hover:text-rose-600 font-bold ml-0.5 transition cursor-pointer"
                  title="Quitar"
                >
                  ✕
                </button>
              </span>
            </div>
            <div v-else class="text-[11px] text-slate-400 italic px-1">
              Ninguna categoría seleccionada aún. Elige entre las sugerencias o escribe una nueva.
            </div>

            <!-- Sugerencias Rápidas / Presets -->
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Líneas y productos habituales de Ópalo:
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  v-for="cat in presetSupplyCategories"
                  :key="cat"
                  @click="toggleSupplyCategory(cat)"
                  :class="selectedSupplyCategories.includes(cat) 
                    ? 'bg-opalo-600 text-white border-opalo-600 shadow-xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-opalo-300 hover:text-opalo-600 hover:bg-opalo-50/50'"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1"
                >
                  <span>{{ selectedSupplyCategories.includes(cat) ? '✓' : '+' }}</span>
                  <span>{{ cat }}</span>
                </button>
              </div>
            </div>

            <!-- Entrada personalizada -->
            <div class="flex gap-2 pt-1">
              <input 
                v-model="newCustomCategory"
                @keydown.enter.prevent="addCustomSupplyCategory"
                type="text" 
                placeholder="Otra categoría personalizada (ej. Maquillaje, Perfumería)..."
                class="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs bg-white"
              />
              <button 
                type="button"
                @click="addCustomSupplyCategory"
                class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                + Agregar
              </button>
            </div>
          </div>

          <!-- Teléfonos y Correo -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Teléfono Principal / WhatsApp *
              </label>
              <input 
                v-model="formData.telefono"
                type="text" 
                required
                placeholder="+504 9876-5432"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Teléfono Secundario
              </label>
              <input 
                v-model="formData.telefono_secundario"
                type="text" 
                placeholder="+504 2234-5678"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input 
                v-model="formData.email"
                type="email" 
                placeholder="ventas@proveedor.hn"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
              />
            </div>
          </div>

          <!-- Ciudad y Dirección -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Ciudad / Municipio
              </label>
              <input 
                v-model="formData.ciudad"
                type="text" 
                placeholder="Tocoa, San Pedro Sula..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Dirección Física
              </label>
              <input 
                v-model="formData.direccion"
                type="text" 
                placeholder="Barrio, Calle, Edificio..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
              />
            </div>
          </div>

          <!-- Información Bancaria y Crédito -->
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <p class="text-xs font-black text-slate-800 uppercase tracking-wider">
              Datos para Pagos y Transferencias (Honduras)
            </p>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  Banco
                </label>
                <select 
                  v-model="formData.banco"
                  class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="">Seleccione Banco</option>
                  <option value="BAC Credomatic">BAC Credomatic</option>
                  <option value="Banco Atlántida">Banco Atlántida</option>
                  <option value="Banco Ficohsa">Banco Ficohsa</option>
                  <option value="Banrural">Banrural</option>
                  <option value="Banco de Occidente">Banco de Occidente</option>
                  <option value="Banco Promerica">Banco Promerica</option>
                  <option value="Banhcafé">Banhcafé</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  Número de Cuenta Bancaria
                </label>
                <input 
                  v-model="formData.cuenta_bancaria"
                  type="text" 
                  placeholder="Ej. 741289563"
                  class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  Días de Crédito Otorgados
                </label>
                <select 
                  v-model.number="formData.dias_credito"
                  class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option :value="0">Contado (0 días)</option>
                  <option :value="15">15 días de crédito</option>
                  <option :value="30">30 días de crédito</option>
                  <option :value="45">45 días de crédito</option>
                  <option :value="60">60 días de crédito</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Notas u Observaciones -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Notas / Condiciones de Entrega
            </label>
            <textarea 
              v-model="formData.notas"
              rows="2"
              placeholder="Ej. Entrega por Expreso del Valle, descuentos por volumen..."
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
            ></textarea>
          </div>

          <!-- Botones de Acción -->
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              @click="closeFormModal"
              class="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              :disabled="isSaving"
              class="px-6 py-2.5 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-opalo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span v-if="isSaving">⏳</span>
              <span>{{ isSaving ? 'Guardando...' : (isEditing ? 'Actualizar Proveedor' : 'Guardar Proveedor') }}</span>
            </button>
          </div>

        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL EXISTENTE: FICHA DETALLADA DE PROVEEDOR                             -->
    <!-- ========================================================================= -->
    <div v-if="selectedSupplier" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
        <div class="flex justify-between items-start">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-opalo-600 to-rose-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-opalo-400/30">
              {{ selectedSupplier.nombre_empresa.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-base font-black text-slate-900">{{ selectedSupplier.nombre_empresa }}</h2>
              <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                    :class="selectedSupplier.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                {{ selectedSupplier.estado }}
              </span>
            </div>
          </div>
          <button 
            @click="selectedSupplier = null"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <p class="text-[10px] uppercase font-bold text-slate-400">Contacto</p>
            <p class="font-bold text-slate-800">{{ selectedSupplier.contacto_nombre || 'No registrado' }}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Categorías de Suministro</p>
            <div class="flex flex-wrap gap-1">
              <span 
                v-for="cat in parseCategories(selectedSupplier.categoria_suministro)"
                :key="cat"
                class="inline-block text-[10px] font-bold text-opalo-700 bg-opalo-50 border border-opalo-200 px-2 py-0.5 rounded-md"
              >
                🏷️ {{ cat }}
              </span>
              <span 
                v-if="parseCategories(selectedSupplier.categoria_suministro).length === 0"
                class="font-bold text-slate-800"
              >
                General
              </span>
            </div>
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold text-slate-400">Teléfono</p>
            <p class="font-mono font-bold text-slate-800">{{ selectedSupplier.telefono }}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold text-slate-400">RTN</p>
            <p class="font-mono font-bold text-slate-800">{{ selectedSupplier.rtn || 'Sin RTN' }}</p>
          </div>
          <div class="col-span-2">
            <p class="text-[10px] uppercase font-bold text-slate-400">Dirección y Ciudad</p>
            <p class="font-semibold text-slate-800">{{ selectedSupplier.direccion || 'Sin dirección' }} • {{ selectedSupplier.ciudad || 'Tocoa' }}</p>
          </div>
        </div>

        <!-- Ficha Bancaria -->
        <div v-if="selectedSupplier.banco || selectedSupplier.cuenta_bancaria" class="p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
          <p class="text-[10px] font-black uppercase text-blue-700 tracking-wider mb-1">
            Cuenta para Transferencias
          </p>
          <div class="flex items-center justify-between text-xs">
            <div>
              <p class="font-bold text-slate-900">{{ selectedSupplier.banco }}</p>
              <p class="font-mono text-slate-700">{{ selectedSupplier.cuenta_bancaria }}</p>
            </div>
            <button 
              @click="copyToClipboard(selectedSupplier.cuenta_bancaria)"
              class="px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Copiar
            </button>
          </div>
        </div>

        <!-- Acceso directo a Pagos desde Ficha -->
        <div class="pt-2 flex justify-between items-center">
          <button 
            @click="openSupplierStatementModal(selectedSupplier)"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>💳</span>
            <span>Ver Cuentas & Pagos</span>
          </button>

          <a 
            :href="formatWhatsAppUrl(selectedSupplier.telefono)"
            target="_blank"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>💬</span>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { user } = useAuth();
const { companyConfig, getFullLogoUrl } = useCompanyConfig();

// Pestaña Principal activa ('directorio' | 'pagos')
const activeMainTab = ref('directorio');

// Datos de Proveedores
const suppliers = ref([]);
const stats = ref({
  total_proveedores: 0,
  activos: 0,
  total_categorias: 0,
  total_deuda_proveedores: 0,
  proveedores_con_deuda: 0,
  total_pagos_historicos: 0
});
const isLoading = ref(true);
const searchQuery = ref('');
const filterEstado = ref('');
const filterConDeuda = ref('');

// Modales de Proveedor (Crear/Editar/Ver)
const showFormModal = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const formError = ref('');
const selectedSupplier = ref(null);

// =============================================================================
// CONTROL DE PAGOS A PROVEEDORES, FACTURAS Y ABONOS
// =============================================================================
const paymentsOverviewData = ref(null);
const isLoadingPayments = ref(false);
const paymentsFilterSupplierId = ref('');
const paymentsFilterStatus = ref('TODOS');

// Modal de Abono / Liquidación
const isPaymentModalOpen = ref(false);
const isSubmittingPayment = ref(false);
const paymentError = ref('');
const activeCxpForPayment = ref(null);
const isLiquidacionMode = ref(false);

const paymentForm = reactive({
  monto_abono: '',
  metodo_pago: 'TRANSFERENCIA',
  banco_origen: 'BAC Credomatic',
  numero_comprobante: '',
  fecha_pago: '',
  notas: '',
  imprimir_comprobante: true
});

// Modal de Nueva Factura por Pagar
const isNewInvoiceModalOpen = ref(false);
const isSubmittingNewInvoice = ref(false);
const newInvoiceError = ref('');

const newInvoiceForm = reactive({
  proveedor_id: '',
  numero_factura_proveedor: '',
  descripcion: '',
  monto_total: '',
  fecha_emision: '',
  fecha_vencimiento: '',
  notas: ''
});

// Modal Estado de Cuenta de Proveedor
const statementModalData = ref(null);
const statementTab = ref('facturas');

// =============================================================================
// HELPERS DE FECHA, MONEDA Y CATEGORÍAS
// =============================================================================
const getTodayLocalDate = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tegucigalpa' }).format(date);
  } catch (e) {
    const now = date instanceof Date ? date : new Date(date);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

const formatMoney = (val) => {
  return parseFloat(val || 0).toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const presetSupplyCategories = [
  'Joyería & Baño de Oro',
  'Ropa Casual & Vestidos',
  'Bolsos, Carteras & Mochilas',
  'Calzado & Sandalias',
  'Accesorios para Cabello',
  'Lencería & Prendas Íntimas',
  'Cosméticos & Cuidado Personal',
  'Empaques, Bolsas & Regalos',
  'Perfumería & Fragancias',
  'Gafas de Sol & Relojes'
];

const selectedSupplyCategories = ref([]);
const newCustomCategory = ref('');

const parseCategories = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
};

const toggleSupplyCategory = (cat) => {
  const index = selectedSupplyCategories.value.indexOf(cat);
  if (index >= 0) {
    selectedSupplyCategories.value.splice(index, 1);
  } else {
    selectedSupplyCategories.value.push(cat);
  }
};

const addCustomSupplyCategory = () => {
  const val = newCustomCategory.value.trim();
  if (val && !selectedSupplyCategories.value.includes(val)) {
    selectedSupplyCategories.value.push(val);
  }
  newCustomCategory.value = '';
};

const removeSupplyCategory = (idx) => {
  selectedSupplyCategories.value.splice(idx, 1);
};

const activeCount = computed(() => suppliers.value.filter(s => s.estado === 'ACTIVO').length);
const categoryCount = computed(() => {
  const set = new Set();
  suppliers.value.forEach(s => {
    parseCategories(s.categoria_suministro).forEach(c => set.add(c));
  });
  return set.size;
});

// =============================================================================
// CARGA DE DATOS DE PROVEEDORES
// =============================================================================
const initialForm = {
  id: null,
  nombre_empresa: '',
  contacto_nombre: '',
  rtn: '',
  telefono: '',
  telefono_secundario: '',
  email: '',
  direccion: '',
  ciudad: 'Tocoa',
  categoria_suministro: '',
  dias_credito: 0,
  banco: '',
  cuenta_bancaria: '',
  notas: ''
};

const formData = reactive({ ...initialForm });

let debounceTimer = null;
const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchSuppliers();
  }, 300);
};

const fetchSuppliers = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value) params.append('search', searchQuery.value);
    if (filterEstado.value) params.append('estado', filterEstado.value);
    if (filterConDeuda.value) params.append('con_deuda', filterConDeuda.value);

    const res = await apiFetch(`/proveedores?${params.toString()}`);
    if (res && res.success) {
      suppliers.value = res.data || [];
      if (res.stats) stats.value = res.stats;
    }
  } catch (err) {
    console.error('Error cargando proveedores:', err);
  } finally {
    isLoading.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  filterEstado.value = '';
  filterConDeuda.value = '';
  fetchSuppliers();
};

// =============================================================================
// GESTIÓN DE CONTROL DE PAGOS A PROVEEDORES
// =============================================================================
const fetchPaymentsOverview = async () => {
  isLoadingPayments.value = true;
  try {
    const params = new URLSearchParams();
    if (paymentsFilterSupplierId.value) params.append('proveedor_id', paymentsFilterSupplierId.value);
    if (paymentsFilterStatus.value && paymentsFilterStatus.value !== 'TODOS') params.append('estado', paymentsFilterStatus.value);

    const res = await apiFetch(`/proveedores/control-pagos/resumen?${params.toString()}`);
    if (res && res.success) {
      paymentsOverviewData.value = res.data;
    }
  } catch (err) {
    console.error('Error cargando control de pagos:', err);
  } finally {
    isLoadingPayments.value = false;
  }
};

const switchTabToPayments = () => {
  activeMainTab.value = 'pagos';
  fetchPaymentsOverview();
};

// Cálculo en vivo del saldo restante al abonar
const calculatedRemainingBalance = computed(() => {
  if (!activeCxpForPayment.value) return 0;
  const currentSaldo = parseFloat(activeCxpForPayment.value.saldo_pendiente || 0);
  const abono = parseFloat(paymentForm.monto_abono || 0);
  const remaining = currentSaldo - abono;
  return remaining > 0 ? parseFloat(remaining.toFixed(2)) : 0;
});

const setPaymentAmount = (amt) => {
  const parsed = parseFloat(amt);
  paymentForm.monto_abono = parsed > 0 ? parsed.toFixed(2) : '';
};

// Abrir Modal para Abonar o Liquidar
const openPaymentModal = (cxp, isLiquidacion = false) => {
  activeCxpForPayment.value = cxp;
  isLiquidacionMode.value = isLiquidacion;
  paymentError.value = '';

  const saldo = parseFloat(cxp.saldo_pendiente || 0);
  paymentForm.monto_abono = isLiquidacion ? saldo.toFixed(2) : '';
  paymentForm.metodo_pago = 'TRANSFERENCIA';
  paymentForm.banco_origen = cxp.proveedor_banco || 'BAC Credomatic';
  paymentForm.numero_comprobante = '';
  paymentForm.fecha_pago = getTodayLocalDate();
  paymentForm.notas = '';
  paymentForm.imprimir_comprobante = true;

  isPaymentModalOpen.value = true;
};

// Procesar el Abono o Liquidación
const submitAbono = async () => {
  if (!activeCxpForPayment.value) return;

  const abonoNum = parseFloat(paymentForm.monto_abono);
  const saldoActual = parseFloat(activeCxpForPayment.value.saldo_pendiente || 0);

  if (isNaN(abonoNum) || abonoNum <= 0) {
    paymentError.value = 'Ingrese un monto de abono válido mayor a 0';
    return;
  }
  if (abonoNum > saldoActual) {
    paymentError.value = `El abono no puede exceder el saldo actual de L. ${formatMoney(saldoActual)}`;
    return;
  }

  isSubmittingPayment.value = true;
  paymentError.value = '';

  try {
    const res = await apiFetch(`/finanzas/cuentas-por-pagar/${activeCxpForPayment.value.id}/abono`, {
      method: 'POST',
      body: {
        monto_abono: abonoNum,
        metodo_pago: paymentForm.metodo_pago,
        banco_origen: paymentForm.banco_origen,
        numero_comprobante: paymentForm.numero_comprobante,
        fecha_pago: paymentForm.fecha_pago,
        notas: paymentForm.notas
      }
    });

    if (res && res.success) {
      isPaymentModalOpen.value = false;
      
      const pagoData = {
        id: res.data.pago_id,
        monto: abonoNum,
        proveedor_nombre: activeCxpForPayment.value.proveedor_nombre,
        numero_factura_proveedor: activeCxpForPayment.value.numero_factura_proveedor,
        metodo_pago: paymentForm.metodo_pago,
        banco_origen: paymentForm.banco_origen,
        numero_comprobante: paymentForm.numero_comprobante,
        fecha_gasto: paymentForm.fecha_pago,
        notas: paymentForm.notas,
        saldo_anterior: saldoActual,
        saldo_pendiente: res.data.saldo_pendiente,
        es_liquidacion: res.data.es_liquidacion
      };

      if (paymentForm.imprimir_comprobante) {
        printSupplierPaymentReceipt(pagoData);
      }

      alert(res.message);

      // Recargar datos
      await fetchPaymentsOverview();
      await fetchSuppliers();
      if (statementModalData.value && statementModalData.value.proveedor.id === activeCxpForPayment.value.proveedor_id) {
        await openSupplierStatementById(activeCxpForPayment.value.proveedor_id);
      }
    } else {
      paymentError.value = res?.message || 'Error al procesar el pago';
    }
  } catch (err) {
    paymentError.value = err?.data?.message || err?.message || 'Error al conectar con el servidor';
  } finally {
    isSubmittingPayment.value = false;
  }
};

// =============================================================================
// MODAL: REGISTRAR NUEVA FACTURA POR PAGAR
// =============================================================================
const openNewInvoiceModal = (supplier = null) => {
  newInvoiceError.value = '';
  newInvoiceForm.proveedor_id = supplier ? supplier.id : (suppliers.value.length > 0 ? suppliers.value[0].id : '');
  newInvoiceForm.numero_factura_proveedor = '';
  newInvoiceForm.descripcion = '';
  newInvoiceForm.monto_total = '';
  newInvoiceForm.fecha_emision = getTodayLocalDate();
  newInvoiceForm.notas = '';
  
  recalculateInvoiceDueDate();
  isNewInvoiceModalOpen.value = true;
};

const onNewInvoiceSupplierChange = () => {
  recalculateInvoiceDueDate();
};

const recalculateInvoiceDueDate = () => {
  const sup = suppliers.value.find(s => s.id === Number(newInvoiceForm.proveedor_id));
  const dias = sup?.dias_credito || 30;
  const emision = newInvoiceForm.fecha_emision ? new Date(newInvoiceForm.fecha_emision + 'T12:00:00') : new Date();
  emision.setDate(emision.getDate() + dias);
  newInvoiceForm.fecha_vencimiento = getTodayLocalDate(emision);
};

const submitNewInvoice = async () => {
  if (!newInvoiceForm.proveedor_id || !newInvoiceForm.numero_factura_proveedor || !newInvoiceForm.monto_total) {
    newInvoiceError.value = 'Complete todos los campos obligatorios (*)';
    return;
  }

  isSubmittingNewInvoice.value = true;
  newInvoiceError.value = '';

  try {
    const res = await apiFetch(`/proveedores/${newInvoiceForm.proveedor_id}/facturas`, {
      method: 'POST',
      body: newInvoiceForm
    });

    if (res && res.success) {
      isNewInvoiceModalOpen.value = false;
      alert(`¡Factura ${newInvoiceForm.numero_factura_proveedor} registrada exitosamente!`);
      await fetchPaymentsOverview();
      await fetchSuppliers();
      if (statementModalData.value && statementModalData.value.proveedor.id === Number(newInvoiceForm.proveedor_id)) {
        await openSupplierStatementById(newInvoiceForm.proveedor_id);
      }
    } else {
      newInvoiceError.value = res?.message || 'Error al guardar la factura';
    }
  } catch (err) {
    newInvoiceError.value = err?.data?.message || err?.message || 'Error al conectar con el servidor';
  } finally {
    isSubmittingNewInvoice.value = false;
  }
};

// =============================================================================
// MODAL: ESTADO DE CUENTA DE UN PROVEEDOR ESPECÍFICO
// =============================================================================
const openSupplierStatementModal = async (sup) => {
  if (selectedSupplier.value) selectedSupplier.value = null;
  await openSupplierStatementById(sup.id);
};

const openSupplierStatementById = async (supplierId) => {
  try {
    const res = await apiFetch(`/proveedores/${supplierId}/estado-cuenta`);
    if (res && res.success) {
      statementModalData.value = res.data;
      statementTab.value = 'facturas';
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al cargar estado de cuenta del proveedor');
  }
};

// Helpers de Estado CXP
const getCxpStatusLabel = (cxp) => {
  const saldo = parseFloat(cxp.saldo_pendiente || 0);
  if (saldo <= 0) return 'Liquidada / Pagada';
  if (cxp.dias_para_vencer < 0) return 'Vencida';
  if (parseFloat(cxp.monto_pagado) > 0) return 'Abono Parcial';
  return 'Pendiente';
};

const getCxpStatusBadgeClass = (cxp) => {
  const saldo = parseFloat(cxp.saldo_pendiente || 0);
  if (saldo <= 0) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (cxp.dias_para_vencer < 0) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (parseFloat(cxp.monto_pagado) > 0) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
};

// =============================================================================
// IMPRESIÓN TÉRMICA DE COMPROBANTE DE PAGO A PROVEEDOR (80mm)
// =============================================================================
const printThermalDocument = (htmlContent, title = 'Impresión') => {
  let printFrame = document.getElementById('proveedores-print-frame');
  if (printFrame) printFrame.remove();

  printFrame = document.createElement('iframe');
  printFrame.id = 'proveedores-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '80mm';
  printFrame.style.height = '600px';
  printFrame.style.border = 'none';
  printFrame.style.opacity = '0.01';
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
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          width: 80mm;
          margin: 0;
          padding: 8px 10px;
          color: #000;
          line-height: 1.25;
          box-sizing: border-box;
          font-size: 11px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .font-mono { font-family: monospace; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .border-dashed { border-style: dashed; }
        .border-t { border-top: 1px dashed #94a3b8; }
        .border-b { border-bottom: 1px dashed #94a3b8; }
        .my-2 { margin-top: 8px; margin-bottom: 8px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        img { max-height: 48px; max-width: 160px; margin: 0 auto 6px auto; display: block; filter: grayscale(100%); }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        };
      <\/script>
    </body>
    </html>
  `);
  doc.close();
};

const printSupplierPaymentReceipt = (pago) => {
  if (!pago) return;

  const logoHtml = companyConfig.value?.logo_url 
    ? `<img src="${getFullLogoUrl(companyConfig.value.logo_url)}" alt="Logo" />` 
    : '';

  const isLiquidacion = pago.es_liquidacion || parseFloat(pago.saldo_pendiente || 0) <= 0;

  const ticketHtml = `
    <div class="text-center">
      ${logoHtml}
      <h2 style="font-size: 13px; font-weight: 900; margin: 0;">${companyConfig.value?.nombre_empresa || 'ÓPALO ACCESORIOS'}</h2>
      <p style="font-size: 9px; color: #475569; margin: 2px 0;">${companyConfig.value?.direccion || companyConfig.value?.ciudad || 'Tocoa, Colón • Honduras'}</p>
      <p style="font-size: 9px; font-weight: bold; margin: 0;">RTN: ${companyConfig.value?.rtn || '02091995001230'}</p>
      
      <div class="my-2 py-1 border-t border-b border-dashed">
        <h3 style="font-size: 11px; font-weight: 900; margin: 0; text-transform: uppercase;">
          ${isLiquidacion ? 'COMPROBANTE DE LIQUIDACIÓN TOTAL' : 'COMPROBANTE DE ABONO A PROVEEDOR'}
        </h3>
        <p style="font-size: 9px; font-weight: bold; margin: 2px 0;">EGRESO / PAGO A CUENTA COMERCIAL</p>
      </div>

      <p style="font-size: 10px; font-weight: bold; margin: 2px 0;">ID Operación: #${pago.id || Date.now().toString().slice(-6)}</p>
      <p style="font-size: 9px; color: #475569; margin: 0;">Fecha: ${formatDateTime(pago.fecha_gasto || pago.created_at || new Date())}</p>
    </div>

    <!-- DATOS DEL PROVEEDOR BENEFICIARIO -->
    <div class="border-t border-b border-dashed py-1 my-2" style="font-size: 10px;">
      <div class="flex justify-between">
        <span class="font-bold">Proveedor:</span>
        <span class="font-bold">${pago.proveedor_nombre}</span>
      </div>
      ${pago.numero_factura_proveedor ? `
        <div class="flex justify-between">
          <span class="font-bold">Factura Abonada:</span>
          <span class="font-mono">${pago.numero_factura_proveedor}</span>
        </div>
      ` : ''}
      <div class="flex justify-between">
        <span class="font-bold">Método de Pago:</span>
        <span>${pago.metodo_pago}</span>
      </div>
      ${pago.banco_origen ? `
        <div class="flex justify-between">
          <span class="font-bold">Banco Origen:</span>
          <span>${pago.banco_origen}</span>
        </div>
      ` : ''}
      ${pago.numero_comprobante ? `
        <div class="flex justify-between">
          <span class="font-bold">Comprobante / Ref:</span>
          <span class="font-mono">${pago.numero_comprobante}</span>
        </div>
      ` : ''}
    </div>

    <!-- DETALLE DEL IMPORTE Y CUADRE DE SALDOS -->
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; margin: 8px 0;">
      ${pago.saldo_anterior !== undefined ? `
        <div class="flex justify-between" style="font-size: 10px;">
          <span>Saldo Anterior:</span>
          <span class="font-mono">L. ${formatMoney(pago.saldo_anterior)}</span>
        </div>
      ` : ''}
      <div class="flex justify-between" style="font-size: 12px; font-weight: 900; color: #047857; margin: 3px 0;">
        <span>MONTO ABONADO:</span>
        <span class="font-mono">L. ${formatMoney(pago.monto)}</span>
      </div>
      ${pago.saldo_pendiente !== undefined ? `
        <div class="flex justify-between" style="font-size: 10px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 3px; margin-top: 3px;">
          <span>Nuevo Saldo Pendiente:</span>
          <span class="font-mono">${parseFloat(pago.saldo_pendiente) <= 0 ? 'L. 0.00 (LIQUIDADO)' : `L. ${formatMoney(pago.saldo_pendiente)}`}</span>
        </div>
      ` : ''}
    </div>

    ${pago.notas ? `
      <div style="font-size: 9px; font-style: italic; margin: 6px 0;">
        <strong>Observaciones:</strong> ${pago.notas}
      </div>
    ` : ''}

    <!-- Firmas -->
    <div style="margin-top: 24px; padding-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center; font-size: 9px;">
      <div>
        <div style="border-top: 1px solid #64748b; padding-top: 2px;">
          <p class="font-bold" style="margin: 0;">Pagado por</p>
          <p style="font-size: 8px; color: #64748b; margin: 0;">${pago.usuario_nombre || user.value?.nombre || 'Administración POS'}</p>
        </div>
      </div>
      <div>
        <div style="border-top: 1px solid #64748b; padding-top: 2px;">
          <p class="font-bold" style="margin: 0;">Recibido por</p>
          <p style="font-size: 8px; color: #64748b; margin: 0;">Firma / Sello Proveedor</p>
        </div>
      </div>
    </div>

    <div class="text-center" style="margin-top: 12px; font-size: 8px; color: #94a3b8;">
      <p style="margin: 0;">Comprobante de Egreso Contable • Ópalo Accesorios</p>
    </div>
  `;

  printThermalDocument(ticketHtml, `Comprobante de Pago Proveedor - #${pago.id}`);
};

// =============================================================================
// MODAL EXISTENTE: CREAR / EDITAR PROVEEDOR
// =============================================================================
const openCreateModal = () => {
  isEditing.value = false;
  formError.value = '';
  Object.assign(formData, initialForm);
  selectedSupplyCategories.value = [];
  newCustomCategory.value = '';
  showFormModal.value = true;
};

const openEditModal = (sup) => {
  isEditing.value = true;
  formError.value = '';
  Object.assign(formData, {
    id: sup.id,
    nombre_empresa: sup.nombre_empresa,
    contacto_nombre: sup.contacto_nombre || '',
    rtn: sup.rtn || '',
    telefono: sup.telefono,
    telefono_secundario: sup.telefono_secundario || '',
    email: sup.email || '',
    direccion: sup.direccion || '',
    ciudad: sup.ciudad || 'Tocoa',
    categoria_suministro: sup.categoria_suministro || '',
    dias_credito: sup.dias_credito || 0,
    banco: sup.banco || '',
    cuenta_bancaria: sup.cuenta_bancaria || '',
    notas: sup.notas || ''
  });
  selectedSupplyCategories.value = parseCategories(sup.categoria_suministro);
  newCustomCategory.value = '';
  showFormModal.value = true;
};

const closeFormModal = () => {
  showFormModal.value = false;
};

const openViewModal = (sup) => {
  selectedSupplier.value = sup;
};

const saveSupplier = async () => {
  formError.value = '';
  isSaving.value = true;

  formData.categoria_suministro = selectedSupplyCategories.value.join(', ');

  try {
    if (isEditing.value) {
      const res = await apiFetch(`/proveedores/${formData.id}`, {
        method: 'PUT',
        body: formData
      });
      if (res && res.success) {
        closeFormModal();
        await fetchSuppliers();
      } else {
        formError.value = res?.message || 'Error al actualizar proveedor';
      }
    } else {
      const res = await apiFetch('/proveedores', {
        method: 'POST',
        body: formData
      });
      if (res && res.success) {
        closeFormModal();
        await fetchSuppliers();
      } else {
        formError.value = res?.message || 'Error al registrar proveedor';
      }
    }
  } catch (err) {
    formError.value = err?.data?.message || err?.message || 'Error al conectar con el servidor';
  } finally {
    isSaving.value = false;
  }
};

const toggleStatus = async (sup) => {
  try {
    const res = await apiFetch(`/proveedores/${sup.id}/estado`, {
      method: 'PATCH'
    });
    if (res && res.success) {
      sup.estado = res.data.estado;
    }
  } catch (err) {
    console.error('Error al cambiar estado:', err);
  }
};

const confirmDelete = async (sup) => {
  if (confirm(`¿Estás seguro de eliminar al proveedor "${sup.nombre_empresa}"?`)) {
    try {
      const res = await apiFetch(`/proveedores/${sup.id}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        await fetchSuppliers();
      }
    } catch (err) {
      alert(err?.data?.message || 'No se pudo eliminar el proveedor');
    }
  }
};

const formatWhatsAppUrl = (phone) => {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`;
  return `https://wa.me/${finalPhone}?text=Hola,%20nos%20comunicamos%20de%20%C3%93palo%20Accesorios%20en%20Tocoa,%20Col%C3%B3n`;
};

const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    alert(`Cuenta copiada: ${text}`);
  }
};

const exportToCSV = () => {
  if (suppliers.value.length === 0) return;
  const headers = ['ID', 'Empresa', 'Contacto', 'RTN', 'Telefono', 'Email', 'Ciudad', 'Categoria', 'Dias Credito', 'Banco', 'Cuenta', 'Saldo Pendiente', 'Estado'];
  const rows = suppliers.value.map(s => [
    s.id,
    `"${s.nombre_empresa.replace(/"/g, '""')}"`,
    `"${(s.contacto_nombre || '').replace(/"/g, '""')}"`,
    `"${s.rtn || ''}"`,
    `"${s.telefono}"`,
    `"${s.email || ''}"`,
    `"${s.ciudad || 'Tocoa'}"`,
    `"${(s.categoria_suministro || '').replace(/"/g, '""')}"`,
    s.dias_credito || 0,
    `"${s.banco || ''}"`,
    `"${s.cuenta_bancaria || ''}"`,
    s.saldo_pendiente || 0,
    s.estado
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `proveedores_opalo_${getTodayLocalDate()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  fetchSuppliers();
  fetchPaymentsOverview();
});
</script>
