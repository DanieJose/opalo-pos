<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">

    <!-- Encabezado exclusivo para Impresión Oficial de Reportes -->
    <div class="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
      <div class="flex items-center space-x-4">
        <img 
          v-if="companyConfig?.logo_url && !logoError" 
          :src="getFullLogoUrl(companyConfig.logo_url)" 
          alt="Logo Empresa" 
          class="h-14 max-w-[160px] object-contain"
          @error="logoError = true"
        />
        <div>
          <h1 class="text-xl font-black text-slate-900 leading-tight uppercase">
            {{ companyConfig?.nombre_empresa || 'ÓPALO ACCESORIOS' }}
          </h1>
          <p class="text-xs text-slate-600 font-bold">
            RTN: {{ companyConfig?.rtn || '02091995001230' }} • {{ companyConfig?.ciudad || 'Tocoa, Colón' }}, {{ companyConfig?.pais || 'Honduras' }}
          </p>
          <p class="text-[10px] text-slate-500">
            Tel: {{ companyConfig?.telefono || '+504 9876-5432' }} • Email: {{ companyConfig?.email || 'contacto@opalo.hn' }}
          </p>
        </div>
      </div>
      <div class="text-right">
        <h2 class="text-sm font-black text-slate-900 uppercase">REPORTE OFICIAL DEL SISTEMA</h2>
        <p class="text-xs text-slate-600 font-bold">Generado: {{ new Date().toLocaleString('es-HN') }}</p>
      </div>
    </div>

    <!-- Cabecera Principal del Módulo de Reportes -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
      <div>
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md shadow-indigo-200 shrink-0">
            📊
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Centro de Reportes & Analítica</h1>
              <span class="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Gerencial
              </span>
            </div>
            <p class="text-xs text-slate-500 font-medium">
              Reportes ejecutivos de ventas, facturación, impuestos (ISV), valorización de inventario, rotación de productos y clientes VIP.
            </p>
          </div>
        </div>
      </div>

      <!-- Acciones Globales: Imprimir y Exportar -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="printReport"
          title="Imprimir o Guardar en PDF"
          class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <span>🖨️</span>
          <span>Imprimir / PDF</span>
        </button>

        <button
          @click="exportActiveTabCsv"
          title="Exportar datos actuales a archivo Excel / CSV"
          class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-200"
        >
          <span>📥</span>
          <span>Exportar a Excel (CSV)</span>
        </button>
      </div>
    </div>

    <!-- Pestañas de Navegación del Centro de Reportes -->
    <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
      <button
        v-for="tab in reportTabs"
        :key="tab.id"
        @click="selectTab(tab.id)"
        class="px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 cursor-pointer"
        :class="activeTab === tab.id 
          ? 'bg-slate-900 text-white shadow-xs' 
          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
      >
        <span>{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Barra de Filtros (Fechas, Período, Cajeros, etc.) -->
    <div v-if="activeTab !== 'inventario'" class="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">Período:</span>
        <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            v-for="p in periodOptions"
            :key="p.value"
            @click="setPeriod(p.value)"
            class="px-3 py-1.5 rounded-xl transition cursor-pointer"
            :class="selectedPeriod === p.value ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'"
          >
            {{ p.label }}
          </button>
        </div>

        <!-- Rango Personalizado de Fechas -->
        <div v-if="selectedPeriod === 'personalizado'" class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs">
          <input 
            v-model="customStartDate" 
            type="date" 
            class="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500" 
          />
          <span class="text-slate-400 font-bold">a</span>
          <input 
            v-model="customEndDate" 
            type="date" 
            class="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500" 
          />
          <button 
            @click="loadActiveReportData" 
            class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Filtrar
          </button>
        </div>
      </div>

      <!-- Filtros adicionales según la pestaña -->
      <div class="flex items-center gap-3">
        <!-- Filtro Cajero (solo en ventas) -->
        <div v-if="activeTab === 'ventas'" class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500">Cajero:</span>
          <select 
            v-model="filterCashierId" 
            @change="loadSalesReport"
            class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los Cajeros</option>
            <option v-for="user in cashiersList" :key="user.id" :value="user.id">
              {{ user.nombre }}
            </option>
          </select>
        </div>

        <!-- Filtro Método de Pago (solo en ventas) -->
        <div v-if="activeTab === 'ventas'" class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500">Pago:</span>
          <select 
            v-model="filterPaymentMethod" 
            @change="loadSalesReport"
            class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los Métodos</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="MIXTO">Mixto</option>
          </select>
        </div>

        <!-- Filtro Categoría (en Top Productos) -->
        <div v-if="activeTab === 'top_productos'" class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500">Categoría:</span>
          <select 
            v-model="filterCategoryId" 
            @change="loadTopSellingReport"
            class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todas las Categorías</option>
            <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">
              {{ cat.nombre }}
            </option>
          </select>
        </div>

        <!-- Indicador de carga -->
        <div v-if="isLoading" class="text-xs text-indigo-600 font-bold flex items-center gap-1.5 animate-pulse">
          <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
          <span>Actualizando...</span>
        </div>
      </div>
    </div>

    <!-- ========================================================================================= -->
    <!-- PESTAÑA 1: REPORTE DE VENTAS Y FACTURACIÓN -->
    <!-- ========================================================================================= -->
    <div v-if="activeTab === 'ventas'" class="space-y-6">

      <!-- TARJETAS DE KPIS DE VENTAS (5 CARDS) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <!-- 1. Total Facturado Bruto -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Total Facturado</span>
            <span class="text-base">🧾</span>
          </div>
          <p class="text-2xl font-black text-slate-900">
            L. {{ salesReport?.kpis?.total_facturado?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}
          </p>
          <p class="text-[11px] text-slate-500 font-medium">
            Subtotal: L. {{ salesReport?.kpis?.total_subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00' }}
          </p>
        </div>

        <!-- 2. Devoluciones / Reembolsos -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Devoluciones</span>
            <span class="text-base">↩️</span>
          </div>
          <p class="text-2xl font-black text-rose-600">
            -L. {{ salesReport?.kpis?.total_devuelto?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}
          </p>
          <p class="text-[11px] text-rose-500 font-bold">
            {{ salesReport?.kpis?.total_devoluciones_cantidad || 0 }} transacciones devueltas
          </p>
        </div>

        <!-- 3. Ventas Netas Reales -->
        <div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-5 rounded-3xl border border-indigo-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-indigo-700">
            <span class="text-[10px] font-black uppercase tracking-wider">Ventas Netas</span>
            <span class="text-base">💎</span>
          </div>
          <p class="text-2xl font-black text-indigo-700">
            L. {{ salesReport?.kpis?.ventas_netas?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}
          </p>
          <p class="text-[11px] text-indigo-600 font-bold">
            Facturado (-) Devoluciones
          </p>
        </div>

        <!-- 4. Impuestos Recaudados (ISV 15% + 18%) -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Impuestos (ISV)</span>
            <span class="text-base">🏛️</span>
          </div>
          <p class="text-2xl font-black text-slate-900">
            L. {{ salesReport?.kpis?.total_isv?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}
          </p>
          <div class="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>ISV 15%: L. {{ salesReport?.kpis?.total_isv_15?.toFixed(2) || '0.00' }}</span>
            <span>ISV 18%: L. {{ salesReport?.kpis?.total_isv_18?.toFixed(2) || '0.00' }}</span>
          </div>
        </div>

        <!-- 5. Transacciones y Ticket Promedio -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Ticket Promedio</span>
            <span class="text-base">🎯</span>
          </div>
          <p class="text-2xl font-black text-emerald-600">
            L. {{ salesReport?.kpis?.ticket_promedio?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}
          </p>
          <p class="text-[11px] text-slate-500 font-medium">
            {{ salesReport?.kpis?.total_ventas || 0 }} facturas emitidas
          </p>
        </div>

      </div>

      <!-- DOS COLUMNAS: EVOLUCIÓN DIARIA Y DESGLOSE POR MÉTODO DE PAGO -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Tabla de Evolución Diaria (2 cols) -->
        <div class="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2">
              <span class="text-lg">📅</span>
              <h3 class="text-sm font-black text-slate-900">Evolución de Ventas por Día</h3>
            </div>
            <span class="text-xs text-slate-400 font-bold">
              {{ salesReport?.ventas_por_dia?.length || 0 }} días registrados
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
                <tr>
                  <th class="py-3 px-4 rounded-l-xl">Fecha</th>
                  <th class="py-3 px-4 text-center">Transacciones</th>
                  <th class="py-3 px-4 text-right">Subtotal</th>
                  <th class="py-3 px-4 text-right">ISV</th>
                  <th class="py-3 px-4 text-right rounded-r-xl">Total Facturado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr v-for="dia in salesReport?.ventas_por_dia" :key="dia.fecha" class="hover:bg-slate-50/70 transition">
                  <td class="py-3 px-4 font-bold text-slate-900">
                    {{ dia.fecha }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                      {{ dia.total_ventas }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right text-slate-600">
                    L. {{ dia.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                  </td>
                  <td class="py-3 px-4 text-right text-slate-500">
                    L. {{ dia.isv.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                  </td>
                  <td class="py-3 px-4 text-right font-black text-slate-900">
                    L. {{ dia.total.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                  </td>
                </tr>
                <tr v-if="!salesReport?.ventas_por_dia?.length">
                  <td colspan="5" class="py-8 text-center text-slate-400">
                    No se registraron ventas en el período seleccionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Desglose por Medio de Pago (1 col) -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2">
              <span class="text-lg">💳</span>
              <h3 class="text-sm font-black text-slate-900">Ventas por Medio de Pago</h3>
            </div>
          </div>

          <!-- Totales reales considerando porciones de MIXTO -->
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <p class="text-[10px] font-black uppercase text-slate-400">Distribución Real Recaudada</p>
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between items-center font-bold">
                <span class="text-emerald-700 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Efectivo:
                </span>
                <span class="text-slate-900">L. {{ salesReport?.totales_por_medio_reales?.efectivo?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00' }}</span>
              </div>
              <div class="flex justify-between items-center font-bold">
                <span class="text-blue-700 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span> Tarjeta:
                </span>
                <span class="text-slate-900">L. {{ salesReport?.totales_por_medio_reales?.tarjeta?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00' }}</span>
              </div>
              <div class="flex justify-between items-center font-bold">
                <span class="text-purple-700 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-purple-500"></span> Transferencia:
                </span>
                <span class="text-slate-900">L. {{ salesReport?.totales_por_medio_reales?.transferencia?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00' }}</span>
              </div>
            </div>
          </div>

          <!-- Barras de Distribución por Tipo de Transacción -->
          <div class="space-y-4">
            <div v-for="item in salesReport?.desglose_pagos" :key="item.metodo_pago" class="space-y-1.5">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-slate-700">{{ item.metodo_pago }} ({{ item.cantidad }})</span>
                <span class="font-black text-slate-900">L. {{ item.total.toLocaleString('en-US', { minimumFractionDigits: 2 }) }} ({{ item.porcentaje }}%)</span>
              </div>
              <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-500"
                  :class="{
                    'bg-emerald-500': item.metodo_pago === 'EFECTIVO',
                    'bg-blue-500': item.metodo_pago === 'TARJETA',
                    'bg-purple-500': item.metodo_pago === 'TRANSFERENCIA',
                    'bg-amber-500': item.metodo_pago === 'MIXTO'
                  }"
                  :style="{ width: `${item.porcentaje}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Rendimiento por Cajero / Vendedor -->
          <div class="border-t border-slate-100 pt-4 space-y-3">
            <h4 class="text-xs font-black uppercase text-slate-400">Rendimiento por Cajero</h4>
            <div class="space-y-2">
              <div 
                v-for="cajero in salesReport?.desglose_cajeros" 
                :key="cajero.usuario_id"
                class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs"
              >
                <div>
                  <p class="font-bold text-slate-900">{{ cajero.cajero_nombre }}</p>
                  <p class="text-[10px] text-slate-400">{{ cajero.total_ventas }} ventas realizadas</p>
                </div>
                <div class="text-right">
                  <p class="font-black text-indigo-700">L. {{ cajero.total_vendido.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
                  <p class="text-[10px] font-bold text-slate-500">{{ cajero.porcentaje }}%</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- ========================================================================================= -->
    <!-- PESTAÑA 2: REPORTE DE INVENTARIO Y EXISTENCIAS -->
    <!-- ========================================================================================= -->
    <div v-if="activeTab === 'inventario'" class="space-y-6">

      <!-- KPIS DE VALORIZACIÓN DE INVENTARIO (4 CARDS) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- 1. Valorización a Costo -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Costo Total del Inventario</span>
            <span class="text-base">📦</span>
          </div>
          <p class="text-2xl font-black text-slate-900">
            L. {{ inventoryReport?.resumen_valorizacion?.valor_total_costo?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}
          </p>
          <p class="text-[11px] text-slate-500 font-medium">
            Dinero invertido en compra a proveedores
          </p>
        </div>

        <!-- 2. Valorización a Precio de Venta -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Valorización a Venta</span>
            <span class="text-base">🏷️</span>
          </div>
          <p class="text-2xl font-black text-indigo-600">
            L. {{ inventoryReport?.resumen_valorizacion?.valor_total_venta?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}
          </p>
          <p class="text-[11px] text-slate-500 font-medium">
            Valor de facturación si se vende el 100%
          </p>
        </div>

        <!-- 3. Ganancia Potencial en Almacén -->
        <div class="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-emerald-800">
            <span class="text-[10px] font-black uppercase tracking-wider">Utilidad Potencial</span>
            <span class="text-base">💎</span>
          </div>
          <p class="text-2xl font-black text-emerald-700">
            L. {{ inventoryReport?.resumen_valorizacion?.ganancia_potencial?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}
          </p>
          <p class="text-[11px] font-bold text-emerald-600">
            Margen estimado: {{ inventoryReport?.resumen_valorizacion?.margen_potencial_pct || 0 }}%
          </p>
        </div>

        <!-- 4. Unidades y Alertas de Stock -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1.5">
          <div class="flex items-center justify-between text-slate-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Existencias Físicas</span>
            <span class="text-base">👗</span>
          </div>
          <p class="text-2xl font-black text-purple-700">
            {{ inventoryReport?.resumen_valorizacion?.stock_total_unidades || 0 }} unidades
          </p>
          <div class="flex justify-between text-[11px] font-bold pt-0.5">
            <span class="text-slate-500">{{ inventoryReport?.resumen_valorizacion?.total_variantes || 0 }} variantes</span>
            <span v-if="(inventoryReport?.resumen_valorizacion?.variantes_stock_bajo || 0) > 0" class="text-rose-600">
              ⚠️ {{ inventoryReport?.resumen_valorizacion?.variantes_stock_bajo }} stock bajo
            </span>
            <span v-else class="text-emerald-600">Stock Óptimo ✓</span>
          </div>
        </div>

      </div>

      <!-- TABLA DE EXISTENCIAS POR CATEGORÍA -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2">
            <span class="text-lg">📂</span>
            <h3 class="text-sm font-black text-slate-900">Existencias y Valorización por Categoría</h3>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
              <tr>
                <th class="py-3 px-4 rounded-l-xl">Categoría</th>
                <th class="py-3 px-4 text-center">Productos / Variantes</th>
                <th class="py-3 px-4 text-center">Unidades Físicas</th>
                <th class="py-3 px-4 text-right">Valor Costo</th>
                <th class="py-3 px-4 text-right">Valor Venta</th>
                <th class="py-3 px-4 text-right">Ganancia Potencial</th>
                <th class="py-3 px-4 text-right rounded-r-xl">% Inventario</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr v-for="cat in inventoryReport?.inventario_por_categoria" :key="cat.categoria_id" class="hover:bg-slate-50/70 transition">
                <td class="py-3 px-4 font-bold text-slate-900">
                  {{ cat.categoria_nombre }}
                </td>
                <td class="py-3 px-4 text-center text-slate-500">
                  {{ cat.total_productos }} prod. / {{ cat.total_variantes }} var.
                </td>
                <td class="py-3 px-4 text-center font-bold text-slate-800">
                  {{ cat.stock_unidades }} uds.
                </td>
                <td class="py-3 px-4 text-right text-slate-600">
                  L. {{ cat.valor_costo.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="py-3 px-4 text-right font-black text-indigo-700">
                  L. {{ cat.valor_venta.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="py-3 px-4 text-right font-black text-emerald-600">
                  L. {{ cat.ganancia_potencial.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="py-3 px-4 text-right font-bold text-slate-700">
                  {{ cat.porcentaje_stock }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABLA DE VARIANTES CON ALERTA DE STOCK BAJO O CRÍTICO -->
      <div v-if="inventoryReport?.alertas_stock_critico?.length" class="bg-white rounded-3xl p-6 border border-rose-200 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-rose-100 pb-3">
          <div class="flex items-center space-x-2 text-rose-700">
            <span class="text-lg">⚠️</span>
            <h3 class="text-sm font-black">Productos con Stock Crítico o Agotados</h3>
          </div>
          <span class="text-xs text-rose-600 font-bold">
            {{ inventoryReport.alertas_stock_critico.length }} variantes requieren reposición
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-rose-50 text-rose-700 font-black uppercase text-[10px]">
              <tr>
                <th class="py-3 px-4 rounded-l-xl">SKU / Código</th>
                <th class="py-3 px-4">Producto</th>
                <th class="py-3 px-4">Categoría</th>
                <th class="py-3 px-4">Talla & Color</th>
                <th class="py-3 px-4 text-center">Stock Actual</th>
                <th class="py-3 px-4 text-center">Stock Mínimo</th>
                <th class="py-3 px-4 text-right rounded-r-xl">Precio Venta</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-rose-100 font-medium">
              <tr v-for="item in inventoryReport.alertas_stock_critico" :key="item.variante_id" class="hover:bg-rose-50/40 transition">
                <td class="py-3 px-4 font-mono font-bold text-slate-700">
                  {{ item.sku }}
                </td>
                <td class="py-3 px-4 font-bold text-slate-900">
                  {{ item.producto_nombre }}
                </td>
                <td class="py-3 px-4 text-slate-500">
                  {{ item.categoria_nombre }}
                </td>
                <td class="py-3 px-4 text-slate-600">
                  {{ item.talla }} / {{ item.color }}
                </td>
                <td class="py-3 px-4 text-center font-black">
                  <span 
                    class="px-2.5 py-0.5 rounded-full text-[11px]"
                    :class="item.stock === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ item.stock === 0 ? 'Agotado (0)' : item.stock }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center font-bold text-slate-500">
                  {{ item.stock_minimo }}
                </td>
                <td class="py-3 px-4 text-right font-black text-slate-900">
                  L. {{ item.precio_venta.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- ========================================================================================= -->
    <!-- PESTAÑA 3: TOP PRODUCTOS MÁS VENDIDOS -->
    <!-- ========================================================================================= -->
    <div v-if="activeTab === 'top_productos'" class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2">
          <span class="text-lg">🏆</span>
          <h3 class="text-sm font-black text-slate-900">Ranking de Productos Más Vendidos</h3>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400 font-bold">Mostrar:</span>
          <select 
            v-model.number="topSellingLimit" 
            @change="loadTopSellingReport"
            class="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option :value="10">Top 10</option>
            <option :value="20">Top 20</option>
            <option :value="50">Top 50</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4 text-center rounded-l-xl w-14">#</th>
              <th class="py-3 px-4">Producto & Descripción</th>
              <th class="py-3 px-4">Categoría</th>
              <th class="py-3 px-4">Variante (Talla / Color)</th>
              <th class="py-3 px-4">SKU</th>
              <th class="py-3 px-4 text-right">Precio Unitario</th>
              <th class="py-3 px-4 text-center">Uds. Vendidas</th>
              <th class="py-3 px-4 text-right rounded-r-xl">Ingreso Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            <tr v-for="(p, index) in topSellingList" :key="p.sku" class="hover:bg-slate-50/70 transition">
              <td class="py-3 px-4 text-center font-black">
                <span 
                  class="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black"
                  :class="index === 0 ? 'bg-amber-100 text-amber-800' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'"
                >
                  {{ index + 1 }}
                </span>
              </td>
              <td class="py-3 px-4 font-bold text-slate-900">
                {{ p.producto_nombre }}
              </td>
              <td class="py-3 px-4 text-slate-500">
                {{ p.categoria_nombre }}
              </td>
              <td class="py-3 px-4 text-slate-600">
                {{ p.talla }} / {{ p.color }}
              </td>
              <td class="py-3 px-4 font-mono text-slate-500">
                {{ p.sku }}
              </td>
              <td class="py-3 px-4 text-right text-slate-600 font-semibold">
                L. {{ p.precio_venta.toFixed(2) }}
              </td>
              <td class="py-3 px-4 text-center">
                <span class="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black text-xs">
                  {{ p.unidades_vendidas }}
                </span>
              </td>
              <td class="py-3 px-4 text-right font-black text-slate-900">
                L. {{ p.ingreso_generado.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </td>
            </tr>
            <tr v-if="!topSellingList.length">
              <td colspan="8" class="py-8 text-center text-slate-400">
                No se encontraron ventas para este período o filtro.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================================================= -->
    <!-- PESTAÑA 4: CLIENTES VIP & LEALTAD -->
    <!-- ========================================================================================= -->
    <div v-if="activeTab === 'clientes'" class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2">
          <span class="text-lg">💎</span>
          <h3 class="text-sm font-black text-slate-900">Top Clientes Frecuentes y Lealtad VIP</h3>
        </div>
        <span class="text-xs text-slate-400 font-bold">
          {{ topCustomersList.length }} clientes destacados
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4 text-center rounded-l-xl w-14">#</th>
              <th class="py-3 px-4">Cliente</th>
              <th class="py-3 px-4">RTN / DNI</th>
              <th class="py-3 px-4">Teléfono</th>
              <th class="py-3 px-4 text-center">Compras</th>
              <th class="py-3 px-4 text-right">Total Facturado</th>
              <th class="py-3 px-4 text-right">Ticket Promedio</th>
              <th class="py-3 px-4 text-center">Puntos VIP</th>
              <th class="py-3 px-4 text-right rounded-r-xl">Última Compra</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            <tr v-for="(c, idx) in topCustomersList" :key="c.cliente_id" class="hover:bg-slate-50/70 transition">
              <td class="py-3 px-4 text-center font-black text-slate-400">
                {{ idx + 1 }}
              </td>
              <td class="py-3 px-4 font-bold text-slate-900">
                {{ c.nombre }}
              </td>
              <td class="py-3 px-4 font-mono text-slate-500">
                {{ c.rtn_dni || 'Consumidor Final' }}
              </td>
              <td class="py-3 px-4 text-slate-600">
                {{ c.telefono || 'Sin teléfono' }}
              </td>
              <td class="py-3 px-4 text-center font-bold text-slate-800">
                {{ c.total_compras }}
              </td>
              <td class="py-3 px-4 text-right font-black text-indigo-700">
                L. {{ c.total_gastado.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </td>
              <td class="py-3 px-4 text-right font-semibold text-slate-600">
                L. {{ c.ticket_promedio.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </td>
              <td class="py-3 px-4 text-center">
                <span class="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-black text-[11px] border border-purple-200">
                  {{ c.puntos_lealtad }} pts
                </span>
              </td>
              <td class="py-3 px-4 text-right text-slate-400">
                {{ c.ultima_compra || 'N/A' }}
              </td>
            </tr>
            <tr v-if="!topCustomersList.length">
              <td colspan="9" class="py-8 text-center text-slate-400">
                No hay compras asociadas a clientes registrados en este período.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========================================================================================= -->
    <!-- PESTAÑA 5: VENTAS Y RENTABILIDAD POR CATEGORÍA -->
    <!-- ========================================================================================= -->
    <div v-if="activeTab === 'categorias'" class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2">
          <span class="text-lg">🏷️</span>
          <h3 class="text-sm font-black text-slate-900">Ventas, Costos y Margen Bruto por Categoría</h3>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4 rounded-l-xl">Categoría</th>
              <th class="py-3 px-4 text-center">Transacciones</th>
              <th class="py-3 px-4 text-center">Uds. Vendidas</th>
              <th class="py-3 px-4 text-right">Ingreso Bruto</th>
              <th class="py-3 px-4 text-right">Costo Mercancía</th>
              <th class="py-3 px-4 text-right">Utilidad Bruta</th>
              <th class="py-3 px-4 text-center">Margen %</th>
              <th class="py-3 px-4 text-right rounded-r-xl">Participación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            <tr v-for="cat in categoriesReportList" :key="cat.categoria_id" class="hover:bg-slate-50/70 transition">
              <td class="py-3 px-4 font-bold text-slate-900">
                {{ cat.categoria_nombre }}
              </td>
              <td class="py-3 px-4 text-center text-slate-500">
                {{ cat.transacciones }}
              </td>
              <td class="py-3 px-4 text-center font-bold text-slate-800">
                {{ cat.unidades_vendidas }}
              </td>
              <td class="py-3 px-4 text-right font-black text-slate-900">
                L. {{ cat.ingreso_subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </td>
              <td class="py-3 px-4 text-right text-rose-600 font-semibold">
                -L. {{ cat.costo_mercancia.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </td>
              <td class="py-3 px-4 text-right font-black text-emerald-600">
                L. {{ cat.margen_bruto.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </td>
              <td class="py-3 px-4 text-center">
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                  {{ cat.margen_porcentaje }}%
                </span>
              </td>
              <td class="py-3 px-4 text-right font-bold text-indigo-700">
                {{ cat.participacion_ventas_pct }}%
              </td>
            </tr>
            <tr v-if="!categoriesReportList.length">
              <td colspan="8" class="py-8 text-center text-slate-400">
                No hay ventas categorizadas en este período.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { companyConfig, getFullLogoUrl, fetchCompanyConfig } = useCompanyConfig();
const logoError = ref(false);

watch(() => companyConfig.value?.logo_url, () => {
  logoError.value = false;
});

// Pestañas principales
const reportTabs = [
  { id: 'ventas', label: 'Ventas & Facturación', icon: '📈' },
  { id: 'inventario', label: 'Inventario & Existencias', icon: '👗' },
  { id: 'top_productos', label: 'Top Más Vendidos', icon: '🏆' },
  { id: 'clientes', label: 'Clientes VIP & Fidelidad', icon: '💎' },
  { id: 'categorias', label: 'Ventas por Categoría', icon: '🏷️' }
];

const activeTab = ref('ventas');

// Períodos de filtro
const periodOptions = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Esta Semana', value: 'semana' },
  { label: 'Este Mes', value: 'mes' },
  { label: 'Mes Anterior', value: 'mes_anterior' },
  { label: 'Este Año', value: 'anio' },
  { label: 'Personalizado', value: 'personalizado' }
];

const selectedPeriod = ref('mes');
const customStartDate = ref('');
const customEndDate = ref('');

// Filtros específicos
const filterCashierId = ref('');
const filterPaymentMethod = ref('');
const filterCategoryId = ref('');
const topSellingLimit = ref(20);

// Estado de carga y datos
const isLoading = ref(false);
const salesReport = ref(null);
const inventoryReport = ref(null);
const topSellingList = ref([]);
const topCustomersList = ref([]);
const categoriesReportList = ref([]);
const cashiersList = ref([]);
const categoriesList = ref([]);

const selectTab = (tabId) => {
  activeTab.value = tabId;
  loadActiveReportData();
};

const setPeriod = (period) => {
  selectedPeriod.value = period;
  if (period !== 'personalizado') {
    loadActiveReportData();
  }
};

// Carga centralizada según la pestaña activa
const loadActiveReportData = () => {
  switch (activeTab.value) {
    case 'ventas':
      loadSalesReport();
      break;
    case 'inventario':
      loadInventoryReport();
      break;
    case 'top_productos':
      loadTopSellingReport();
      break;
    case 'clientes':
      loadTopCustomersReport();
      break;
    case 'categorias':
      loadCategoriesReport();
      break;
  }
};

// 1. Cargar Reporte de Ventas
const loadSalesReport = async () => {
  try {
    isLoading.value = true;
    let url = `/reportes/ventas?periodo=${selectedPeriod.value}`;
    if (selectedPeriod.value === 'personalizado' && customStartDate.value && customEndDate.value) {
      url += `&fecha_inicio=${customStartDate.value}&fecha_fin=${customEndDate.value}`;
    }
    if (filterCashierId.value) {
      url += `&usuario_id=${filterCashierId.value}`;
    }
    if (filterPaymentMethod.value) {
      url += `&metodo_pago=${filterPaymentMethod.value}`;
    }
    const res = await apiFetch(url);
    if (res && res.success) {
      salesReport.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar reporte de ventas:', err);
  } finally {
    isLoading.value = false;
  }
};

// 2. Cargar Reporte de Inventario
const loadInventoryReport = async () => {
  try {
    isLoading.value = true;
    const res = await apiFetch('/reportes/inventario');
    if (res && res.success) {
      inventoryReport.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar reporte de inventario:', err);
  } finally {
    isLoading.value = false;
  }
};

// 3. Cargar Top Productos Más Vendidos
const loadTopSellingReport = async () => {
  try {
    isLoading.value = true;
    let url = `/reportes/top-vendidos?limite=${topSellingLimit.value}`;
    if (selectedPeriod.value === 'personalizado' && customStartDate.value && customEndDate.value) {
      url += `&fecha_inicio=${customStartDate.value}&fecha_fin=${customEndDate.value}`;
    }
    if (filterCategoryId.value) {
      url += `&categoria_id=${filterCategoryId.value}`;
    }
    const res = await apiFetch(url);
    if (res && res.success) {
      topSellingList.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar top productos:', err);
  } finally {
    isLoading.value = false;
  }
};

// 4. Cargar Reporte de Clientes VIP
const loadTopCustomersReport = async () => {
  try {
    isLoading.value = true;
    let url = `/reportes/clientes?limite=30`;
    if (selectedPeriod.value === 'personalizado' && customStartDate.value && customEndDate.value) {
      url += `&fecha_inicio=${customStartDate.value}&fecha_fin=${customEndDate.value}`;
    }
    const res = await apiFetch(url);
    if (res && res.success) {
      topCustomersList.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar reporte de clientes:', err);
  } finally {
    isLoading.value = false;
  }
};

// 5. Cargar Reporte de Ventas por Categoría
const loadCategoriesReport = async () => {
  try {
    isLoading.value = true;
    let url = `/reportes/categorias`;
    if (selectedPeriod.value === 'personalizado' && customStartDate.value && customEndDate.value) {
      url += `?fecha_inicio=${customStartDate.value}&fecha_fin=${customEndDate.value}`;
    }
    const res = await apiFetch(url);
    if (res && res.success) {
      categoriesReportList.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar reporte por categorías:', err);
  } finally {
    isLoading.value = false;
  }
};

// Cargar Catálogos Auxiliares (Cajeros y Categorías)
const loadAuxiliaryData = async () => {
  try {
    const [usersRes, catRes] = await Promise.all([
      apiFetch('/usuarios'),
      apiFetch('/categorias')
    ]);
    if (usersRes && usersRes.success) {
      cashiersList.value = usersRes.data || [];
    }
    if (catRes && catRes.success) {
      categoriesList.value = catRes.data || [];
    }
  } catch (err) {
    console.error('Error al cargar datos auxiliares para reportes:', err);
  }
};

// Imprimir Reporte en PDF / Impresora
const printReport = () => {
  window.print();
};

// Exportar datos a CSV según la pestaña activa
const exportActiveTabCsv = () => {
  let filename = '';
  let csvContent = '';

  if (activeTab.value === 'ventas') {
    filename = `reporte_ventas_opalo_${selectedPeriod.value}.csv`;
    csvContent = 'Fecha,Transacciones,Subtotal (L.),ISV (L.),Total Facturado (L.)\n';
    (salesReport.value?.ventas_por_dia || []).forEach(d => {
      csvContent += `"${d.fecha}","${d.total_ventas}","${d.subtotal.toFixed(2)}","${d.isv.toFixed(2)}","${d.total.toFixed(2)}"\n`;
    });
  } else if (activeTab.value === 'inventario') {
    filename = 'reporte_inventario_por_categoria_opalo.csv';
    csvContent = 'Categoria,Total Productos,Total Variantes,Unidades en Stock,Valor Costo (L.),Valor Venta (L.),Ganancia Estimada (L.),Participacion (%)\n';
    (inventoryReport.value?.inventario_por_categoria || []).forEach(c => {
      csvContent += `"${c.categoria_nombre}","${c.total_productos}","${c.total_variantes}","${c.stock_unidades}","${c.valor_costo.toFixed(2)}","${c.valor_venta.toFixed(2)}","${c.ganancia_potencial.toFixed(2)}","${c.porcentaje_stock}%"\n`;
    });
  } else if (activeTab.value === 'top_productos') {
    filename = 'reporte_top_productos_mas_vendidos.csv';
    csvContent = 'Posicion,Producto,Categoria,Talla,Color,SKU,Precio Unitario (L.),Unidades Vendidas,Ingreso Total (L.)\n';
    (topSellingList.value || []).forEach((p, idx) => {
      csvContent += `"${idx + 1}","${p.producto_nombre}","${p.categoria_nombre}","${p.talla}","${p.color}","${p.sku}","${p.precio_venta.toFixed(2)}","${p.unidades_vendidas}","${p.ingreso_generado.toFixed(2)}"\n`;
    });
  } else if (activeTab.value === 'clientes') {
    filename = 'reporte_clientes_vip_lealtad.csv';
    csvContent = 'Posicion,Cliente,RTN/DNI,Telefono,Compras Realizadas,Total Gastado (L.),Ticket Promedio (L.),Puntos VIP,Ultima Compra\n';
    (topCustomersList.value || []).forEach((c, idx) => {
      csvContent += `"${idx + 1}","${c.nombre}","${c.rtn_dni || ''}","${c.telefono || ''}","${c.total_compras}","${c.total_gastado.toFixed(2)}","${c.ticket_promedio.toFixed(2)}","${c.puntos_lealtad}","${c.ultima_compra || ''}"\n`;
    });
  } else if (activeTab.value === 'categorias') {
    filename = 'reporte_ventas_por_categoria.csv';
    csvContent = 'Categoria,Transacciones,Unidades Vendidas,Ingreso Subtotal (L.),Costo Mercancia (L.),Margen Bruto (L.),Margen (%),Participacion (%)\n';
    (categoriesReportList.value || []).forEach(c => {
      csvContent += `"${c.categoria_nombre}","${c.transacciones}","${c.unidades_vendidas}","${c.ingreso_subtotal.toFixed(2)}","${c.costo_mercancia.toFixed(2)}","${c.margen_bruto.toFixed(2)}","${c.margen_porcentaje}%","${c.participacion_ventas_pct}%"\n`;
    });
  }

  if (!csvContent) {
    alert('No hay datos disponibles para exportar en esta pestaña.');
    return;
  }

  // BOM para compatibilidad con Microsoft Excel en español (acentos y ñ)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  fetchCompanyConfig();
  loadActiveReportData();
  loadAuxiliaryData();
});
</script>

<style scoped>
@media print {
  /* Ocultar elementos de navegación y botones al imprimir */
  header, nav, button, select, input {
    display: none !important;
  }
  body, .p-6 {
    padding: 0 !important;
    background: white !important;
  }
  .shadow-xs, .shadow-md, .shadow-2xs {
    box-shadow: none !important;
  }
}
</style>
