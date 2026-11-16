<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">

    <!-- Cabecera de Página & Selector de Período -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
      <div>
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-md shadow-emerald-200 shrink-0">
            💰
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Módulo de Finanzas & Flujo de Caja</h1>
            <p class="text-xs text-slate-500 font-medium">
              Control de ingresos, gastos operativos, cuentas por pagar a proveedores y estado de resultados (P&L)
            </p>
          </div>
        </div>
      </div>

      <!-- Filtros de Período y Botones de Acción -->
      <div class="flex flex-wrap items-center gap-2">
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

        <!-- Rango de fecha si es personalizado -->
        <div v-if="selectedPeriod === 'personalizado'" class="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
          <input v-model="customStartDate" type="date" class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs" />
          <span class="text-slate-400">a</span>
          <input v-model="customEndDate" type="date" class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs" />
          <button @click="loadFinanceData" class="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer">
            Filtrar
          </button>
        </div>

        <!-- Botón Exportar CSV -->
        <button
          @click="exportFinanceReport"
          title="Descargar informe en CSV"
          class="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <span>📥</span>
          <span>Exportar</span>
        </button>

        <!-- Botón Registrar Gasto -->
        <button
          @click="openNewExpenseModal"
          class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span>
          <span>Registrar Gasto</span>
        </button>
      </div>
    </div>

    <!-- TARJETAS DE KPIS FINANCIEROS (4 METRICS) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- 1. Ingresos Netos -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-[10px] font-extrabold uppercase tracking-wider">Ingresos Netos</span>
          <span class="text-lg">📈</span>
        </div>
        <p class="text-2xl font-black text-slate-900">
          L. {{ summary?.kpis?.ingresos_netos?.toFixed(2) || '0.00' }}
        </p>
        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Facturado: L. {{ summary?.kpis?.ingresos_brutos?.toFixed(2) || '0.00' }}</span>
          <span class="text-rose-500 font-semibold">-Dev: L. {{ summary?.kpis?.total_devoluciones?.toFixed(2) || '0.00' }}</span>
        </div>
      </div>

      <!-- 2. Gastos Operativos -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-[10px] font-extrabold uppercase tracking-wider">Gastos Operativos</span>
          <span class="text-lg">📉</span>
        </div>
        <p class="text-2xl font-black text-rose-600">
          L. {{ summary?.kpis?.gastos_operativos?.toFixed(2) || '0.00' }}
        </p>
        <p class="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
          Alquiler, nómina, servicios y compras operativas
        </p>
      </div>

      <!-- 3. Utilidad Neta Real -->
      <div 
        class="p-5 rounded-3xl border shadow-xs space-y-2"
        :class="(summary?.kpis?.utilidad_neta || 0) >= 0 ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-200' : 'bg-gradient-to-br from-rose-500/10 to-pink-500/5 border-rose-200'"
      >
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-wider" :class="(summary?.kpis?.utilidad_neta || 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'">
            Utilidad Neta (P&L)
          </span>
          <span class="text-lg">💎</span>
        </div>
        <p class="text-2xl font-black" :class="(summary?.kpis?.utilidad_neta || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'">
          L. {{ summary?.kpis?.utilidad_neta?.toFixed(2) || '0.00' }}
        </p>
        <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
          <span class="font-bold text-slate-600">Margen Neto:</span>
          <span 
            class="px-2 py-0.5 rounded-full text-[10px] font-black"
            :class="(summary?.kpis?.utilidad_neta || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
          >
            {{ summary?.kpis?.margen_neto_pct || '0.0' }}%
          </span>
        </div>
      </div>

      <!-- 4. Cuentas por Pagar (Proveedores) -->
      <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-[10px] font-extrabold uppercase tracking-wider">Cuentas por Pagar</span>
          <span class="text-lg">💳</span>
        </div>
        <p class="text-2xl font-black text-purple-700">
          L. {{ summary?.cuentas_por_pagar_resumen?.saldo_pendiente?.toFixed(2) || '0.00' }}
        </p>
        <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
          <span class="text-slate-500">{{ summary?.cuentas_por_pagar_resumen?.total_cuentas || 0 }} facturas activas</span>
          <span v-if="(summary?.cuentas_por_pagar_resumen?.saldo_vencido || 0) > 0" class="text-rose-600 font-bold">
            Vencido: L. {{ summary?.cuentas_por_pagar_resumen?.saldo_vencido?.toFixed(2) }}
          </span>
          <span v-else class="text-emerald-600 font-bold">Al día ✓</span>
        </div>
      </div>

    </div>

    <!-- ESTADO DE RESULTADOS (P&L) SIMPLIFICADO -->
    <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">📊</span>
          <h2 class="text-base font-black text-slate-900">Estado de Resultados (Pérdidas y Ganancias)</h2>
        </div>
        <span class="text-xs text-slate-500 font-medium">
          Período: <strong>{{ summary?.periodo?.fecha_inicio }}</strong> a <strong>{{ summary?.periodo?.fecha_fin }}</strong>
        </span>
      </div>

      <!-- Tabla Contable del P&L -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
        <!-- 1. Ingresos Netos -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
          <p class="text-[10px] uppercase font-bold text-slate-400">1. Ingresos por Ventas</p>
          <p class="text-lg font-black text-slate-900 mt-1">
            L. {{ summary?.estado_resultados?.ingresos_netos?.toFixed(2) || '0.00' }}
          </p>
          <p class="text-[10px] text-slate-400">Base gravable neta</p>
        </div>

        <!-- 2. Costo de Ventas (COGS) -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
          <p class="text-[10px] uppercase font-bold text-slate-400">2. (-) Costo de Mercancía</p>
          <p class="text-lg font-black text-rose-600 mt-1">
            -L. {{ summary?.estado_resultados?.costo_mercancia_vendida?.toFixed(2) || '0.00' }}
          </p>
          <p class="text-[10px] text-slate-400">Costo compra proveedores</p>
        </div>

        <!-- 3. Utilidad Bruta -->
        <div class="p-3.5 bg-purple-50/40 rounded-2xl border border-purple-200/80">
          <p class="text-[10px] uppercase font-bold text-purple-700">3. (=) Utilidad Bruta</p>
          <p class="text-lg font-black text-purple-900 mt-1">
            L. {{ summary?.estado_resultados?.utilidad_bruta?.toFixed(2) || '0.00' }}
          </p>
          <p class="text-[10px] font-bold text-purple-600">Margen: {{ summary?.estado_resultados?.margen_bruto_porcentaje || '0' }}%</p>
        </div>

        <!-- 4. Gastos Operativos -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
          <p class="text-[10px] uppercase font-bold text-slate-400">4. (-) Gastos Operativos</p>
          <p class="text-lg font-black text-rose-600 mt-1">
            -L. {{ summary?.estado_resultados?.gastos_operativos?.toFixed(2) || '0.00' }}
          </p>
          <p class="text-[10px] text-slate-400">Alquiler, sueldos, servicios</p>
        </div>

        <!-- 5. Utilidad Neta Final -->
        <div 
          class="p-3.5 rounded-2xl border"
          :class="(summary?.estado_resultados?.utilidad_neta || 0) >= 0 ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'"
        >
          <p class="text-[10px] uppercase font-black" :class="(summary?.estado_resultados?.utilidad_neta || 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'">
            5. (=) Utilidad Neta Real
          </p>
          <p class="text-lg font-black mt-1" :class="(summary?.estado_resultados?.utilidad_neta || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'">
            L. {{ summary?.estado_resultados?.utilidad_neta?.toFixed(2) || '0.00' }}
          </p>
          <p class="text-[10px] font-bold" :class="(summary?.estado_resultados?.utilidad_neta || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            Rentabilidad: {{ summary?.estado_resultados?.margen_neto_porcentaje || '0' }}%
          </p>
        </div>
      </div>
    </div>

    <!-- 🎯 SIMULADOR Y PROYECCIÓN FINANCIERA: META DE VENTAS Y UTILIDAD DESEADA (PUNTO DE EQUILIBRIO) -->
    <div class="bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
      
      <!-- Cabecera de la Sección -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div class="space-y-1">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-200">
              🎯
            </div>
            <div>
              <h2 class="text-base font-black text-slate-900 tracking-tight">
                Meta de Ventas & Proyección de Utilidad (Punto de Equilibrio)
              </h2>
              <p class="text-xs text-slate-500 font-medium">
                Calculadora financiera para saber exactamente cuánto dinero debes vender para cubrir todos tus costos operativos y lograr la ganancia deseada.
              </p>
            </div>
          </div>
        </div>

        <!-- Selector / Input de Meta de Ganancia Deseada -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <label class="text-xs font-black text-slate-700 whitespace-nowrap flex items-center gap-1.5">
            <span>💵</span>
            <span>Meta de Utilidad Deseada:</span>
          </label>
          <div class="relative w-44">
            <span class="absolute left-3 top-2 text-xs font-black text-slate-400">L.</span>
            <input
              type="number"
              v-model.number="metaUtilidadDeseada"
              @input="onMetaUtilidadChange"
              min="0"
              step="1000"
              class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Ej. 25000"
            />
          </div>
          <div class="flex items-center gap-1">
            <button
              v-for="preset in [10000, 20000, 30000, 50000]"
              :key="preset"
              @click="setMetaPreset(preset)"
              class="px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer"
              :class="metaUtilidadDeseada === preset ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'"
            >
              {{ preset >= 1000 ? (preset / 1000) + 'k' : preset }}
            </button>
          </div>
        </div>
      </div>

      <!-- Control Slider Rápido para Ajuste Interactivo -->
      <div class="bg-white/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
        <div class="flex items-center gap-2 text-xs font-bold text-slate-600 whitespace-nowrap">
          <span>🎚️ Ajuste Rápido:</span>
          <span class="text-indigo-600 font-black">L. {{ Number(metaUtilidadDeseada || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="150000"
          step="2500"
          v-model.number="metaUtilidadDeseada"
          @input="onMetaUtilidadChange"
          class="w-full accent-indigo-600 cursor-pointer"
        />
        <div class="flex justify-between w-full sm:w-auto text-[10px] text-slate-400 font-bold whitespace-nowrap">
          <span>L. 0k</span>
          <span class="mx-2">a</span>
          <span>L. 150k</span>
        </div>
      </div>

      <!-- 3 TARJETAS RESUMEN DE LA META -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Tarjeta 1: META DE VENTAS REQUERIDA -->
        <div class="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs space-y-3 relative overflow-hidden">
          <div class="absolute -right-4 -bottom-4 text-indigo-50 text-7xl font-black select-none pointer-events-none">
            🎯
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Meta de Facturación Total
            </span>
            <span class="text-xs text-slate-400 font-medium">{{ proyeccionCalculada.dias_periodo }} días</span>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-bold">Tienes que vender en total:</p>
            <p class="text-2xl lg:text-3xl font-black text-indigo-600 mt-0.5">
              L. {{ proyeccionCalculada.meta_ventas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </p>
          </div>
          <div class="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100/80 space-y-1 text-xs">
            <div class="flex items-center justify-between font-bold text-slate-700">
              <span>Meta diaria requerida:</span>
              <span class="text-indigo-700 font-black">L. {{ proyeccionCalculada.meta_ventas_diaria.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} / día</span>
            </div>
            <p class="text-[10px] text-slate-500">
              Para cubrir L. {{ proyeccionCalculada.gastos_operativos.toFixed(2) }} de gastos + generar L. {{ proyeccionCalculada.meta_utilidad.toFixed(2) }} de ganancia limpia.
            </p>
          </div>
        </div>

        <!-- Tarjeta 2: PUNTO DE EQUILIBRIO -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Punto de Equilibrio (Sin Pérdidas)
            </span>
            <span 
              class="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1"
              :class="proyeccionCalculada.punto_equilibrio_superado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
            >
              <span>{{ proyeccionCalculada.punto_equilibrio_superado ? '✓ Superado' : '⏳ En proceso' }}</span>
            </span>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-bold">Mínimo para cubrir el 100% de gastos:</p>
            <p class="text-2xl lg:text-3xl font-black text-slate-900 mt-0.5">
              L. {{ proyeccionCalculada.punto_equilibrio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </p>
          </div>
          <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
            <div class="flex items-center justify-between font-bold text-slate-700">
              <span>Venta diaria de equilibrio:</span>
              <span class="text-slate-900 font-black">L. {{ proyeccionCalculada.punto_equilibrio_diario.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} / día</span>
            </div>
            <p class="text-[10px]" :class="proyeccionCalculada.punto_equilibrio_superado ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'">
              {{ proyeccionCalculada.punto_equilibrio_superado 
                ? '¡Ya cubriste todos los gastos del período! Cada nueva venta aporta ganancia neta.' 
                : `Faltan L. ${proyeccionCalculada.ventas_faltantes_equilibrio.toLocaleString('en-US', { minimumFractionDigits: 2 })} en ventas para salir de tablas.` 
              }}
            </p>
          </div>
        </div>

        <!-- Tarjeta 3: PROGRESO Y VENTAS FALTANTES -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
              Progreso Hacia la Meta
            </span>
            <span 
              class="px-2 py-0.5 rounded-full text-[10px] font-black"
              :class="proyeccionCalculada.meta_alcanzada ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'"
            >
              {{ proyeccionCalculada.progreso_meta_pct }}%
            </span>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-bold">Ventas Faltantes para la Meta:</p>
            <p class="text-2xl lg:text-3xl font-black mt-0.5" :class="proyeccionCalculada.meta_alcanzada ? 'text-emerald-600' : 'text-slate-900'">
              {{ proyeccionCalculada.meta_alcanzada ? '¡Meta Lograda! 🎉' : 'L. ' + proyeccionCalculada.ventas_faltantes_meta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </p>
          </div>
          <div class="p-2.5 bg-teal-50/40 rounded-xl border border-teal-100 space-y-1 text-xs">
            <div class="flex items-center justify-between font-bold text-slate-700">
              <span>Vendido hasta hoy:</span>
              <span class="text-teal-800 font-black">L. {{ proyeccionCalculada.ventas_actuales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
            </div>
            <p class="text-[10px] text-slate-500">
              Utilidad neta acumulada en período: 
              <strong :class="proyeccionCalculada.utilidad_actual >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                L. {{ proyeccionCalculada.utilidad_actual.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </strong>
            </p>
          </div>
        </div>

      </div>

      <!-- BARRA DE PROGRESO CON HITOS Y DESGLOSE ANALÍTICO -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-black text-slate-900">Avance de Ventas en el Período</span>
            <span class="text-slate-400">|</span>
            <span class="text-slate-600 font-medium">
              Vendido: <strong>L. {{ proyeccionCalculada.ventas_actuales.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</strong> de <strong>L. {{ proyeccionCalculada.meta_ventas.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</strong>
            </span>
          </div>
          <div class="flex items-center gap-4 text-[11px] font-bold">
            <span class="flex items-center gap-1.5 text-slate-600">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span>Punto de Equilibrio: L. {{ proyeccionCalculada.punto_equilibrio.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
            </span>
            <span class="flex items-center gap-1.5 text-indigo-700">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>Meta Ganancia: L. {{ proyeccionCalculada.meta_ventas.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
            </span>
          </div>
        </div>

        <!-- Barra Visual -->
        <div class="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 via-indigo-500 to-indigo-600 shadow-xs"
            :style="{ width: `${Math.min(100, proyeccionCalculada.progreso_meta_pct)}%` }"
          ></div>
        </div>

        <!-- Fórmulas y Explicación Contable Clara -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          <div class="flex items-start gap-2">
            <span class="text-base leading-none">💡</span>
            <div>
              <p class="font-bold text-slate-800">¿Cómo se calcula la Meta de Ventas?</p>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Fórmula: <code>(Gastos Fijos + Utilidad Deseada) ÷ Margen de Contribución</code>.<br />
                (L. {{ proyeccionCalculada.gastos_operativos.toFixed(2) }} + L. {{ proyeccionCalculada.meta_utilidad.toFixed(2) }}) ÷ {{ proyeccionCalculada.margen_pct }}% = 
                <strong class="text-indigo-700">L. {{ proyeccionCalculada.meta_ventas.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</strong>
              </p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-base leading-none">⚖️</span>
            <div>
              <p class="font-bold text-slate-800">Margen de Contribución del Negocio</p>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Tu margen bruto promedio actual es de <strong class="text-emerald-700">{{ proyeccionCalculada.margen_pct }}%</strong>. Esto significa que por cada L. 100 vendidos, aprox. <strong>L. {{ proyeccionCalculada.margen_pct.toFixed(2) }}</strong> quedan disponibles para cubrir costos fijos y generar utilidades.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- PESTAÑAS DE NAVEGACIÓN INFERIORES -->
    <div class="flex items-center justify-between border-b border-slate-200 pb-2">
      <div class="flex space-x-2">
        <button
          @click="activeSubTab = 'gastos'"
          class="px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer"
          :class="activeSubTab === 'gastos' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <span>📋</span>
          <span>Control de Gastos y Egresos</span>
          <span class="px-2 py-0.5 text-[10px] rounded-full" :class="activeSubTab === 'gastos' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'">
            {{ expensesList.length }}
          </span>
        </button>

        <button
          @click="activeSubTab = 'cuentas_pagar'"
          class="px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer"
          :class="activeSubTab === 'cuentas_pagar' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <span>💳</span>
          <span>Cuentas por Pagar (Proveedores)</span>
          <span class="px-2 py-0.5 text-[10px] rounded-full" :class="activeSubTab === 'cuentas_pagar' ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-700 font-bold'">
            {{ accountsPayableList.length }}
          </span>
        </button>

        <button
          @click="activeSubTab = 'desglose_categorias'"
          class="px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer"
          :class="activeSubTab === 'desglose_categorias' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'"
        >
          <span>📊</span>
          <span>Desglose por Categoría</span>
        </button>
      </div>

      <!-- Buscador Rápido -->
      <div class="w-64">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar descripción o comprobante..."
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>

    <!-- SUB-TAB 1: TABLA DE GASTOS Y EGRESOS -->
    <div v-if="activeSubTab === 'gastos'" class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
      <div class="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <!-- Filtro Categoría -->
          <select 
            v-model="filterExpenseCategory"
            class="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            <option v-for="c in expenseCategories" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>

        <button
          @click="openNewExpenseModal"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
        >
          <span>➕</span>
          <span>Nuevo Gasto</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <th class="py-3 px-4">Fecha</th>
              <th class="py-3 px-4">Categoría</th>
              <th class="py-3 px-4">Descripción del Gasto</th>
              <th class="py-3 px-4">Proveedor / Beneficiario</th>
              <th class="py-3 px-4">Método de Pago</th>
              <th class="py-3 px-4">Comprobante</th>
              <th class="py-3 px-4 text-right">Monto</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredExpenses.length === 0" class="text-center py-8">
              <td colspan="8" class="py-8 text-slate-400 font-semibold">
                No hay gastos registrados para los filtros seleccionados
              </td>
            </tr>
            <tr v-for="g in filteredExpenses" :key="g.id" class="hover:bg-slate-50/70 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-600">{{ g.fecha_gasto }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full font-bold text-[10px] border" :class="getCategoryBadgeClass(g.categoria)">
                  {{ formatCategoryLabel(g.categoria) }}
                </span>
              </td>
              <td class="py-3 px-4">
                <p class="font-bold text-slate-900">{{ g.descripcion }}</p>
                <p v-if="g.notas" class="text-[10px] text-slate-400 truncate max-w-xs">{{ g.notas }}</p>
              </td>
              <td class="py-3 px-4 text-slate-600 font-medium">
                {{ g.proveedor_nombre || 'N/A' }}
              </td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-700">
                  {{ g.metodo_pago }} {{ g.banco_origen ? `(${g.banco_origen})` : '' }}
                </span>
              </td>
              <td class="py-3 px-4 font-mono text-slate-500 text-[11px]">
                {{ g.numero_comprobante || 'Sin comprobante' }}
              </td>
              <td class="py-3 px-4 text-right font-black text-rose-600 text-sm">
                -L. {{ parseFloat(g.monto).toFixed(2) }}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button 
                    @click="openEditExpenseModal(g)" 
                    title="Editar Gasto"
                    class="p-1 text-slate-400 hover:text-slate-800 transition cursor-pointer"
                  >
                    ✏️
                  </button>
                  <button 
                    @click="deleteExpenseItem(g)" 
                    title="Eliminar Gasto"
                    class="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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

    <!-- SUB-TAB 2: TABLA DE CUENTAS POR PAGAR (PROVEEDORES) -->
    <div v-if="activeSubTab === 'cuentas_pagar'" class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
      <div class="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 class="text-xs font-black uppercase text-slate-800">Cuentas por Pagar & Créditos de Proveedores</h3>
          <p class="text-[11px] text-slate-500">Registra y amortiza facturas a crédito con proveedores de ropa y accesorios</p>
        </div>

        <button
          @click="openNewAccountPayableModal"
          class="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span>
          <span>Nueva Factura por Pagar</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <th class="py-3 px-4">Proveedor</th>
              <th class="py-3 px-4">N° Factura</th>
              <th class="py-3 px-4">Descripción</th>
              <th class="py-3 px-4">Emisión / Vencimiento</th>
              <th class="py-3 px-4 text-right">Monto Total</th>
              <th class="py-3 px-4 text-right">Pagado</th>
              <th class="py-3 px-4 text-right">Saldo Pendiente</th>
              <th class="py-3 px-4 text-center">Estado</th>
              <th class="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="accountsPayableList.length === 0" class="text-center py-8">
              <td colspan="9" class="py-8 text-slate-400 font-semibold">
                No hay cuentas por pagar registradas
              </td>
            </tr>
            <tr v-for="cxp in accountsPayableList" :key="cxp.id" class="hover:bg-slate-50/70 transition">
              <td class="py-3 px-4">
                <p class="font-bold text-slate-900">{{ cxp.proveedor_nombre }}</p>
                <p class="text-[10px] text-slate-400">{{ cxp.proveedor_banco }} • {{ cxp.proveedor_cuenta }}</p>
              </td>
              <td class="py-3 px-4 font-mono font-bold text-purple-800">{{ cxp.numero_factura_proveedor }}</td>
              <td class="py-3 px-4 text-slate-600">{{ cxp.descripcion }}</td>
              <td class="py-3 px-4 text-slate-500">
                <p>Emi: {{ cxp.fecha_emision }}</p>
                <p class="font-bold" :class="isPastDue(cxp.fecha_vencimiento) && cxp.estado !== 'PAGADO' ? 'text-rose-600' : 'text-slate-700'">
                  Vence: {{ cxp.fecha_vencimiento }}
                </p>
              </td>
              <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">
                L. {{ parseFloat(cxp.monto_total).toFixed(2) }}
              </td>
              <td class="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                L. {{ parseFloat(cxp.monto_pagado).toFixed(2) }}
              </td>
              <td class="py-3 px-4 text-right font-mono text-rose-600 font-black text-sm">
                L. {{ parseFloat(cxp.saldo_pendiente).toFixed(2) }}
              </td>
              <td class="py-3 px-4 text-center">
                <span 
                  class="px-2 py-0.5 rounded-full font-bold text-[10px] border"
                  :class="getCxpStatusBadgeClass(cxp.estado, cxp.fecha_vencimiento)"
                >
                  {{ formatCxpStatus(cxp.estado, cxp.fecha_vencimiento) }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  v-if="cxp.estado !== 'PAGADO'"
                  @click="openPaymentModal(cxp)"
                  class="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition cursor-pointer border border-purple-200"
                >
                  💳 Abonar
                </button>
                <span v-else class="text-xs text-emerald-600 font-bold">Liquidado ✓</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SUB-TAB 3: DESGLOSE VISUAL POR CATEGORÍAS DE GASTOS -->
    <div v-if="activeSubTab === 'desglose_categorias'" class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div class="border-b border-slate-100 pb-3">
        <h3 class="text-sm font-black text-slate-900">Distribución de Gastos Operativos</h3>
        <p class="text-xs text-slate-400">Porcentaje de egresos por tipo de rubro en el período seleccionado</p>
      </div>

      <div v-if="!summary?.gastos_por_categoria?.length" class="text-center py-10 text-slate-400">
        Sin gastos registrados en este período
      </div>

      <div v-else class="space-y-4 max-w-2xl">
        <div v-for="cat in summary.gastos_por_categoria" :key="cat.categoria" class="space-y-1">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-slate-800">{{ formatCategoryLabel(cat.categoria) }} ({{ cat.cantidad }})</span>
            <span class="font-mono font-black text-slate-900">
              L. {{ cat.total.toFixed(2) }} <span class="text-slate-400 font-normal">({{ cat.porcentaje }}%)</span>
            </span>
          </div>
          <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500"
              :class="getCategoryBarColor(cat.categoria)"
              :style="{ width: `${cat.porcentaje}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: REGISTRAR O EDITAR GASTO                                      -->
    <!-- ===================================================================== -->
    <div v-if="isExpenseModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4">
        
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2.5">
            <span class="text-xl">🧾</span>
            <h2 class="text-base font-black text-slate-900">
              {{ editingExpenseId ? 'Editar Gasto Financiero' : 'Registrar Nuevo Gasto / Egreso' }}
            </h2>
          </div>
          <button @click="isExpenseModalOpen = false" class="text-slate-400 hover:text-slate-700 font-bold text-lg p-1">
            ✕
          </button>
        </div>

        <form @submit.prevent="saveExpense" class="space-y-3.5">
          <!-- Categoría -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Categoría del Gasto *</label>
            <select
              v-model="expenseForm.categoria"
              required
              class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option v-for="c in expenseCategories" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>

          <!-- Descripción -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Descripción del Gasto *</label>
            <input
              v-model="expenseForm.descripcion"
              type="text"
              required
              placeholder="Ej: Pago de alquiler del local Noviembre 2026"
              class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <!-- Monto y Fecha -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Monto (L.) *</label>
              <input
                v-model.number="expenseForm.monto"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="1500.00"
                class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Fecha del Gasto *</label>
              <input
                v-model="expenseForm.fecha_gasto"
                type="date"
                required
                class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <!-- Método de Pago y Banco -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Método de Pago</label>
              <select
                v-model="expenseForm.metodo_pago"
                class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="EFECTIVO">Efectivo (Caja)</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="TARJETA">Tarjeta de Débito/Crédito</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Banco / Cuenta Origen</label>
              <input
                v-model="expenseForm.banco_origen"
                type="text"
                placeholder="BAC, Atlántida, Ficohsa"
                class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <!-- N° Comprobante y Proveedor Opcional -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">N° Comprobante / Recibo</label>
              <input
                v-model="expenseForm.numero_comprobante"
                type="text"
                placeholder="TR-19284 / REC-019"
                class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Proveedor (Opcional)</label>
              <select
                v-model="expenseForm.proveedor_id"
                class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option :value="null">Sin proveedor</option>
                <option v-for="prov in suppliersList" :key="prov.id" :value="prov.id">{{ prov.nombre_empresa }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Notas / Observaciones</label>
            <input
              v-model="expenseForm.notas"
              type="text"
              placeholder="Detalles adicionales para auditoría"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div class="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              @click="isExpenseModalOpen = false"
              type="button"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmittingExpense"
              class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{{ isSubmittingExpense ? 'Guardando...' : 'Guardar Gasto' }}</span>
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: ABONAR PAGO A CUENTA POR PAGAR                                -->
    <!-- ===================================================================== -->
    <div v-if="isPaymentModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4">
        
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2.5">
            <span class="text-xl">💳</span>
            <div>
              <h2 class="text-base font-black text-slate-900">Abonar a Proveedor</h2>
              <p class="text-xs text-purple-700 font-bold">{{ activeCxpItem?.proveedor_nombre }}</p>
            </div>
          </div>
          <button @click="isPaymentModalOpen = false" class="text-slate-400 hover:text-slate-700 font-bold text-lg p-1">
            ✕
          </button>
        </div>

        <div class="p-3 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-600">Factura Proveedor:</span>
            <span class="font-mono font-bold text-purple-900">{{ activeCxpItem?.numero_factura_proveedor }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Monto Total Factura:</span>
            <span class="font-bold text-slate-800">L. {{ parseFloat(activeCxpItem?.monto_total || 0).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-sm font-black pt-1 border-t border-purple-200/60 text-rose-700">
            <span>Saldo Pendiente Actual:</span>
            <span>L. {{ parseFloat(activeCxpItem?.saldo_pendiente || 0).toFixed(2) }}</span>
          </div>
        </div>

        <form @submit.prevent="submitAbono" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Monto del Abono (L.) *</label>
            <input
              v-model.number="paymentForm.monto_abono"
              type="number"
              step="0.01"
              min="0.01"
              :max="parseFloat(activeCxpItem?.saldo_pendiente || 0)"
              required
              class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black font-mono text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Método de Pago</label>
              <select
                v-model="paymentForm.metodo_pago"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Banco Origen</label>
              <input
                v-model="paymentForm.banco_origen"
                type="text"
                placeholder="BAC / Atlántida"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">N° de Transferencia / Comprobante</label>
            <input
              v-model="paymentForm.numero_comprobante"
              type="text"
              placeholder="TR-2026-98124"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div class="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              @click="isPaymentModalOpen = false"
              type="button"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmittingPayment"
              class="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{{ isSubmittingPayment ? 'Procesando...' : 'Confirmar Abono' }}</span>
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: NUEVA CUENTA POR PAGAR (FACTURA PROVEEDOR)                    -->
    <!-- ===================================================================== -->
    <div v-if="isNewCxpModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4">
        
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2.5">
            <span class="text-xl">💳</span>
            <h2 class="text-base font-black text-slate-900">Registrar Cuenta por Pagar a Proveedor</h2>
          </div>
          <button @click="isNewCxpModalOpen = false" class="text-slate-400 hover:text-slate-700 font-bold text-lg p-1">
            ✕
          </button>
        </div>

        <form @submit.prevent="saveNewCxp" class="space-y-3.5">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Proveedor *</label>
            <select
              v-model="newCxpForm.proveedor_id"
              required
              class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="" disabled>Selecciona un proveedor</option>
              <option v-for="prov in suppliersList" :key="prov.id" :value="prov.id">{{ prov.nombre_empresa }} ({{ prov.ciudad }})</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">N° Factura Proveedor *</label>
              <input
                v-model="newCxpForm.numero_factura_proveedor"
                type="text"
                required
                placeholder="FACT-2026-001"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Monto Total (L.) *</label>
              <input
                v-model.number="newCxpForm.monto_total"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="10000.00"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Descripción del Pedido / Mercadería *</label>
            <input
              v-model="newCxpForm.descripcion"
              type="text"
              required
              placeholder="Ej: Lote de 40 Vestidos y Blusas de Moda"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Fecha Emisión *</label>
              <input
                v-model="newCxpForm.fecha_emision"
                type="date"
                required
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Fecha Vencimiento *</label>
              <input
                v-model="newCxpForm.fecha_vencimiento"
                type="date"
                required
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Notas Adicionales</label>
            <input
              v-model="newCxpForm.notas"
              type="text"
              placeholder="Términos de crédito convenidos"
              class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div class="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              @click="isNewCxpModalOpen = false"
              type="button"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmittingNewCxp"
              class="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{{ isSubmittingNewCxp ? 'Registrando...' : 'Registrar Factura' }}</span>
            </button>
          </div>
        </form>

      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { onEvent } = useSocket();

// Opciones de período
const periodOptions = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Esta Semana', value: 'semana' },
  { label: 'Este Mes', value: 'mes' },
  { label: 'Este Año', value: 'anio' },
  { label: 'Personalizado', value: 'personalizado' }
];

const selectedPeriod = ref('mes');
const customStartDate = ref('');
const customEndDate = ref('');
const activeSubTab = ref('gastos');
const searchQuery = ref('');
const filterExpenseCategory = ref('');

const summary = ref(null);
const expensesList = ref([]);
const accountsPayableList = ref([]);
const suppliersList = ref([]);

// Meta de Utilidad Deseada y Proyecciones Financieras
const metaUtilidadDeseada = ref(25000);

const onMetaUtilidadChange = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('opalo_meta_utilidad', String(metaUtilidadDeseada.value || 0));
  }
};

const setMetaPreset = (preset) => {
  metaUtilidadDeseada.value = preset;
  onMetaUtilidadChange();
};

const proyeccionCalculada = computed(() => {
  const s = summary.value;
  const pm = s?.proyeccion_metas;
  const totalGastos = parseFloat(s?.kpis?.gastos_operativos || 0);
  const ventasActuales = parseFloat(s?.kpis?.ingresos_netos || 0);
  const subtotalNeto = parseFloat(s?.estado_resultados?.ingresos_netos || 0);
  const utilidadBruta = parseFloat(s?.estado_resultados?.utilidad_bruta || 0);

  // Margen de contribución real o estimado
  let margenPct = subtotalNeto > 0 && utilidadBruta > 0 
    ? (utilidadBruta / subtotalNeto) * 100 
    : (pm?.margen_contribucion_pct || 35.0);
  
  if (!margenPct || margenPct <= 0) margenPct = 35.0;
  const margenRatio = Math.max(0.01, margenPct / 100);

  const dias = pm?.dias_periodo || 30;
  const metaUtil = Math.max(0, parseFloat(metaUtilidadDeseada.value) || 0);

  // Punto de Equilibrio
  const puntoEquilibrio = parseFloat((totalGastos / margenRatio).toFixed(2));
  const puntoEquilibrioDiario = parseFloat((puntoEquilibrio / dias).toFixed(2));
  const puntoEquilibrioSuperado = ventasActuales >= puntoEquilibrio;
  const ventasFaltantesEquilibrio = parseFloat(Math.max(0, puntoEquilibrio - ventasActuales).toFixed(2));
  const progresoEquilibrioPct = puntoEquilibrio > 0 
    ? Math.min(100, parseFloat(((ventasActuales / puntoEquilibrio) * 100).toFixed(1)))
    : (ventasActuales > 0 ? 100 : 0);

  // Meta de Ventas para Ganancia Deseada
  const metaVentas = parseFloat(((totalGastos + metaUtil) / margenRatio).toFixed(2));
  const metaVentasDiaria = parseFloat((metaVentas / dias).toFixed(2));
  const metaAlcanzada = ventasActuales >= metaVentas;
  const ventasFaltantesMeta = parseFloat(Math.max(0, metaVentas - ventasActuales).toFixed(2));
  const progresoMetaPct = metaVentas > 0
    ? Math.min(100, parseFloat(((ventasActuales / metaVentas) * 100).toFixed(1)))
    : 0;

  // Ganancia proyectada estimada al ritmo actual
  const utilidadActual = parseFloat(s?.kpis?.utilidad_neta || 0);

  return {
    meta_utilidad: metaUtil,
    margen_pct: parseFloat(margenPct.toFixed(1)),
    dias_periodo: dias,
    gastos_operativos: totalGastos,
    ventas_actuales: ventasActuales,
    utilidad_actual: utilidadActual,
    punto_equilibrio: puntoEquilibrio,
    punto_equilibrio_diario: puntoEquilibrioDiario,
    punto_equilibrio_superado: puntoEquilibrioSuperado,
    ventas_faltantes_equilibrio: ventasFaltantesEquilibrio,
    progreso_equilibrio_pct: progresoEquilibrioPct,
    meta_ventas: metaVentas,
    meta_ventas_diaria: metaVentasDiaria,
    meta_alcanzada: metaAlcanzada,
    ventas_faltantes_meta: ventasFaltantesMeta,
    progreso_meta_pct: progresoMetaPct
  };
});

// Modales
const isExpenseModalOpen = ref(false);
const isPaymentModalOpen = ref(false);
const isNewCxpModalOpen = ref(false);

const isSubmittingExpense = ref(false);
const isSubmittingPayment = ref(false);
const isSubmittingNewCxp = ref(false);

const editingExpenseId = ref(null);
const activeCxpItem = ref(null);

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

// Categorías de Gastos
const expenseCategories = [
  { value: 'ALQUILER', label: '🏢 Alquiler del Local' },
  { value: 'SERVICIOS_PUBLICOS', label: '💡 Servicios Públicos (ENEE, Agua, Net)' },
  { value: 'PAGO_PROVEEDORES', label: '🏭 Pago a Proveedores de Mercadería' },
  { value: 'NOMINA_SALARIOS', label: '👥 Nómina y Sueldos del Personal' },
  { value: 'TRANSPORTE_FLETES', label: '🚚 Transporte y Fletes' },
  { value: 'MARKETING_PUBLICIDAD', label: '📢 Marketing y Publicidad en Redes' },
  { value: 'EMPAQUES_SUMINISTROS', label: '🛍️ Bolsas, Empaques y Papel Seda' },
  { value: 'MANTENIMIENTO', label: '🛠️ Mantenimiento y Reparaciones' },
  { value: 'IMPUESTOS', label: '🏛️ Impuestos y Tasas Municipales' },
  { value: 'OTROS', label: '📦 Otros Egresos Operativos' }
];

// Formulario de Gasto
const expenseForm = reactive({
  categoria: 'OTROS',
  proveedor_id: null,
  descripcion: '',
  monto: 0,
  metodo_pago: 'EFECTIVO',
  banco_origen: '',
  numero_comprobante: '',
  fecha_gasto: getTodayLocalDate(),
  notas: ''
});

// Formulario de Abono a Proveedor
const paymentForm = reactive({
  monto_abono: 0,
  metodo_pago: 'TRANSFERENCIA',
  banco_origen: 'BAC Credomatic',
  numero_comprobante: '',
  notas: ''
});

// Formulario de Nueva Cuenta por Pagar
const newCxpForm = reactive({
  proveedor_id: '',
  numero_factura_proveedor: '',
  descripcion: '',
  monto_total: 0,
  fecha_emision: getTodayLocalDate(),
  fecha_vencimiento: '',
  notas: ''
});

// Cargar Resumen Financiero
const loadFinanceSummary = async () => {
  try {
    let url = `/finanzas/resumen?periodo=${selectedPeriod.value}&meta_utilidad=${metaUtilidadDeseada.value}`;
    if (selectedPeriod.value === 'personalizado' && customStartDate.value && customEndDate.value) {
      url += `&fecha_inicio=${customStartDate.value}&fecha_fin=${customEndDate.value}`;
    }
    const res = await apiFetch(url);
    if (res && res.success) {
      summary.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar resumen financiero:', err);
  }
};

// Cargar Lista de Gastos
const loadExpenses = async () => {
  try {
    let url = `/finanzas/gastos?limit=100`;
    if (filterExpenseCategory.value) {
      url += `&categoria=${filterExpenseCategory.value}`;
    }
    const res = await apiFetch(url);
    if (res && res.success) {
      expensesList.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar gastos:', err);
  }
};

// Cargar Cuentas por Pagar
const loadAccountsPayable = async () => {
  try {
    const res = await apiFetch('/finanzas/cuentas-por-pagar');
    if (res && res.success) {
      accountsPayableList.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar cuentas por pagar:', err);
  }
};

// Cargar Proveedores para selector
const loadSuppliers = async () => {
  try {
    const res = await apiFetch('/proveedores?limit=100');
    if (res && res.success) {
      suppliersList.value = res.data;
    }
  } catch (err) {
    console.error('Error al cargar proveedores:', err);
  }
};

const loadFinanceData = () => {
  loadFinanceSummary();
  loadExpenses();
  loadAccountsPayable();
};

const setPeriod = (period) => {
  selectedPeriod.value = period;
  if (period !== 'personalizado') {
    loadFinanceData();
  }
};

// Filtrado reactivo de gastos
const filteredExpenses = computed(() => {
  return expensesList.value.filter(g => {
    const matchesCat = !filterExpenseCategory.value || g.categoria === filterExpenseCategory.value;
    const q = searchQuery.value.toLowerCase();
    const matchesSearch = !q || 
      g.descripcion?.toLowerCase().includes(q) ||
      g.numero_comprobante?.toLowerCase().includes(q) ||
      g.proveedor_nombre?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });
});

// Formateadores visuales
const formatCategoryLabel = (cat) => {
  const match = expenseCategories.find(c => c.value === cat);
  return match ? match.label : cat;
};

const getCategoryBadgeClass = (cat) => {
  switch (cat) {
    case 'ALQUILER':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'SERVICIOS_PUBLICOS':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'PAGO_PROVEEDORES':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'NOMINA_SALARIOS':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'MARKETING_PUBLICIDAD':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'EMPAQUES_SUMINISTROS':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getCategoryBarColor = (cat) => {
  switch (cat) {
    case 'ALQUILER': return 'bg-amber-500';
    case 'SERVICIOS_PUBLICOS': return 'bg-blue-500';
    case 'PAGO_PROVEEDORES': return 'bg-purple-500';
    case 'NOMINA_SALARIOS': return 'bg-indigo-500';
    case 'MARKETING_PUBLICIDAD': return 'bg-pink-500';
    case 'EMPAQUES_SUMINISTROS': return 'bg-emerald-500';
    default: return 'bg-slate-500';
  }
};

const isPastDue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().setHours(0,0,0,0));
};

const getCxpStatusBadgeClass = (estado, dueDate) => {
  if (estado === 'PAGADO') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (isPastDue(dueDate)) return 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse';
  if (estado === 'PAGADO_PARCIAL') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-purple-50 text-purple-700 border-purple-200';
};

const formatCxpStatus = (estado, dueDate) => {
  if (estado === 'PAGADO') return 'Pagado ✓';
  if (isPastDue(dueDate)) return '¡Vencido!';
  if (estado === 'PAGADO_PARCIAL') return 'Abonado Parcial';
  return 'Pendiente';
};

// Modal Gasto
const openNewExpenseModal = () => {
  editingExpenseId.value = null;
  expenseForm.categoria = 'OTROS';
  expenseForm.proveedor_id = null;
  expenseForm.descripcion = '';
  expenseForm.monto = 0;
  expenseForm.metodo_pago = 'EFECTIVO';
  expenseForm.banco_origen = '';
  expenseForm.numero_comprobante = '';
  expenseForm.fecha_gasto = getTodayLocalDate();
  expenseForm.notas = '';
  isExpenseModalOpen.value = true;
};

const openEditExpenseModal = (g) => {
  editingExpenseId.value = g.id;
  expenseForm.categoria = g.categoria;
  expenseForm.proveedor_id = g.proveedor_id;
  expenseForm.descripcion = g.descripcion;
  expenseForm.monto = parseFloat(g.monto);
  expenseForm.metodo_pago = g.metodo_pago;
  expenseForm.banco_origen = g.banco_origen || '';
  expenseForm.numero_comprobante = g.numero_comprobante || '';
  expenseForm.fecha_gasto = g.fecha_gasto;
  expenseForm.notas = g.notas || '';
  isExpenseModalOpen.value = true;
};

const saveExpense = async () => {
  isSubmittingExpense.value = true;
  try {
    const url = editingExpenseId.value ? `/finanzas/gastos/${editingExpenseId.value}` : '/finanzas/gastos';
    const method = editingExpenseId.value ? 'PUT' : 'POST';
    const res = await apiFetch(url, { method, body: expenseForm });

    if (res && res.success) {
      isExpenseModalOpen.value = false;
      alert(res.message);
      loadFinanceData();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al guardar gasto');
  } finally {
    isSubmittingExpense.value = false;
  }
};

const deleteExpenseItem = async (g) => {
  if (!confirm(`¿Estás seguro de eliminar el gasto "${g.descripcion}" por L. ${parseFloat(g.monto).toFixed(2)}?`)) return;

  try {
    const res = await apiFetch(`/finanzas/gastos/${g.id}`, { method: 'DELETE' });
    if (res && res.success) {
      alert(res.message);
      loadFinanceData();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al eliminar gasto');
  }
};

// Modal Abono a Proveedor
const openPaymentModal = (cxp) => {
  activeCxpItem.value = cxp;
  paymentForm.monto_abono = parseFloat(cxp.saldo_pendiente);
  paymentForm.metodo_pago = 'TRANSFERENCIA';
  paymentForm.banco_origen = cxp.proveedor_banco || 'BAC Credomatic';
  paymentForm.numero_comprobante = '';
  paymentForm.notas = '';
  isPaymentModalOpen.value = true;
};

const submitAbono = async () => {
  isSubmittingPayment.value = true;
  try {
    const res = await apiFetch(`/finanzas/cuentas-por-pagar/${activeCxpItem.value.id}/abono`, {
      method: 'POST',
      body: paymentForm
    });

    if (res && res.success) {
      isPaymentModalOpen.value = false;
      alert(res.message);
      loadFinanceData();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al registrar abono');
  } finally {
    isSubmittingPayment.value = false;
  }
};

// Modal Nueva Cuenta por Pagar
const openNewAccountPayableModal = () => {
  newCxpForm.proveedor_id = suppliersList.value.length > 0 ? suppliersList.value[0].id : '';
  newCxpForm.numero_factura_proveedor = '';
  newCxpForm.descripcion = '';
  newCxpForm.monto_total = 0;
  newCxpForm.fecha_emision = getTodayLocalDate();
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  newCxpForm.fecha_vencimiento = getTodayLocalDate(dueDate);
  newCxpForm.notas = '';
  
  isNewCxpModalOpen.value = true;
};

const saveNewCxp = async () => {
  isSubmittingNewCxp.value = true;
  try {
    const res = await apiFetch('/finanzas/cuentas-por-pagar', {
      method: 'POST',
      body: newCxpForm
    });

    if (res && res.success) {
      isNewCxpModalOpen.value = false;
      alert(res.message);
      loadFinanceData();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al registrar cuenta por pagar');
  } finally {
    isSubmittingNewCxp.value = false;
  }
};

// Exportar Reporte a CSV
const exportFinanceReport = () => {
  if (!expensesList.value.length) {
    alert('No hay gastos para exportar');
    return;
  }

  const headers = ['Fecha', 'Categoría', 'Descripción', 'Proveedor', 'Método Pago', 'Banco', 'Comprobante', 'Monto'];
  const rows = expensesList.value.map(g => [
    `"${g.fecha_gasto}"`,
    `"${g.categoria}"`,
    `"${g.descripcion.replace(/"/g, '""')}"`,
    `"${(g.proveedor_nombre || '').replace(/"/g, '""')}"`,
    `"${g.metodo_pago}"`,
    `"${g.banco_origen || ''}"`,
    `"${g.numero_comprobante || ''}"`,
    `"${parseFloat(g.monto).toFixed(2)}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `informe_financiero_opalo_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedMeta = localStorage.getItem('opalo_meta_utilidad');
    if (savedMeta && !isNaN(parseFloat(savedMeta))) {
      metaUtilidadDeseada.value = parseFloat(savedMeta);
    }
  }

  loadFinanceData();
  loadSuppliers();

  onEvent('pos:sale_created', () => {
    loadFinanceSummary();
  });

  onEvent('pos:devolucion_created', () => {
    loadFinanceSummary();
  });

  onEvent('finanzas:gasto_creado', () => {
    loadFinanceData();
  });
});
</script>

