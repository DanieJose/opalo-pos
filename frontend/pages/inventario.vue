<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
    
    <!-- Cabecera de Página -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Gestión de Inventario y Variantes</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            En Vivo
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">Control de existencias por talla, color, SKU y código de barras para Ópalo Accesorios</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink 
          to="/etiquetas"
          class="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Imprimir etiquetas de precios y códigos de barra para mercadería"
        >
          <span>🏷️</span>
          <span>Imprimir Etiquetas</span>
        </NuxtLink>

        <button 
          @click="openNewProductModal"
          class="px-5 py-2.5 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-opalo-500/25 flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span>
          <span>Nuevo Producto</span>
        </button>
      </div>
    </div>

    <!-- Tarjetas de Resumen de Inventario -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Total Productos</p>
        <p class="text-2xl font-black text-slate-900 mt-0.5">{{ totalProductsCount }}</p>
        <p class="text-[10px] text-slate-400">Estilos y prendas registradas</p>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Variantes Activas</p>
        <p class="text-2xl font-black text-opalo-600 mt-0.5">{{ totalVariantsCount }}</p>
        <p class="text-[10px] text-slate-400">Combinaciones talla / color</p>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Unidades en Stock</p>
        <p class="text-2xl font-black text-emerald-600 mt-0.5">{{ totalUnitsInStock }}</p>
        <p class="text-[10px] text-emerald-700 font-medium">Existencias físicas en tienda</p>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Alertas de Stock Bajo</p>
        <p class="text-2xl font-black text-rose-600 mt-0.5">{{ lowStockVariantsCount }}</p>
        <p class="text-[10px] text-rose-600 font-medium">Por debajo de stock mínimo</p>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
      <div class="relative flex-1 w-full">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
          🔍
        </span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar producto por nombre, descripción, SKU o código de barras..."
          @input="debouncedFetch"
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 transition"
        />
      </div>

      <div class="w-full sm:w-48">
        <select 
          v-model="selectedCategoryFilter"
          @change="loadProducts"
          class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
        >
          <option value="">Todas las Categorías</option>
          <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">
            {{ cat.nombre }}
          </option>
        </select>
      </div>

      <button 
        @click="loadProducts" 
        class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1"
      >
        <span>🔄</span>
        <span>Actualizar</span>
      </button>
    </div>

    <!-- Tabla de Productos y Variantes -->
    <div class="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
      
      <!-- Sub-cabecera de la Tabla: Contador y Leyenda Rápida -->
      <div class="px-5 py-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xs">
            👗
          </div>
          <div>
            <h2 class="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Listado Maestro de Inventario</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                {{ products.length }} estilos
              </span>
            </h2>
            <p class="text-[11px] text-slate-400 font-medium">
              Precios, márgenes de ganancia, variantes y control de existencia física
            </p>
          </div>
        </div>

        <!-- Leyenda Informativa de Colores de Stock -->
        <div class="flex items-center gap-3 text-[11px] font-bold text-slate-500">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Óptimo (>10)</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Bajo (1-10)</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Agotado (0)</span>
          </span>
        </div>
      </div>

      <!-- Contenedor Deslizable de la Tabla -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50/95 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
              <th class="py-3 px-4 min-w-[220px]">
                <div class="flex items-center gap-1.5">
                  <span>🛍️</span>
                  <span>Producto & Estilo</span>
                </div>
              </th>
              <th class="py-3 px-4 min-w-[140px]">
                <div class="flex items-center gap-1.5">
                  <span>🏷️</span>
                  <span>Categoría / Proveedor</span>
                </div>
              </th>
              <th class="py-3 px-4 min-w-[160px]">
                <div class="flex items-center gap-1.5">
                  <span>💰</span>
                  <span>Precio & Margen</span>
                </div>
              </th>
              <th class="py-3 px-4 min-w-[220px]">
                <div class="flex items-center gap-1.5">
                  <span>🎨</span>
                  <span>Variantes (Talla / Color)</span>
                </div>
              </th>
              <th class="py-3 px-4 text-center min-w-[110px]">
                <div class="flex items-center justify-center gap-1.5">
                  <span>📦</span>
                  <span>Stock Total</span>
                </div>
              </th>
              <th class="py-3 px-4 text-right min-w-[220px]">
                <div class="flex items-center justify-end gap-1.5">
                  <span>⚡</span>
                  <span>Acciones Rápidas</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100/90 text-slate-700">
            <!-- Cargando -->
            <tr v-if="isLoading" class="text-center py-12">
              <td colspan="6" class="py-12 text-slate-400 font-semibold">
                <span class="inline-block animate-spin text-lg mb-1">⏳</span>
                <p>Cargando catálogo de inventario...</p>
              </td>
            </tr>

            <!-- Sin resultados -->
            <tr v-else-if="products.length === 0" class="text-center py-12">
              <td colspan="6" class="py-12 text-slate-400">
                <span class="text-3xl block mb-2">👗</span>
                <p class="font-bold text-slate-700 text-sm">No se encontraron productos registrados</p>
                <p class="text-xs text-slate-400 mt-1">Haz clic en "+ Nuevo Producto" para dar de alta prendas o accesorios con sus variantes</p>
              </td>
            </tr>

            <!-- Filas -->
            <tr v-for="prod in products" :key="prod.id" class="hover:bg-slate-50/70 transition-colors group">
              <!-- 1. Producto, Imagen y Detalle -->
              <td class="py-3 px-4">
                <div class="flex items-center space-x-3">
                  <div class="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs group-hover:border-opalo-300 transition">
                    <img 
                      v-if="prod.imagen_url" 
                      :src="formatImageUrl(prod.imagen_url)" 
                      :alt="prod.nombre"
                      class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div v-else class="w-full h-full bg-gradient-to-tr from-rose-50 to-pink-50 text-opalo-600 flex flex-col items-center justify-center">
                      <span class="text-base">👗</span>
                      <span class="text-[7px] font-black uppercase text-slate-400">Ópalo</span>
                    </div>
                  </div>

                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <h3 class="font-bold text-xs text-slate-900 group-hover:text-opalo-700 transition leading-snug">
                        {{ prod.nombre }}
                      </h3>
                      <span 
                        v-if="prod.tipo_impuesto === 'ISV_18'" 
                        class="text-[8px] font-black px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        ISV 18%
                      </span>
                      <span 
                        v-else-if="prod.tipo_impuesto === 'EXENTO'" 
                        class="text-[8px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        Exento
                      </span>
                      <span 
                        v-if="prod.aplica_descuento && prod.descuento_porcentaje > 0"
                        class="text-[8px] font-black px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-0.5"
                      >
                        <span>🔥</span>
                        <span>-{{ prod.descuento_porcentaje }}%</span>
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5 font-normal">
                      {{ prod.descripcion || 'Sin descripción adicional' }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- 2. Categoría y Proveedor -->
              <td class="py-3 px-4">
                <div class="space-y-0.5">
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200/60">
                    <span class="w-1.5 h-1.5 rounded-full bg-opalo-500"></span>
                    {{ prod.categoria_nombre || 'General' }}
                  </span>
                  <p class="text-[10px] text-slate-400 font-medium flex items-center gap-1 truncate max-w-[140px]" :title="prod.proveedor_nombre || 'Sin proveedor asignado'">
                    <span>🏭</span>
                    <span class="truncate">{{ prod.proveedor_nombre || 'Sin proveedor' }}</span>
                  </p>
                </div>
              </td>

              <!-- 3. Precios & Margen de Ganancia (Diseño Limpio y Ejecutivo) -->
              <td class="py-3 px-4 font-mono">
                <div class="flex flex-col">
                  <!-- Precio de Venta -->
                  <div class="flex items-baseline gap-1.5">
                    <span 
                      class="font-extrabold text-[13px] tracking-tight"
                      :class="prod.aplica_descuento && prod.descuento_porcentaje > 0 ? 'text-rose-600' : 'text-slate-900'"
                    >
                      L. {{ parseFloat(prod.aplica_descuento && prod.descuento_porcentaje > 0 ? (prod.precio_con_descuento || (prod.precio_base * (1 - prod.descuento_porcentaje / 100))) : prod.precio_base).toFixed(2) }}
                    </span>
                    <span v-if="prod.aplica_descuento && prod.descuento_porcentaje > 0" class="line-through text-slate-400 text-[10px]">
                      L. {{ parseFloat(prod.precio_base).toFixed(2) }}
                    </span>
                  </div>

                  <!-- Costo y Margen Neto -->
                  <div class="flex items-center gap-1 mt-0.5 text-[10px] font-sans">
                    <span class="text-slate-400">Costo: <strong class="text-slate-600 font-mono">L.{{ parseFloat(prod.precio_costo || 0).toFixed(0) }}</strong></span>
                    <span class="text-slate-300">•</span>
                    <span 
                      class="font-black font-mono text-[10px]"
                      :class="getProductNetMargin(prod) >= 0 ? 'text-emerald-700' : 'text-rose-600'"
                      :title="`Margen neto estimado por unidad: L. ${getProductNetMargin(prod).toFixed(2)}`"
                    >
                      {{ getProductNetMargin(prod) >= 0 ? '+' : '' }}L.{{ getProductNetMargin(prod).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- 4. Variantes Disponibles (Chips Uniformes y Expandibles) -->
              <td class="py-3 px-4">
                <div v-if="prod.variantes && prod.variantes.length > 0" class="flex flex-wrap items-center gap-1.5 max-w-xs">
                  <div 
                    v-for="v in (expandedVariants[prod.id] ? prod.variantes : prod.variantes.slice(0, 3))" 
                    :key="v.id"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[11px] transition bg-white shadow-2xs"
                    :class="v.stock <= v.stock_minimo 
                      ? 'border-rose-200 text-rose-900 bg-rose-50/60 font-semibold' 
                      : 'border-slate-200 text-slate-700'"
                    :title="`SKU: ${v.sku} | Código: ${v.codigo_barras || 'N/A'} | Mínimo: ${v.stock_minimo}`"
                  >
                    <span class="font-extrabold text-[10px] text-slate-900 uppercase">{{ v.talla }}</span>
                    <span class="text-slate-300">•</span>
                    <span class="text-[10px] text-slate-600 font-medium">{{ v.color }}</span>
                    <span 
                      class="font-black text-[10px] px-1 py-0.2 rounded font-mono ml-0.5"
                      :class="v.stock <= v.stock_minimo ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'"
                    >
                      {{ v.stock }}
                    </span>
                  </div>

                  <button 
                    v-if="prod.variantes.length > 3" 
                    type="button"
                    @click.stop="toggleShowVariants(prod.id)"
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-opalo-50 text-slate-600 hover:text-opalo-700 border border-slate-200 transition cursor-pointer"
                    :title="expandedVariants[prod.id] ? 'Ocultar variantes adicionales' : 'Ver todas las variantes'"
                  >
                    {{ expandedVariants[prod.id] ? 'Mostrar menos' : `+${prod.variantes.length - 3} más` }}
                  </button>
                </div>
                <div v-else class="text-slate-400 italic text-[11px]">
                  Sin variantes
                </div>
              </td>

              <!-- 5. Stock Total / Estado -->
              <td class="py-3 px-4 text-center">
                <div class="flex flex-col items-center justify-center">
                  <span 
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs font-mono"
                    :class="prod.total_stock > 10 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : prod.total_stock > 0 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'"
                  >
                    <span 
                      class="w-1.5 h-1.5 rounded-full"
                      :class="prod.total_stock > 10 ? 'bg-emerald-500' : prod.total_stock > 0 ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'"
                    ></span>
                    <span>{{ prod.total_stock }} uds</span>
                  </span>
                  <span 
                    class="text-[9px] font-extrabold uppercase tracking-wider mt-0.5"
                    :class="prod.total_stock > 10 ? 'text-emerald-600' : prod.total_stock > 0 ? 'text-amber-600' : 'text-rose-600'"
                  >
                    {{ prod.total_stock > 10 ? 'Disponible' : prod.total_stock > 0 ? 'Stock Bajo' : 'Agotado' }}
                  </span>
                </div>
              </td>

              <!-- 6. Acciones Rápidas Unificadas, Limpias y Profesionales -->
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center justify-end bg-white p-1 rounded-xl border border-slate-200/90 shadow-2xs gap-1">
                  <!-- 1. Editar Producto (Acción Principal Destacada) -->
                  <button 
                    @click="openEditProductModal(prod)"
                    class="h-7.5 px-2.5 rounded-lg bg-slate-900 hover:bg-opalo-600 text-white font-bold text-xs transition-all duration-150 cursor-pointer shadow-xs inline-flex items-center gap-1.5 hover:shadow-sm"
                    title="Editar producto, precios y variantes"
                  >
                    <svg class="w-3.5 h-3.5 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Editar</span>
                  </button>

                  <div class="h-4 w-px bg-slate-200 mx-0.5"></div>

                  <!-- 2. Ajuste de Stock -->
                  <button 
                    @click="openStockAdjustModal(prod)"
                    class="h-7.5 w-7.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200 cursor-pointer flex items-center justify-center relative group/btn"
                    title="Ajuste rápido de existencias físicas"
                  >
                    <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <!-- Tooltip Flotante -->
                    <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition shadow-lg z-20">
                      Ajustar Stock
                    </span>
                  </button>

                  <!-- 3. Entrada / Nuevas Variantes -->
                  <button 
                    @click="openAddStockModal(prod)"
                    class="h-7.5 w-7.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition border border-transparent hover:border-sky-200 cursor-pointer flex items-center justify-center relative group/btn"
                    title="Agregar más existencias o dar de alta nuevas tallas y colores"
                  >
                    <svg class="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <!-- Tooltip Flotante -->
                    <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition shadow-lg z-20">
                      + Existencias / Talla
                    </span>
                  </button>

                  <!-- 4. Impresión de Etiquetas -->
                  <NuxtLink 
                    :to="`/etiquetas?producto_id=${prod.id}`"
                    class="h-7.5 w-7.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition border border-transparent hover:border-purple-200 cursor-pointer flex items-center justify-center relative group/btn"
                    title="Imprimir etiquetas y códigos de barra"
                  >
                    <svg class="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <!-- Tooltip Flotante -->
                    <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition shadow-lg z-20">
                      Etiquetas
                    </span>
                  </NuxtLink>

                  <!-- 5. Eliminar Producto (Solo Administrador) -->
                  <button 
                    v-if="isAdmin"
                    @click="deleteProductQuick(prod)"
                    class="h-7.5 w-7.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 cursor-pointer flex items-center justify-center relative group/btn"
                    title="Eliminar producto completo (Solo Administrador)"
                  >
                    <svg class="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <!-- Tooltip Flotante -->
                    <span class="pointer-events-none absolute -top-8 right-0 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition shadow-lg z-20">
                      Eliminar
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pie Resumen Profesional de la Tabla -->
      <div class="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
        <div class="flex items-center gap-4">
          <span>Mostrando <strong>{{ products.length }}</strong> de <strong>{{ totalProductsCount }}</strong> estilos registrados</span>
          <span class="hidden sm:inline text-slate-300">•</span>
          <span class="hidden sm:inline">Existencias totales: <strong class="text-slate-800 font-mono">{{ totalUnitsInStock }}</strong> prendas</span>
        </div>
        <div class="text-[11px] text-slate-400 font-medium">
          Ópalo Accesorios POS • Tocoa, Colón
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: REGISTRAR NUEVO PRODUCTO Y VARIANTES (TALLA / COLOR / STOCK)  -->
    <!-- ===================================================================== -->
    <div v-if="isNewProductModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
        
        <!-- Cabecera del Modal -->
        <div class="flex items-start justify-between border-b border-slate-100 pb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-opalo-600 to-rose-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-opalo-400/30">
              ✨
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-900">
                {{ editingProductId ? 'Editar Producto y Fotografía' : 'Crear Nuevo Producto' }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ editingProductId ? 'Actualiza la información, proveedor, imagen o variantes' : 'Configura el artículo y sus combinaciones de talla, color y existencias' }}
              </p>
            </div>
          </div>
          <button 
            @click="isNewProductModalOpen = false"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <!-- Alerta de Error -->
        <div v-if="newProductError" class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{{ newProductError }}</span>
        </div>

        <form @submit.prevent="saveNewProduct" class="space-y-6">
          
          <!-- SECCIÓN 1: DATOS GENERALES DEL PRODUCTO -->
          <div class="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-700">
              1. Información General del Producto
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nombre -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Producto *
                </label>
                <input 
                  v-model="newProductData.nombre"
                  type="text" 
                  required 
                  placeholder="Ej. Blusa Satinada Manga Larga, Collar Circonias Acero, etc."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-white"
                />
              </div>

              <!-- Proveedor (Opcional) -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Proveedor / Distribuidor (Opcional)
                </label>
                <select 
                  v-model="newProductData.proveedor_id"
                  @change="onSupplierChange"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
                >
                  <option :value="null">Sin proveedor asignado</option>
                  <option v-for="sup in suppliersList" :key="sup.id" :value="sup.id">
                    {{ sup.nombre_empresa }} ({{ sup.ciudad || 'Honduras' }})
                  </option>
                </select>
                <p v-if="currentSupplier && currentSupplierCategories.length > 0" class="text-[10px] text-slate-500 mt-1 truncate">
                  <span class="font-bold text-slate-700">Líneas de suministro:</span> {{ currentSupplier.categoria_suministro }}
                </p>
              </div>

              <!-- Categoría -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-slate-700">
                    Categoría *
                  </label>
                  <button 
                    type="button"
                    @click="toggleAddingCategory"
                    class="text-[11px] font-bold text-opalo-600 hover:text-opalo-700 hover:underline flex items-center gap-1 cursor-pointer transition"
                  >
                    <span>{{ isAddingCategory ? '✕ Cancelar' : '+ Nueva Categoría' }}</span>
                  </button>
                </div>

                <!-- Formulario inline para agregar nueva categoría -->
                <div v-if="isAddingCategory" class="mb-2 p-2.5 bg-rose-50/70 rounded-xl border border-opalo-200 space-y-2 animate-fadeIn">
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span>Agregar Nueva Categoría al Catálogo</span>
                    <span v-if="isSavingCategory" class="text-opalo-600 font-semibold animate-pulse">Guardando...</span>
                  </div>
                  <div class="flex gap-1.5">
                    <input 
                      v-model="newCategoryInput"
                      @keydown.enter.prevent="quickCreateCategory(newCategoryInput)"
                      type="text"
                      placeholder="Ej. Perfumería, Lencería, Gafas..."
                      class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs bg-white"
                      :disabled="isSavingCategory"
                    />
                    <button 
                      type="button"
                      @click="quickCreateCategory(newCategoryInput)"
                      :disabled="!newCategoryInput.trim() || isSavingCategory"
                      class="px-3 py-1.5 bg-opalo-600 hover:bg-opalo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Guardar y Usar
                    </button>
                  </div>
                  <p v-if="quickCategoryError" class="text-[10px] text-rose-600 font-bold">
                    {{ quickCategoryError }}
                  </p>
                </div>

                <select 
                  v-model="newProductData.categoria_id"
                  required
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
                >
                  <option value="" disabled>Seleccione Categoría</option>
                  <optgroup v-if="supplierCategoriesInList.length > 0" :label="'⭐ Categorías de ' + (currentSupplier?.nombre_empresa || 'Proveedor')">
                    <option v-for="cat in supplierCategoriesInList" :key="'sup-' + cat.id" :value="cat.id">
                      {{ cat.nombre }}
                    </option>
                  </optgroup>
                  <optgroup label="Todas las Categorías del Catálogo">
                    <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">
                      {{ cat.nombre }}
                    </option>
                  </optgroup>
                </select>

                <!-- Sugerencias rápidas de categorías del proveedor seleccionado -->
                <div v-if="currentSupplier && currentSupplierCategories.length > 0" class="mt-2 p-2.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-slate-700 flex items-center gap-1">
                      <span>🏷️</span> Categoría(s) del proveedor:
                    </span>
                    <span class="text-[10px] text-opalo-600 font-semibold">Clic para asignar</span>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <button 
                      type="button"
                      v-for="supCat in currentSupplierCategories"
                      :key="supCat"
                      @click="applySupplierCategory(supCat)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer"
                      :class="isCategoryActive(supCat) 
                        ? 'bg-opalo-600 text-white border-opalo-600 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-opalo-300 hover:text-opalo-600 hover:bg-opalo-50/50'"
                    >
                      <span>{{ supCat }}</span>
                      <span v-if="isCategoryActive(supCat)" class="text-[10px]">✓</span>
                      <span v-else-if="!findCategoryByName(supCat)" class="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.5 rounded font-extrabold">+ Agregar</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Precio Costo, Precio Base y Tasa de Impuesto (ISV) -->
              <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <!-- Precio Costo -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span class="flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>Precio Costo *</span>
                    </span>
                    <span class="text-[10px] text-slate-400 font-normal">Compra</span>
                  </label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-xs">
                      L.
                    </span>
                    <input 
                      v-model.number="newProductData.precio_costo"
                      @input="syncBaseCostToVariants"
                      type="number" 
                      step="0.01"
                      min="0"
                      required 
                      placeholder="180.00"
                      class="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-black font-mono transition bg-white"
                    />
                  </div>
                </div>

                <!-- Precio Base Venta -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span class="flex items-center gap-1.5">
                      <span>💰</span>
                      <span>Precio Venta *</span>
                    </span>
                    <span class="text-[10px] text-opalo-600 font-semibold">Público</span>
                  </label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-opalo-600 text-xs">
                      L.
                    </span>
                    <input 
                      v-model.number="newProductData.precio_base"
                      @input="syncBasePriceToVariants"
                      type="number" 
                      step="0.01"
                      min="0"
                      required 
                      placeholder="350.00"
                      class="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-black font-mono transition bg-white"
                    />
                  </div>
                </div>

                <!-- Tasa de Impuesto (ISV 15%, 18% o Exento) -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span class="flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>Impuesto (ISV) *</span>
                    </span>
                    <span class="text-[10px] font-bold" :class="newProductData.tipo_impuesto === 'ISV_18' ? 'text-purple-600' : 'text-slate-400'">SAR</span>
                  </label>
                  <select 
                    v-model="newProductData.tipo_impuesto"
                    class="w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 text-xs font-bold bg-white cursor-pointer transition"
                    :class="newProductData.tipo_impuesto === 'ISV_18' ? 'border-purple-300 text-purple-700 focus:ring-purple-500 bg-purple-50/20' : 'border-slate-200 text-slate-700 focus:ring-opalo-500'"
                  >
                    <option value="ISV_15">ISV 15% (General)</option>
                    <option value="ISV_18">ISV 18% (Especial SAR)</option>
                    <option value="EXENTO">Exento (0% ISV)</option>
                  </select>
                </div>
              </div>

              <!-- OPCIÓN: PRECIO VENTA YA CONTIENE EL ISV (15%) -->
              <div class="sm:col-span-2 p-3.5 rounded-2xl border transition-all"
                :class="newProductData.precio_incluye_isv ? 'bg-sky-50/70 border-sky-200' : 'bg-slate-50 border-slate-200'"
              >
                <div class="flex items-center justify-between">
                  <label class="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      v-model="newProductData.precio_incluye_isv"
                      class="w-5 h-5 rounded-lg text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer transition"
                    />
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-sm">🧾</span>
                        <span class="text-xs font-black text-slate-800">
                          El Precio Venta ya contiene el ISV (15%)
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-500 mt-0.5">
                        {{ newProductData.precio_incluye_isv 
                          ? 'El precio de venta ingresado es el precio final que paga la clienta en caja (el sistema desglosa automáticamente la base gravable y el 15% de ISV para la factura).' 
                          : 'El precio de venta ingresado es subtotal antes de impuesto (el sistema sumará el 15% de ISV adicional al cobrar en caja).' 
                        }}
                      </p>
                    </div>
                  </label>
                  <span 
                    class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ml-2 shadow-xs transition"
                    :class="newProductData.precio_incluye_isv ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'"
                  >
                    {{ newProductData.precio_incluye_isv ? '✓ ISV Incluido' : '+ ISV en Caja' }}
                  </span>
                </div>

                <!-- Desglose Fiscal en Tiempo Real -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5 pt-2.5 border-t" :class="newProductData.precio_incluye_isv ? 'border-sky-200/70' : 'border-slate-200'">
                  <div class="bg-white/95 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Subtotal Neto (Base)</p>
                    <p class="text-xs font-black font-mono text-slate-800">
                      L. {{ breakdownTax.subtotal.toFixed(2) }}
                    </p>
                    <p class="text-[9px] text-slate-400">Base gravable del producto</p>
                  </div>
                  <div class="bg-white/95 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">ISV (15% SAR)</p>
                    <p class="text-xs font-black font-mono text-sky-700">
                      L. {{ breakdownTax.taxAmount.toFixed(2) }}
                    </p>
                    <p class="text-[9px] text-slate-400">{{ newProductData.precio_incluye_isv ? 'Ya incluido en el precio' : 'Se cobrará extra en caja' }}</p>
                  </div>
                  <div class="bg-white/95 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Total Cobro al Cliente</p>
                    <p class="text-xs font-black font-mono text-slate-900">
                      L. {{ breakdownTax.finalPrice.toFixed(2) }}
                    </p>
                    <p class="text-[9px] text-slate-400">Total a pagar en POS</p>
                  </div>
                </div>
              </div>

              <!-- OPCIÓN DE DESCUENTO / OFERTA PROMOCIONAL -->
              <div class="sm:col-span-2 p-3.5 bg-rose-50/40 rounded-2xl border border-rose-200/80 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2.5">
                    <span class="text-xl">🏷️</span>
                    <div>
                      <p class="text-xs font-bold text-slate-800">¿Deseas aplicar descuento promocional a este producto?</p>
                      <p class="text-[11px] text-slate-500">Aplica un porcentaje o precio de oferta especial en el POS y catálogo</p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      v-model="newProductData.aplica_descuento" 
                      @change="onDiscountToggle"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                <!-- Campos de Descuento cuando el Switch está Activo -->
                <div v-if="newProductData.aplica_descuento" class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-rose-200/60">
                  <!-- Porcentaje de Descuento -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">
                      Porcentaje de Descuento (%)
                    </label>
                    <div class="relative">
                      <input 
                        v-model.number="newProductData.descuento_porcentaje"
                        @input="onDiscountPctChange"
                        type="number" 
                        min="0" 
                        max="99" 
                        step="1"
                        placeholder="10"
                        class="w-full pl-3 pr-8 py-2 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-black text-xs bg-white text-rose-700"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-rose-500 text-xs">%</span>
                    </div>
                  </div>

                  <!-- Botones Rápidos de Descuento -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">
                      Descuentos Rápidos
                    </label>
                    <div class="flex items-center gap-1.5">
                      <button 
                        type="button" 
                        v-for="pct in [10, 15, 20, 30, 50]" 
                        :key="pct"
                        @click="setQuickDiscount(pct)"
                        class="flex-1 py-1.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer border"
                        :class="newProductData.descuento_porcentaje === pct ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'"
                      >
                        {{ pct }}%
                      </button>
                    </div>
                  </div>

                  <!-- Precio Final con Descuento -->
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">
                      Precio con Descuento (Cobro POS)
                    </label>
                    <div class="px-3 py-2 rounded-xl bg-white border border-rose-300 flex items-center justify-between font-mono shadow-2xs">
                      <div>
                        <span class="text-xs font-black text-rose-600">
                          L. {{ effectiveSalePrice.toFixed(2) }}
                        </span>
                        <span v-if="newProductData.descuento_porcentaje > 0" class="ml-1 text-[10px] font-bold text-rose-500">
                          ({{ newProductData.descuento_porcentaje }}% OFF)
                        </span>
                      </div>
                      <span v-if="newProductData.descuento_porcentaje > 0" class="text-[10px] text-slate-400 line-through">
                        L. {{ Number(newProductData.precio_base || 0).toFixed(2) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- PANEL INTELIGENTE DE CÁLCULO DE GANANCIA ESPERADA -->
              <div class="sm:col-span-2 p-3.5 rounded-2xl border transition-all"
                :class="unitExpectedProfit >= 0 ? 'bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border-emerald-200/80' : 'bg-rose-50 border-rose-200 text-rose-800'"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ unitExpectedProfit >= 0 ? '📈' : '⚠️' }}</span>
                    <span class="text-xs font-black uppercase tracking-wider" :class="unitExpectedProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'">
                      Análisis de Rentabilidad y Ganancia Esperada {{ newProductData.aplica_descuento && newProductData.descuento_porcentaje > 0 ? '(Con Descuento Aplicado)' : '' }}
                    </span>
                  </div>
                  <span 
                    class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full"
                    :class="unitExpectedProfit > 0 ? 'bg-emerald-600 text-white' : unitExpectedProfit === 0 ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'"
                  >
                    {{ unitExpectedProfit > 0 ? `+${profitMarkupPercent.toFixed(1)}% Margen sobre Costo` : unitExpectedProfit === 0 ? 'Sin Margen (0%)' : '¡Pérdida por unidad!' }}
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div class="bg-white/90 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">
                      {{ newProductData.precio_incluye_isv ? 'Ganancia Neta / Unidad' : 'Ganancia / Unidad' }}
                    </p>
                    <p class="text-sm font-black font-mono" :class="unitExpectedProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'">
                      L. {{ unitExpectedProfit.toFixed(2) }}
                    </p>
                    <p class="text-[9px] text-slate-400">
                      {{ newProductData.precio_incluye_isv 
                        ? `Neto (L. ${breakdownTax.subtotal.toFixed(2)}) - Costo (L. ${Number(newProductData.precio_costo || 0).toFixed(2)})` 
                        : `${newProductData.aplica_descuento && newProductData.descuento_porcentaje > 0 ? 'Venta Promo' : 'Venta'} (L. ${effectiveSalePrice.toFixed(2)}) - Costo (L. ${Number(newProductData.precio_costo || 0).toFixed(2)})` 
                      }}
                    </p>
                  </div>

                  <div class="bg-white/90 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Margen Comercial</p>
                    <p class="text-sm font-black text-slate-800 font-mono">
                      {{ profitMarginPercent.toFixed(1) }}%
                    </p>
                    <p class="text-[9px] text-slate-400">% ganancia sobre ingreso neto</p>
                  </div>

                  <div class="bg-white/90 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <p class="text-[10px] text-slate-400 font-bold uppercase">Inversión en Lote</p>
                    <p class="text-sm font-black text-slate-700 font-mono">
                      L. {{ totalBatchInvestment.toFixed(2) }}
                    </p>
                    <p class="text-[9px] text-slate-400">{{ calculatedTotalNewStock }} unidades en stock</p>
                  </div>

                  <div class="bg-white/90 p-2.5 rounded-xl border border-emerald-300 shadow-xs">
                    <p class="text-[10px] text-emerald-800 font-extrabold uppercase">Ganancia Proyectada</p>
                    <p class="text-sm font-black text-emerald-700 font-mono">
                      L. {{ totalExpectedBatchProfit.toFixed(2) }}
                    </p>
                    <p class="text-[9px] text-emerald-600 font-medium">Al vender el 100% del stock</p>
                  </div>
                </div>

                <div v-if="newProductData.precio_incluye_isv && Number(newProductData.precio_base) > 0" class="mt-2.5 pt-2 border-t border-emerald-200/60 text-[10px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span>💡 <strong>Nota SAR:</strong> El precio ya incluye L. {{ breakdownTax.taxAmount.toFixed(2) }} de ISV (15%) por prenda para declaración fiscal.</span>
                  <span class="font-bold text-slate-700">Ganancia bruta s/deducir ISV: L. {{ (effectiveSalePrice - Number(newProductData.precio_costo || 0)).toFixed(2) }}</span>
                </div>
              </div>

              <!-- Descripción -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 mb-1">
                  Descripción Corta
                </label>
                <input 
                  v-model="newProductData.descripcion"
                  type="text" 
                  placeholder="Ej. Tela fresca de seda, acabado brillante, botones dorados..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-white"
                />
              </div>

              <!-- Fotografía del Producto (Subida de archivo o URL) -->
              <div class="sm:col-span-2 pt-1">
                <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span class="flex items-center gap-1.5">
                    <span>📸</span>
                    <span>Fotografía de la Prenda o Accesorio</span>
                  </span>
                  <span class="text-[10px] text-slate-400 font-normal">Formatos: JPG, PNG, WEBP (máx. 8 MB)</span>
                </label>

                <!-- Si ya hay foto seleccionada o cargada -->
                <div v-if="newProductData.imagen_url || imagePreview" class="flex items-center gap-4 p-3.5 bg-white rounded-2xl border border-rose-200 shadow-xs">
                  <div class="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative group shadow-inner">
                    <img 
                      :src="formatImageUrl(imagePreview || newProductData.imagen_url)" 
                      alt="Vista previa de la prenda" 
                      class="w-full h-full object-cover"
                    />
                    <div v-if="isUploadingImage" class="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center text-white text-xs font-bold">
                      <span class="animate-spin text-lg">⏳</span>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <p class="text-xs font-black text-emerald-700 flex items-center gap-1">
                      <span>✅</span>
                      <span>Fotografía vinculada con éxito</span>
                    </p>
                    <p class="text-[10px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                      {{ newProductData.imagen_url || 'Cargando archivo en servidor...' }}
                    </p>
                    <div class="flex items-center gap-3 pt-1">
                      <label class="text-[11px] font-bold text-opalo-600 hover:text-opalo-700 cursor-pointer flex items-center gap-1">
                        <span>🔄</span>
                        <span>Cambiar archivo</span>
                        <input type="file" accept="image/*" @change="onFileSelected" class="hidden" />
                      </label>
                      <span class="text-slate-300">•</span>
                      <button 
                        type="button" 
                        @click="removeImage"
                        class="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                      >
                        <span>🗑️</span>
                        <span>Eliminar foto</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Si aún no hay foto: Dropzone interactivo -->
                <div v-else class="space-y-2">
                  <label class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-rose-200 hover:border-opalo-500 rounded-2xl cursor-pointer bg-rose-50/30 hover:bg-rose-50/60 transition group text-center">
                    <div class="w-12 h-12 rounded-2xl bg-white text-opalo-600 flex items-center justify-center shadow-xs text-2xl mb-2 group-hover:scale-110 transition border border-rose-100">
                      📷
                    </div>
                    <p class="text-xs font-bold text-slate-800">
                      Haz clic para seleccionar la fotografía de la prenda
                    </p>
                    <p class="text-[10px] text-slate-400 mt-0.5">
                      Sube una imagen desde tu computadora o toma una foto desde tu cámara
                    </p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      @change="onFileSelected" 
                      class="hidden" 
                    />
                  </label>

                  <!-- Campo alternativo: Enlace Web directo -->
                  <div class="flex items-center gap-2">
                    <input 
                      v-model="newProductData.imagen_url"
                      type="url" 
                      placeholder="O pega directamente un enlace web de imagen (https://...)"
                      class="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: GENERADOR RÁPIDO DE VARIANTES (TALLA Y COLOR) -->
          <div class="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-700">
                  2. Generador Rápido de Variantes
                </h3>
                <p class="text-[11px] text-slate-400">
                  Selecciona tallas y colores para generar automáticamente las combinaciones de Ópalo
                </p>
              </div>
            </div>

            <!-- Selector Rápido de Tallas -->
            <div>
              <p class="text-[11px] font-bold text-slate-600 mb-1.5">Tallas a incluir:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="t in presetSizes"
                  :key="t"
                  type="button"
                  @click="toggleSelectedSize(t)"
                  class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition border cursor-pointer"
                  :class="selectedSizes.includes(t) 
                    ? 'bg-opalo-600 text-white border-opalo-600 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
                >
                  {{ t }}
                </button>
              </div>
            </div>

            <!-- Selector Rápido de Colores -->
            <div>
              <p class="text-[11px] font-bold text-slate-600 mb-1.5">Colores / Tonos a incluir:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="c in presetColors"
                  :key="c"
                  type="button"
                  @click="toggleSelectedColor(c)"
                  class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition border cursor-pointer"
                  :class="selectedColors.includes(c) 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
                >
                  {{ c }}
                </button>
              </div>
            </div>

            <!-- Botón Generar Matriz -->
            <div class="flex items-center gap-3 pt-1">
              <button
                type="button"
                @click="generateVariantMatrix"
                class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>⚡</span>
                <span>Generar Matriz ({{ selectedSizes.length }} Tallas × {{ selectedColors.length }} Colores)</span>
              </button>

              <button
                type="button"
                @click="addSingleVariant"
                class="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                + Fila Individual
              </button>
            </div>
          </div>

          <!-- SECCIÓN 3: TABLA DE VARIANTES A REGISTRAR -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-700">
                3. Detalle de Variantes ({{ newProductData.variantes.length }})
              </h3>
              <span class="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Stock Total: {{ calculatedTotalNewStock }} unidades
              </span>
            </div>

            <div class="overflow-x-auto border border-slate-200 rounded-2xl">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-500">
                    <th class="py-2.5 px-3">Talla</th>
                    <th class="py-2.5 px-3">Color</th>
                    <th class="py-2.5 px-3">Stock Inicial</th>
                    <th class="py-2.5 px-3">Stock Mín.</th>
                    <th class="py-2.5 px-3">Costo (L.)</th>
                    <th class="py-2.5 px-3">Venta (L.)</th>
                    <th class="py-2.5 px-3">Ganancia Est.</th>
                    <th class="py-2.5 px-3">Código Barras</th>
                    <th class="py-2.5 px-3 text-right">Quitar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(v, idx) in newProductData.variantes" :key="idx" class="hover:bg-slate-50/50">
                    <!-- Talla -->
                    <td class="py-2 px-3">
                      <input 
                        v-model="v.talla"
                        type="text" 
                        required
                        class="w-16 px-2 py-1 rounded-lg border border-slate-200 font-bold text-center text-xs"
                      />
                    </td>

                    <!-- Color -->
                    <td class="py-2 px-3">
                      <input 
                        v-model="v.color"
                        type="text" 
                        required
                        class="w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs"
                      />
                    </td>

                    <!-- Stock Inicial -->
                    <td class="py-2 px-3">
                      <input 
                        v-model.number="v.stock"
                        type="number" 
                        min="0"
                        required
                        class="w-14 px-2 py-1 rounded-lg border border-slate-200 text-center font-black text-xs bg-emerald-50/40 text-emerald-800"
                      />
                    </td>

                    <!-- Stock Mínimo -->
                    <td class="py-2 px-3">
                      <input 
                        v-model.number="v.stock_minimo"
                        type="number" 
                        min="1"
                        required
                        class="w-12 px-2 py-1 rounded-lg border border-slate-200 text-center text-xs"
                      />
                    </td>

                    <!-- Precio Costo -->
                    <td class="py-2 px-3">
                      <input 
                        v-model.number="v.precio_costo"
                        type="number" 
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        class="w-18 px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs bg-slate-50/60"
                      />
                    </td>

                    <!-- Precio Venta -->
                    <td class="py-2 px-3">
                      <input 
                        v-model.number="v.precio_venta"
                        type="number" 
                        step="0.01"
                        min="0"
                        required
                        class="w-18 px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs"
                      />
                    </td>

                    <!-- Ganancia Estimada por Variante -->
                    <td class="py-2 px-3">
                      <span 
                        class="inline-block px-2 py-0.5 rounded text-[10px] font-black font-mono shrink-0"
                        :class="calculateVariantProfit(v) >= 0 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'"
                        :title="newProductData.precio_incluye_isv ? 'Ganancia neta deduciendo 15% de ISV' : 'Ganancia directa sobre venta'"
                      >
                        {{ calculateVariantProfit(v) >= 0 ? '+' : '' }}L. {{ calculateVariantProfit(v).toFixed(2) }}
                      </span>
                    </td>

                    <!-- Código de Barras -->
                    <td class="py-2 px-3">
                      <div class="flex items-center gap-1">
                        <input 
                          v-model="v.codigo_barras"
                          type="text" 
                          placeholder="Auto"
                          class="w-28 px-2 py-1 rounded-lg border border-slate-200 font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          @click="generateBarcodeForVariant(v)"
                          title="Generar código de barras"
                          class="p-1 hover:bg-slate-100 rounded text-xs cursor-pointer"
                        >
                          🏷️
                        </button>
                      </div>
                    </td>

                    <!-- Eliminar fila -->
                    <td class="py-2 px-3 text-right">
                      <button 
                        type="button"
                        @click="removeVariant(idx)"
                        :disabled="newProductData.variantes.length <= 1"
                        class="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-20 cursor-pointer transition"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN DEL MODAL -->
          <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div>
              <button 
                v-if="editingProductId && isAdmin"
                type="button" 
                @click="deleteProductFromEditModal"
                class="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                title="Eliminar este producto completo del inventario (Solo Administrador)"
              >
                <svg class="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Eliminar Producto</span>
              </button>
            </div>

            <div class="flex items-center gap-3">
              <button 
                type="button" 
                @click="isNewProductModalOpen = false"
                class="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button 
                type="submit" 
                :disabled="isSubmittingNewProduct"
                class="px-6 py-2.5 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-opalo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span v-if="isSubmittingNewProduct">⏳</span>
                <span>{{ isSubmittingNewProduct ? 'Guardando...' : (editingProductId ? 'Guardar Cambios' : 'Guardar Producto e Inventario') }}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: AJUSTE RÁPIDO DE STOCK POR VARIANTE                           -->
    <!-- ===================================================================== -->
    <div v-if="isStockModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-sm font-black text-slate-900">Ajuste de Stock Rápido</h3>
            <p class="text-xs text-slate-400">{{ selectedProduct?.nombre }}</p>
          </div>
          <button @click="isStockModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
          <div 
            v-for="v in selectedProduct?.variantes" 
            :key="v.id"
            class="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 gap-2"
          >
            <div>
              <p class="text-xs font-bold text-slate-900">{{ v.talla }} • {{ v.color }}</p>
              <p class="text-[10px] text-slate-400 font-mono">SKU: {{ v.sku }}</p>
            </div>
            <div class="flex items-center gap-1.5">
              <input 
                v-model.number="v.stock" 
                type="number" 
                min="0"
                class="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs"
              />
              <button 
                @click="saveVariantStock(v)"
                class="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                title="Guardar stock"
              >
                Guardar
              </button>
              <button 
                v-if="isAdmin"
                @click="deleteVariantFromStockModal(v)"
                class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-rose-200"
                title="Eliminar esta variante (Solo Administrador)"
              >
                <span>🗑️</span>
                <span>Eliminar</span>
              </button>
            </div>
          </div>

          <div v-if="!selectedProduct?.variantes || selectedProduct.variantes.length === 0" class="py-6 text-center text-slate-400 text-xs">
            No hay variantes registradas para este producto.
          </div>
        </div>

        <!-- Footer del Modal con opción de eliminar producto completo -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            v-if="isAdmin"
            @click="deleteEntireProductFromModal"
            class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-rose-200"
            title="Eliminar producto completo del inventario (Solo Administrador)"
          >
            <span>🗑️</span>
            <span>Eliminar Producto</span>
          </button>
          <div v-else></div>

          <button
            @click="isStockModalOpen = false"
            class="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: AGREGAR MÁS PRODUCTOS (ENTRADA DE STOCK O NUEVA VARIANTE)      -->
    <!-- ===================================================================== -->
    <div v-if="isAddStockModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
        
        <!-- Cabecera -->
        <div class="flex items-start justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0">
              📦
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-black text-slate-900">Agregar Más Productos</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Entrada de Stock
                </span>
              </div>
              <p class="text-xs font-bold text-opalo-600 truncate max-w-sm">
                {{ addStockProduct?.nombre }}
              </p>
              <p class="text-[11px] text-slate-400">
                Stock actual: <strong class="text-slate-700">{{ addStockProduct?.total_stock || 0 }} unidades</strong>
              </p>
            </div>
          </div>
          <button @click="isAddStockModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <!-- Selector de Modo / Pestañas -->
        <div class="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button 
            type="button"
            @click="addStockTab = 'existentes'"
            class="flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            :class="addStockTab === 'existentes' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <span>📥 Surtir Variantes Existentes</span>
          </button>
          <button 
            type="button"
            @click="addStockTab = 'nueva_variante'"
            class="flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            :class="addStockTab === 'nueva_variante' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <span>✨ Agregar Nueva Talla/Color</span>
          </button>
        </div>

        <!-- PESTAÑA 1: Surtir Variantes Existentes -->
        <div v-if="addStockTab === 'existentes'" class="space-y-3">
          <p class="text-xs text-slate-500">
            Ingresa la cantidad recibida para cada talla y color. Se sumará automáticamente a las existencias actuales.
          </p>

          <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            <div 
              v-for="v in addStockProduct?.variantes" 
              :key="v.id"
              class="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-800 font-black text-xs flex items-center justify-center">
                    {{ v.talla }}
                  </span>
                  <span class="font-bold text-slate-900 text-xs">{{ v.color }}</span>
                </div>
                <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                  <span>Actual: <strong class="text-slate-700">{{ v.stock }} uds</strong></span>
                  <span>•</span>
                  <span class="font-mono text-[10px]">SKU: {{ v.sku }}</span>
                </div>
              </div>

              <!-- Controles de incremento -->
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-white rounded-xl border border-slate-300 p-0.5 shadow-2xs">
                  <button 
                    type="button"
                    @click="addStockDeltas[v.id] = Math.max(0, (addStockDeltas[v.id] || 0) - 1)"
                    class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 font-bold text-slate-600 cursor-pointer"
                  >
                    -
                  </button>
                  <input 
                    v-model.number="addStockDeltas[v.id]"
                    type="number" 
                    min="0"
                    placeholder="0"
                    class="w-14 text-center font-black text-xs text-emerald-700 focus:outline-none"
                  />
                  <button 
                    type="button"
                    @click="addStockDeltas[v.id] = (addStockDeltas[v.id] || 0) + 1"
                    class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 font-bold text-slate-600 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <!-- Botones rápidos -->
                <div class="flex items-center gap-1">
                  <button 
                    type="button"
                    v-for="qty in [5, 10, 20]" 
                    :key="qty"
                    @click="addStockDeltas[v.id] = (addStockDeltas[v.id] || 0) + qty"
                    class="px-2 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-[10px] font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                  >
                    +{{ qty }}
                  </button>
                </div>

                <!-- Badge de Nuevo Stock Resultante -->
                <div v-if="(addStockDeltas[v.id] || 0) > 0" class="text-right shrink-0">
                  <span class="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    = {{ v.stock + (addStockDeltas[v.id] || 0) }} uds
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total a ingresar y botón confirmar -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p class="text-[10px] uppercase font-bold text-slate-400">Total a Ingresar</p>
              <p class="text-base font-black text-emerald-700">+{{ totalDeltasToAdd }} unidades</p>
            </div>

            <div class="flex items-center gap-2">
              <button 
                type="button"
                @click="isAddStockModalOpen = false"
                class="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                @click="submitAddStockDeltas"
                :disabled="isSavingAddStock || totalDeltasToAdd <= 0"
                class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
              >
                <span>{{ isSavingAddStock ? 'Ingresando...' : `Confirmar Entrada (+${totalDeltasToAdd} uds)` }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- PESTAÑA 2: Agregar Nueva Talla o Color -->
        <div v-else class="space-y-4">
          <p class="text-xs text-slate-500">
            ¿Llegó una nueva combinación de talla o color de este artículo? Agrégala directamente al inventario.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Talla</label>
              <div class="flex gap-1 mb-1.5">
                <button 
                  type="button"
                  v-for="t in ['S', 'M', 'L', 'XL', 'Única']" 
                  :key="t"
                  @click="newVariantInput.talla = t"
                  :class="newVariantInput.talla === t ? 'bg-opalo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'"
                  class="px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer"
                >
                  {{ t }}
                </button>
              </div>
              <input 
                v-model="newVariantInput.talla" 
                type="text" 
                placeholder="Otra talla..."
                class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Color</label>
              <div class="flex flex-wrap gap-1 mb-1.5">
                <button 
                  type="button"
                  v-for="c in ['Negro', 'Blanco', 'Rojo', 'Azul', 'Rosa', 'Dorado', 'Plateado']" 
                  :key="c"
                  @click="newVariantInput.color = c"
                  :class="newVariantInput.color === c ? 'bg-opalo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'"
                  class="px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer"
                >
                  {{ c }}
                </button>
              </div>
              <input 
                v-model="newVariantInput.color" 
                type="text" 
                placeholder="Otro color..."
                class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Unidades Recibidas (Stock Inicial) *</label>
              <input 
                v-model.number="newVariantInput.stock" 
                type="number" 
                min="1"
                class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-700 bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Precio Venta (Lempiras)</label>
              <input 
                v-model.number="newVariantInput.precio_venta" 
                type="number" 
                step="0.01"
                class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Precio Costo (Opcional)</label>
              <input 
                v-model.number="newVariantInput.precio_costo" 
                type="number" 
                step="0.01"
                class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Código de Barras (Opcional)</label>
              <input 
                v-model="newVariantInput.codigo_barras" 
                type="text" 
                placeholder="Auto o escanear"
                class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-mono"
              />
            </div>
          </div>

          <p v-if="addStockError" class="text-xs text-rose-600 font-bold">
            ⚠️ {{ addStockError }}
          </p>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button 
              type="button"
              @click="duplicateProductAsNew(addStockProduct)"
              class="text-xs font-bold text-opalo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>📋</span>
              <span>Duplicar este producto como uno nuevo</span>
            </button>

            <div class="flex items-center gap-2">
              <button 
                type="button"
                @click="isAddStockModalOpen = false"
                class="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                @click="submitNewVariantToAddStock"
                :disabled="isSavingAddStock || !newVariantInput.talla.trim() || !newVariantInput.color.trim() || newVariantInput.stock <= 0"
                class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-600/25"
              >
                <span>{{ isSavingAddStock ? 'Guardando...' : '➕ Guardar Nueva Variante' }}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { onEvent } = useSocket();
const { isAdmin } = useAuth();

const products = ref([]);
const categoriesList = ref([]);
const suppliersList = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const selectedCategoryFilter = ref('');

const isStockModalOpen = ref(false);
const selectedProduct = ref(null);

const expandedVariants = reactive({});
const toggleShowVariants = (prodId) => {
  expandedVariants[prodId] = !expandedVariants[prodId];
};

// Modal de Agregar Más Productos / Entrada de Stock
const isAddStockModalOpen = ref(false);
const addStockProduct = ref(null);
const addStockTab = ref('existentes');
const addStockDeltas = reactive({});
const isSavingAddStock = ref(false);
const addStockError = ref('');

const newVariantInput = reactive({
  talla: 'M',
  color: 'Negro',
  stock: 5,
  stock_minimo: 3,
  precio_costo: 0,
  precio_venta: 0,
  codigo_barras: ''
});

const totalDeltasToAdd = computed(() => {
  return Object.values(addStockDeltas).reduce((acc, delta) => acc + (parseInt(delta, 10) || 0), 0);
});

// Modal de Nuevo Producto
const isNewProductModalOpen = ref(false);
const isSubmittingNewProduct = ref(false);
const newProductError = ref('');

// Presets de generación
const presetSizes = ['S', 'M', 'L', 'XL', 'Única'];
const presetColors = ['Negro', 'Blanco', 'Rojo', 'Azul', 'Rosa', 'Dorado', 'Plateado', 'Estándar'];

const selectedSizes = ref(['S', 'M', 'L']);
const selectedColors = ref(['Negro', 'Blanco']);

const initialProductForm = {
  nombre: '',
  descripcion: '',
  categoria_id: '',
  proveedor_id: null,
  precio_costo: 180,
  precio_base: 350,
  tipo_impuesto: 'ISV_15',
  precio_incluye_isv: true,
  aplica_descuento: false,
  descuento_porcentaje: 0,
  precio_con_descuento: null,
  imagen_url: '',
  variantes: [
    { talla: 'S', color: 'Negro', stock: 5, stock_minimo: 3, precio_costo: 180, precio_venta: 350, descuento_porcentaje: 0, precio_con_descuento: null, codigo_barras: '' },
    { talla: 'M', color: 'Negro', stock: 5, stock_minimo: 3, precio_costo: 180, precio_venta: 350, descuento_porcentaje: 0, precio_con_descuento: null, codigo_barras: '' },
    { talla: 'L', color: 'Negro', stock: 5, stock_minimo: 3, precio_costo: 180, precio_venta: 350, descuento_porcentaje: 0, precio_con_descuento: null, codigo_barras: '' }
  ]
};

const newProductData = reactive({ ...initialProductForm });
const imagePreview = ref('');
const isUploadingImage = ref(false);

// Precio de venta efectivo considerando posible descuento
const effectiveSalePrice = computed(() => {
  const base = Number(newProductData.precio_base) || 0;
  if (newProductData.aplica_descuento && Number(newProductData.descuento_porcentaje) > 0) {
    const discounted = base * (1 - (Number(newProductData.descuento_porcentaje) / 100));
    return Math.max(0, parseFloat(discounted.toFixed(2)));
  }
  return base;
});

// Desglose de impuesto y base imponible según check precio_incluye_isv
const breakdownTax = computed(() => {
  const precioCobro = effectiveSalePrice.value;
  const isvRate = 0.15;
  
  if (newProductData.tipo_impuesto === 'EXENTO') {
    return {
      subtotal: precioCobro,
      taxAmount: 0.00,
      finalPrice: precioCobro
    };
  }

  if (newProductData.precio_incluye_isv) {
    // El precio ya contiene el ISV (15%): Base = Total / 1.15
    const base = parseFloat((precioCobro / (1 + isvRate)).toFixed(2));
    const isv = parseFloat((precioCobro - base).toFixed(2));
    return {
      subtotal: base,
      taxAmount: isv,
      finalPrice: precioCobro
    };
  } else {
    // El precio NO contiene el ISV: Base = Precio, ISV = Precio * 0.15, Final = Base + ISV
    const base = precioCobro;
    const isv = parseFloat((base * isvRate).toFixed(2));
    return {
      subtotal: base,
      taxAmount: isv,
      finalPrice: parseFloat((base + isv).toFixed(2))
    };
  }
});

// Cálculos de Ganancia y Rentabilidad considerando si el precio ya incluye ISV
const unitExpectedProfit = computed(() => {
  const costo = Number(newProductData.precio_costo) || 0;
  // Si el precio ya contiene el ISV, el ingreso neto real para la boutique es la base gravable sin ISV
  const ingresoNeto = (newProductData.precio_incluye_isv && newProductData.tipo_impuesto !== 'EXENTO')
    ? breakdownTax.value.subtotal 
    : effectiveSalePrice.value;
  return parseFloat((ingresoNeto - costo).toFixed(2));
});

const profitMarkupPercent = computed(() => {
  const costo = Number(newProductData.precio_costo) || 0;
  if (costo <= 0) return 0;
  return (unitExpectedProfit.value / costo) * 100;
});

const profitMarginPercent = computed(() => {
  const ingresoNeto = (newProductData.precio_incluye_isv && newProductData.tipo_impuesto !== 'EXENTO')
    ? breakdownTax.value.subtotal 
    : effectiveSalePrice.value;
  if (ingresoNeto <= 0) return 0;
  return (unitExpectedProfit.value / ingresoNeto) * 100;
});

const calculateVariantProfit = (v) => {
  const costo = (v.precio_costo !== undefined && v.precio_costo !== null && Number(v.precio_costo) > 0)
    ? Number(v.precio_costo)
    : (Number(newProductData.precio_costo) || 0);
  const ventaBase = Number(v.precio_venta) || Number(newProductData.precio_base) || 0;
  const descPct = newProductData.aplica_descuento 
    ? (Number(v.descuento_porcentaje !== undefined ? v.descuento_porcentaje : newProductData.descuento_porcentaje) || 0) 
    : 0;
  const ventaReal = descPct > 0 ? (ventaBase * (1 - descPct / 100)) : ventaBase;
  const isvRate = 0.15;
  const ventaNeta = (newProductData.precio_incluye_isv && newProductData.tipo_impuesto !== 'EXENTO')
    ? (ventaReal / (1 + isvRate))
    : ventaReal;
  return parseFloat((ventaNeta - costo).toFixed(2));
};

const totalExpectedBatchProfit = computed(() => {
  return newProductData.variantes.reduce((sum, v) => {
    const profitUnit = calculateVariantProfit(v);
    const stock = Number(v.stock) || 0;
    return sum + (profitUnit * stock);
  }, 0);
});

const totalBatchInvestment = computed(() => {
  return newProductData.variantes.reduce((sum, v) => {
    const costo = (v.precio_costo !== undefined && v.precio_costo !== null && Number(v.precio_costo) > 0)
      ? Number(v.precio_costo)
      : (Number(newProductData.precio_costo) || 0);
    const stock = Number(v.stock) || 0;
    return sum + (costo * stock);
  }, 0);
});

const onDiscountToggle = () => {
  if (newProductData.aplica_descuento) {
    if (!newProductData.descuento_porcentaje || newProductData.descuento_porcentaje <= 0) {
      newProductData.descuento_porcentaje = 10;
    }
  } else {
    newProductData.descuento_porcentaje = 0;
    newProductData.precio_con_descuento = null;
    newProductData.variantes.forEach(v => {
      v.descuento_porcentaje = 0;
      v.precio_con_descuento = null;
    });
  }
  onDiscountPctChange();
};

const onDiscountPctChange = () => {
  if (newProductData.aplica_descuento) {
    const pct = Number(newProductData.descuento_porcentaje) || 0;
    newProductData.variantes.forEach(v => {
      v.descuento_porcentaje = pct;
      const venta = Number(v.precio_venta || newProductData.precio_base || 0);
      v.precio_con_descuento = pct > 0 ? parseFloat((venta * (1 - pct / 100)).toFixed(2)) : null;
    });
  } else {
    newProductData.variantes.forEach(v => {
      v.descuento_porcentaje = 0;
      v.precio_con_descuento = null;
    });
  }
};

const setQuickDiscount = (pct) => {
  newProductData.aplica_descuento = true;
  newProductData.descuento_porcentaje = pct;
  onDiscountPctChange();
};

const syncBaseCostToVariants = () => {
  if (newProductData.precio_costo !== undefined) {
    newProductData.variantes.forEach(v => {
      v.precio_costo = newProductData.precio_costo;
    });
  }
};

// Estadísticas computadas
const totalProductsCount = computed(() => products.value.length);
const totalVariantsCount = computed(() => {
  return products.value.reduce((acc, p) => acc + (p.variantes ? p.variantes.length : 0), 0);
});
const totalUnitsInStock = computed(() => {
  return products.value.reduce((acc, p) => acc + (p.total_stock || 0), 0);
});
const lowStockVariantsCount = computed(() => {
  let count = 0;
  products.value.forEach(p => {
    if (p.variantes) {
      p.variantes.forEach(v => {
        if (v.stock <= v.stock_minimo) count++;
      });
    }
  });
  return count;
});

const calculatedTotalNewStock = computed(() => {
  return newProductData.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
});

let debounceTimer = null;
const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadProducts();
  }, 300);
};

const loadProducts = async () => {
  isLoading.value = true;
  try {
    let url = '/productos?limit=100';
    if (searchQuery.value) {
      url += `&search=${encodeURIComponent(searchQuery.value)}`;
    }
    if (selectedCategoryFilter.value) {
      url += `&categoria_id=${selectedCategoryFilter.value}`;
    }
    const res = await apiFetch(url);
    if (res.success) {
      products.value = res.data;
    }
  } catch (err) {
    console.error('Error cargando inventario:', err);
  } finally {
    isLoading.value = false;
  }
};

const loadAuxiliaryData = async () => {
  try {
    const catRes = await apiFetch('/categorias');
    if (catRes && catRes.success) {
      categoriesList.value = catRes.data || [];
    }

    const supRes = await apiFetch('/proveedores');
    if (supRes && supRes.success) {
      suppliersList.value = supRes.data || [];
    }
  } catch (e) {
    console.warn('Error cargando auxiliares:', e);
  }
};

// Estados y métodos para Categoría y relación con Proveedor
const isAddingCategory = ref(false);
const newCategoryInput = ref('');
const isSavingCategory = ref(false);
const quickCategoryError = ref('');

const toggleAddingCategory = () => {
  isAddingCategory.value = !isAddingCategory.value;
  if (isAddingCategory.value) {
    newCategoryInput.value = '';
    quickCategoryError.value = '';
  }
};

const currentSupplier = computed(() => {
  if (!newProductData.proveedor_id) return null;
  return suppliersList.value.find(s => s.id === Number(newProductData.proveedor_id)) || null;
});

const currentSupplierCategories = computed(() => {
  if (!currentSupplier.value || !currentSupplier.value.categoria_suministro) return [];
  return currentSupplier.value.categoria_suministro
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);
});

const supplierCategoriesInList = computed(() => {
  if (!currentSupplierCategories.value.length) return [];
  const lowerNames = currentSupplierCategories.value.map(n => n.toLowerCase());
  return categoriesList.value.filter(c => lowerNames.includes(c.nombre.toLowerCase()));
});

const findCategoryByName = (name) => {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  return categoriesList.value.find(c => c.nombre.trim().toLowerCase() === clean) || null;
};

const isCategoryActive = (name) => {
  if (!name || !newProductData.categoria_id) return false;
  const activeCat = categoriesList.value.find(c => c.id === Number(newProductData.categoria_id));
  return activeCat ? activeCat.nombre.trim().toLowerCase() === name.trim().toLowerCase() : false;
};

const quickCreateCategory = async (name) => {
  if (!name || !name.trim()) return;
  const trimmed = name.trim();
  isSavingCategory.value = true;
  quickCategoryError.value = '';

  const existing = findCategoryByName(trimmed);
  if (existing) {
    newProductData.categoria_id = existing.id;
    isAddingCategory.value = false;
    newCategoryInput.value = '';
    isSavingCategory.value = false;
    return existing;
  }

  try {
    const res = await apiFetch('/categorias', {
      method: 'POST',
      body: { nombre: trimmed }
    });

    if (res && res.success && res.data) {
      const created = res.data;
      if (!categoriesList.value.some(c => c.id === created.id)) {
        categoriesList.value.push(created);
        categoriesList.value.sort((a, b) => a.nombre.localeCompare(b.nombre));
      }
      newProductData.categoria_id = created.id;
      isAddingCategory.value = false;
      newCategoryInput.value = '';
      return created;
    } else {
      quickCategoryError.value = res?.message || 'Error al crear la categoría';
    }
  } catch (err) {
    quickCategoryError.value = err?.data?.message || err?.message || 'Error al registrar categoría';
  } finally {
    isSavingCategory.value = false;
  }
};

const applySupplierCategory = async (supCat) => {
  if (!supCat || !supCat.trim()) return;
  const trimmed = supCat.trim();
  const existing = findCategoryByName(trimmed);
  if (existing) {
    newProductData.categoria_id = existing.id;
    return;
  }
  await quickCreateCategory(trimmed);
};

const onSupplierChange = async () => {
  if (!currentSupplier.value) return;
  const cats = currentSupplierCategories.value;
  if (cats.length === 1) {
    const firstCatId = categoriesList.value[0]?.id;
    if (!newProductData.categoria_id || newProductData.categoria_id === firstCatId) {
      await applySupplierCategory(cats[0]);
    }
  }
};

const toggleSelectedSize = (size) => {
  if (selectedSizes.value.includes(size)) {
    selectedSizes.value = selectedSizes.value.filter(s => s !== size);
  } else {
    selectedSizes.value.push(size);
  }
};

const toggleSelectedColor = (color) => {
  if (selectedColors.value.includes(color)) {
    selectedColors.value = selectedColors.value.filter(c => c !== color);
  } else {
    selectedColors.value.push(color);
  }
};

const generateVariantMatrix = () => {
  if (selectedSizes.value.length === 0 || selectedColors.value.length === 0) {
    alert('Por favor selecciona al menos una talla y un color para generar la matriz.');
    return;
  }

  // Mapa de variantes existentes para preservar id, sku, stock y código de barras
  const existingMap = new Map();
  newProductData.variantes.forEach(v => {
    const key = `${(v.talla || '').trim().toLowerCase()}_${(v.color || '').trim().toLowerCase()}`;
    existingMap.set(key, v);
  });

  const generated = [];
  selectedSizes.value.forEach(talla => {
    selectedColors.value.forEach(color => {
      const key = `${talla.trim().toLowerCase()}_${color.trim().toLowerCase()}`;
      const existing = existingMap.get(key);
      if (existing) {
        generated.push({ ...existing });
      } else {
        generated.push({
          sku: `SKU-${editingProductId.value || 'NEW'}-${talla.slice(0, 3)}-${color.slice(0, 3)}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
          talla,
          color,
          stock: 5,
          stock_minimo: 3,
          precio_costo: newProductData.precio_costo || 0,
          precio_venta: newProductData.precio_base || 0,
          codigo_barras: `742${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`
        });
      }
    });
  });

  newProductData.variantes = generated;
};

const addSingleVariant = () => {
  // Buscar una combinación talla / color que no exista aún en la lista
  const standardSizes = ['S', 'M', 'L', 'XL', 'XXL', 'Única'];
  const standardColors = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Gris', 'Estándar'];
  let chosenTalla = 'Única';
  let chosenColor = 'Estándar';

  const isTaken = (t, c) => newProductData.variantes.some(
    v => (v.talla || '').trim().toLowerCase() === t.toLowerCase() && 
         (v.color || '').trim().toLowerCase() === c.toLowerCase()
  );

  if (isTaken(chosenTalla, chosenColor)) {
    let found = false;
    for (const s of standardSizes) {
      for (const c of standardColors) {
        if (!isTaken(s, c)) {
          chosenTalla = s;
          chosenColor = c;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      chosenTalla = `Talla ${newProductData.variantes.length + 1}`;
      chosenColor = `Color ${newProductData.variantes.length + 1}`;
    }
  }

  newProductData.variantes.push({
    sku: `SKU-${editingProductId.value || 'NEW'}-${chosenTalla.slice(0, 3)}-${chosenColor.slice(0, 3)}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
    talla: chosenTalla,
    color: chosenColor,
    stock: 5,
    stock_minimo: 3,
    precio_costo: newProductData.precio_costo || 0,
    precio_venta: newProductData.precio_base || 0,
    codigo_barras: ''
  });
};

const removeVariant = (idx) => {
  if (newProductData.variantes.length > 1) {
    newProductData.variantes.splice(idx, 1);
  }
};

const generateBarcodeForVariant = (v) => {
  v.codigo_barras = `742${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
};

const syncBasePriceToVariants = () => {
  if (newProductData.precio_base !== undefined) {
    newProductData.variantes.forEach(v => {
      v.precio_venta = newProductData.precio_base;
    });
  }
};

const getProductNetMargin = (prod) => {
  const baseVenta = prod.aplica_descuento && prod.descuento_porcentaje > 0 
    ? parseFloat(prod.precio_con_descuento || (prod.precio_base * (1 - prod.descuento_porcentaje / 100))) 
    : parseFloat(prod.precio_base || 0);
  const costo = parseFloat(prod.precio_costo || 0);
  const isvRate = 0.15;
  const ventaNeta = (prod.precio_incluye_isv && prod.tipo_impuesto !== 'EXENTO') 
    ? (baseVenta / (1 + isvRate)) 
    : baseVenta;
  return parseFloat((ventaNeta - costo).toFixed(2));
};

const formatImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const config = useRuntimeConfig();
  const backendBase = config.public.apiBase ? config.public.apiBase.replace('/api/v1', '') : 'http://localhost:4000';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

const onFileSelected = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Previsualización local inmediata
  imagePreview.value = URL.createObjectURL(file);
  isUploadingImage.value = true;

  try {
    const formData = new FormData();
    formData.append('imagen', file);

    const tokenCookie = useCookie('opalo_token');
    const config = useRuntimeConfig();

    const response = await $fetch(`${config.public.apiBase}/productos/upload-imagen`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`
      },
      body: formData
    });

    if (response && response.success && response.data) {
      newProductData.imagen_url = response.data.url;
      imagePreview.value = response.data.url;
    }
  } catch (err) {
    alert(err?.data?.message || err?.message || 'Error al subir la fotografía');
    imagePreview.value = '';
    newProductData.imagen_url = '';
  } finally {
    isUploadingImage.value = false;
  }
};

const removeImage = () => {
  newProductData.imagen_url = '';
  imagePreview.value = '';
};

const editingProductId = ref(null);

const openNewProductModal = () => {
  editingProductId.value = null;
  newProductError.value = '';
  isAddingCategory.value = false;
  newCategoryInput.value = '';
  quickCategoryError.value = '';
  newProductData.nombre = '';
  newProductData.descripcion = '';
  newProductData.categoria_id = categoriesList.value.length > 0 ? categoriesList.value[0].id : '';
  newProductData.proveedor_id = null;
  newProductData.precio_costo = 180;
  newProductData.precio_base = 350;
  newProductData.tipo_impuesto = 'ISV_15';
  newProductData.precio_incluye_isv = true;
  newProductData.aplica_descuento = false;
  newProductData.descuento_porcentaje = 0;
  newProductData.precio_con_descuento = null;
  newProductData.imagen_url = '';
  imagePreview.value = '';
  
  // Matriz inicial básica
  selectedSizes.value = ['S', 'M', 'L'];
  selectedColors.value = ['Negro', 'Blanco'];
  generateVariantMatrix();

  isNewProductModalOpen.value = true;
};

const openEditProductModal = (prod) => {
  editingProductId.value = prod.id;
  newProductError.value = '';
  isAddingCategory.value = false;
  newCategoryInput.value = '';
  quickCategoryError.value = '';
  newProductData.nombre = prod.nombre || '';
  newProductData.descripcion = prod.descripcion || '';
  newProductData.categoria_id = prod.categoria_id || (categoriesList.value.length > 0 ? categoriesList.value[0].id : '');
  newProductData.proveedor_id = prod.proveedor_id || null;
  newProductData.precio_costo = prod.precio_costo !== undefined ? prod.precio_costo : 0;
  newProductData.precio_base = prod.precio_base || 0;
  newProductData.tipo_impuesto = prod.tipo_impuesto || 'ISV_15';
  newProductData.precio_incluye_isv = prod.precio_incluye_isv !== undefined ? Boolean(prod.precio_incluye_isv) : true;
  newProductData.aplica_descuento = Boolean(prod.aplica_descuento);
  newProductData.descuento_porcentaje = prod.descuento_porcentaje ? parseFloat(prod.descuento_porcentaje) : 0;
  newProductData.precio_con_descuento = prod.precio_con_descuento || null;
  newProductData.imagen_url = prod.imagen_url || '';
  imagePreview.value = prod.imagen_url ? formatImageUrl(prod.imagen_url) : '';
  
  // Cargar variantes del producto
  if (prod.variantes && prod.variantes.length > 0) {
    newProductData.variantes = prod.variantes.map(v => ({
      id: v.id,
      sku: v.sku || '',
      talla: v.talla,
      color: v.color,
      stock: v.stock,
      stock_minimo: v.stock_minimo || 3,
      precio_costo: v.precio_costo !== undefined ? v.precio_costo : (prod.precio_costo || 0),
      precio_venta: v.precio_venta || prod.precio_base || 0,
      descuento_porcentaje: v.descuento_porcentaje !== undefined ? v.descuento_porcentaje : (prod.descuento_porcentaje || 0),
      precio_con_descuento: v.precio_con_descuento || null,
      codigo_barras: v.codigo_barras || ''
    }));

    // Sincronizar selectores de tallas y colores existentes
    const uniqueSizes = [...new Set(prod.variantes.map(v => v.talla).filter(Boolean))];
    const uniqueColors = [...new Set(prod.variantes.map(v => v.color).filter(Boolean))];
    if (uniqueSizes.length > 0) selectedSizes.value = uniqueSizes;
    if (uniqueColors.length > 0) selectedColors.value = uniqueColors;
  } else {
    selectedSizes.value = ['Única'];
    selectedColors.value = ['Estándar'];
    generateVariantMatrix();
  }

  isNewProductModalOpen.value = true;
};

const saveNewProduct = async () => {
  newProductError.value = '';
  if (!newProductData.nombre || !newProductData.nombre.trim()) {
    newProductError.value = 'El nombre del producto es obligatorio';
    return;
  }
  if (!newProductData.categoria_id) {
    newProductError.value = 'Debe seleccionar una categoría para el producto';
    return;
  }
  if (!newProductData.variantes || newProductData.variantes.length === 0) {
    newProductError.value = 'Debe agregar al menos una variante (Talla/Color)';
    return;
  }

  // Validar combinaciones duplicadas de (Talla, Color) antes de enviar
  const seenCombos = new Set();
  const dupCombos = [];
  for (const v of newProductData.variantes) {
    const t = (v.talla || 'Única').trim().toLowerCase();
    const c = (v.color || 'Estándar').trim().toLowerCase();
    const comboKey = `${t} - ${c}`;
    if (seenCombos.has(comboKey)) {
      dupCombos.push(`${v.talla || 'Única'} / ${v.color || 'Estándar'}`);
    } else {
      seenCombos.add(comboKey);
    }
  }

  if (dupCombos.length > 0) {
    newProductError.value = `Hay combinaciones de variantes repetidas: (${dupCombos.join(', ')}). Cada variante debe tener una talla y color únicos.`;
    return;
  }

  isSubmittingNewProduct.value = true;
  try {
    const hasDiscount = Boolean(newProductData.aplica_descuento);
    const descPct = hasDiscount ? (parseFloat(newProductData.descuento_porcentaje) || 0) : 0;
    const finalPrice = hasDiscount && descPct > 0 ? effectiveSalePrice.value : null;

    const payload = {
      nombre: newProductData.nombre.trim(),
      descripcion: newProductData.descripcion ? newProductData.descripcion.trim() : null,
      categoria_id: newProductData.categoria_id,
      proveedor_id: newProductData.proveedor_id,
      precio_costo: parseFloat(newProductData.precio_costo) || 0,
      precio_base: parseFloat(newProductData.precio_base) || 0,
      tipo_impuesto: newProductData.tipo_impuesto || 'ISV_15',
      precio_incluye_isv: newProductData.precio_incluye_isv ? 1 : 0,
      aplica_descuento: hasDiscount ? 1 : 0,
      descuento_porcentaje: descPct,
      precio_con_descuento: finalPrice,
      imagen_url: newProductData.imagen_url ? newProductData.imagen_url.trim() : null,
      variantes: newProductData.variantes.map(v => {
        const vVenta = parseFloat(v.precio_venta) || parseFloat(newProductData.precio_base) || 0;
        const vDescPct = hasDiscount ? (parseFloat(v.descuento_porcentaje) || descPct) : 0;
        const vFinal = hasDiscount && vDescPct > 0 ? parseFloat((vVenta * (1 - vDescPct / 100)).toFixed(2)) : null;

        return {
          id: v.id || undefined,
          sku: v.sku ? v.sku.trim() : undefined,
          talla: v.talla || 'Única',
          color: v.color || 'Estándar',
          stock: parseInt(v.stock, 10) || 0,
          stock_minimo: parseInt(v.stock_minimo, 10) || 3,
          precio_costo: parseFloat(v.precio_costo) || parseFloat(newProductData.precio_costo) || 0,
          precio_venta: vVenta,
          precio_incluye_isv: newProductData.precio_incluye_isv ? 1 : 0,
          descuento_porcentaje: vDescPct,
          precio_con_descuento: vFinal,
          codigo_barras: v.codigo_barras ? v.codigo_barras.trim() : null
        };
      })
    };

    let res;
    if (editingProductId.value) {
      res = await apiFetch(`/productos/${editingProductId.value}`, {
        method: 'PUT',
        body: payload
      });
    } else {
      res = await apiFetch('/productos', {
        method: 'POST',
        body: payload
      });
    }

    if (res && res.success) {
      alert(editingProductId.value 
        ? `¡Producto "${newProductData.nombre}" actualizado con éxito!` 
        : `¡Producto "${newProductData.nombre}" creado exitosamente con precio costo y variantes!`
      );
      isNewProductModalOpen.value = false;
      await loadProducts();
    } else {
      newProductError.value = res?.message || 'Error al guardar el producto';
    }
  } catch (err) {
    newProductError.value = err?.data?.message || err?.message || 'Error al registrar producto en el servidor';
  } finally {
    isSubmittingNewProduct.value = false;
  }
};

const openStockAdjustModal = (prod) => {
  selectedProduct.value = JSON.parse(JSON.stringify(prod));
  isStockModalOpen.value = true;
};

const saveVariantStock = async (v) => {
  try {
    const res = await apiFetch(`/productos/variantes/${v.id}/stock`, {
      method: 'PATCH',
      body: { stock: v.stock }
    });
    if (res.success) {
      alert(`Stock de ${v.talla} / ${v.color} actualizado a ${v.stock} unidades.`);
      loadProducts();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error actualizando stock');
  }
};

const deleteProductQuick = async (prod) => {
  if (!prod || !isAdmin.value) return;

  const confirmMsg = `¿Estás seguro de que deseas eliminar el producto "${prod.nombre}" del inventario?\n\nEsta acción inactivará el estilo y todas sus variantes del catálogo. Solo los administradores pueden realizar esta acción.`;
  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    const res = await apiFetch(`/productos/${prod.id}`, {
      method: 'DELETE'
    });

    if (res && res.success) {
      alert(res.message || 'Producto eliminado exitosamente');
      await loadProducts();
    } else {
      alert(res?.message || 'Error al eliminar el producto');
    }
  } catch (err) {
    alert(err?.data?.message || err?.message || 'Error al eliminar el producto');
  }
};

const deleteProductFromEditModal = async () => {
  if (!editingProductId.value || !isAdmin.value) return;

  const prodNombre = newProductData.nombre || 'este producto';
  const confirmMsg = `¿Estás seguro de que deseas eliminar completamente "${prodNombre}" del inventario?`;
  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    const res = await apiFetch(`/productos/${editingProductId.value}`, {
      method: 'DELETE'
    });

    if (res && res.success) {
      alert(res.message || 'Producto eliminado exitosamente');
      isNewProductModalOpen.value = false;
      editingProductId.value = null;
      await loadProducts();
    } else {
      alert(res?.message || 'Error al eliminar el producto');
    }
  } catch (err) {
    alert(err?.data?.message || err?.message || 'Error al eliminar el producto');
  }
};

const deleteVariantFromStockModal = async (v) => {
  if (!isAdmin.value) {
    alert('Acción restringida: Solo el Administrador puede eliminar variantes.');
    return;
  }

  if (!confirm(`¿Estás seguro de que deseas eliminar la variante "${v.talla} • ${v.color}" (SKU: ${v.sku})?`)) {
    return;
  }

  try {
    const res = await apiFetch(`/productos/variantes/${v.id}`, {
      method: 'DELETE'
    });

    if (res && res.success) {
      alert(res.message || 'Variante eliminada exitosamente');
      if (selectedProduct.value && selectedProduct.value.variantes) {
        selectedProduct.value.variantes = selectedProduct.value.variantes.filter(item => item.id !== v.id);
      }
      await loadProducts();
    } else {
      alert(res?.message || 'Error al eliminar la variante');
    }
  } catch (err) {
    alert(err?.data?.message || err?.message || 'Error al eliminar la variante');
  }
};

const deleteEntireProductFromModal = async () => {
  if (!isAdmin.value) {
    alert('Acción restringida: Solo el Administrador puede eliminar productos.');
    return;
  }

  if (!selectedProduct.value) return;

  if (!confirm(`¿Estás seguro de que deseas eliminar completamente el producto "${selectedProduct.value.nombre}" del inventario?`)) {
    return;
  }

  try {
    const res = await apiFetch(`/productos/${selectedProduct.value.id}`, {
      method: 'DELETE'
    });

    if (res && res.success) {
      alert(res.message || 'Producto eliminado exitosamente');
      isStockModalOpen.value = false;
      await loadProducts();
    } else {
      alert(res?.message || 'Error al eliminar el producto');
    }
  } catch (err) {
    alert(err?.data?.message || err?.message || 'Error al eliminar el producto');
  }
};

// =========================================================================
// MÉTODOS PARA AGREGAR MÁS PRODUCTOS (ENTRADA DE STOCK Y NUEVAS VARIANTES)
// =========================================================================
const openAddStockModal = (prod) => {
  addStockProduct.value = JSON.parse(JSON.stringify(prod));
  addStockError.value = '';
  addStockTab.value = 'existentes';
  
  // Limpiar y preparar deltas a 0
  for (const k in addStockDeltas) delete addStockDeltas[k];
  if (prod.variantes) {
    prod.variantes.forEach(v => {
      addStockDeltas[v.id] = 0;
    });
  }

  // Prellenar formulario para posible nueva variante
  newVariantInput.talla = 'M';
  newVariantInput.color = 'Negro';
  newVariantInput.stock = 5;
  newVariantInput.stock_minimo = 3;
  newVariantInput.precio_costo = prod.precio_costo || 0;
  newVariantInput.precio_venta = prod.precio_base || 0;
  newVariantInput.codigo_barras = '';

  isAddStockModalOpen.value = true;
};

const submitAddStockDeltas = async () => {
  if (totalDeltasToAdd.value <= 0) return;
  isSavingAddStock.value = true;
  addStockError.value = '';

  try {
    const promises = [];
    for (const [variantId, delta] of Object.entries(addStockDeltas)) {
      const numDelta = parseInt(delta, 10);
      if (numDelta > 0) {
        promises.push(
          apiFetch(`/productos/variantes/${variantId}/stock`, {
            method: 'PATCH',
            body: { delta: numDelta }
          })
        );
      }
    }

    await Promise.all(promises);
    alert(`¡Se ingresaron exitosamente +${totalDeltasToAdd.value} unidades al inventario de "${addStockProduct.value?.nombre}"!`);
    isAddStockModalOpen.value = false;
    await loadProducts();
  } catch (err) {
    addStockError.value = err?.data?.message || err?.message || 'Error al actualizar existencias';
  } finally {
    isSavingAddStock.value = false;
  }
};

const submitNewVariantToAddStock = async () => {
  if (!addStockProduct.value) return;
  const t = newVariantInput.talla.trim();
  const c = newVariantInput.color.trim();
  if (!t || !c) {
    addStockError.value = 'Debes ingresar la talla y el color.';
    return;
  }

  // Verificar si ya existe una variante con la misma talla y color
  const existing = (addStockProduct.value.variantes || []).find(
    v => v.talla.trim().toLowerCase() === t.toLowerCase() && v.color.trim().toLowerCase() === c.toLowerCase()
  );
  if (existing) {
    addStockError.value = `Ya existe una variante con talla "${t}" y color "${c}". Puedes surtirla en la pestaña "Surtir Variantes Existentes".`;
    return;
  }

  isSavingAddStock.value = true;
  addStockError.value = '';

  try {
    // Preparar lista de variantes existentes + la nueva
    const existingVariants = (addStockProduct.value.variantes || []).map(v => ({
      id: v.id,
      sku: v.sku,
      talla: v.talla,
      color: v.color,
      stock: v.stock,
      stock_minimo: v.stock_minimo || 3,
      precio_costo: v.precio_costo,
      precio_venta: v.precio_venta,
      codigo_barras: v.codigo_barras
    }));

    const nextSku = `SKU-${addStockProduct.value.id}-${t.slice(0, 3).toUpperCase()}-${c.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    existingVariants.push({
      sku: nextSku,
      talla: t,
      color: c,
      stock: parseInt(newVariantInput.stock, 10) || 1,
      stock_minimo: parseInt(newVariantInput.stock_minimo, 10) || 3,
      precio_costo: parseFloat(newVariantInput.precio_costo) || parseFloat(addStockProduct.value.precio_costo) || 0,
      precio_venta: parseFloat(newVariantInput.precio_venta) || parseFloat(addStockProduct.value.precio_base) || 0,
      codigo_barras: newVariantInput.codigo_barras ? newVariantInput.codigo_barras.trim() : null
    });

    const res = await apiFetch(`/productos/${addStockProduct.value.id}`, {
      method: 'PUT',
      body: {
        nombre: addStockProduct.value.nombre,
        categoria_id: addStockProduct.value.categoria_id,
        proveedor_id: addStockProduct.value.proveedor_id,
        precio_costo: addStockProduct.value.precio_costo,
        precio_base: addStockProduct.value.precio_base,
        tipo_impuesto: addStockProduct.value.tipo_impuesto,
        precio_incluye_isv: addStockProduct.value.precio_incluye_isv ? 1 : 0,
        variantes: existingVariants
      }
    });

    if (res && res.success) {
      alert(`¡Nueva combinación (${t} • ${c}) agregada exitosamente con ${newVariantInput.stock} unidades!`);
      isAddStockModalOpen.value = false;
      await loadProducts();
    } else {
      addStockError.value = res?.message || 'Error al registrar la nueva variante';
    }
  } catch (err) {
    addStockError.value = err?.data?.message || err?.message || 'Error al agregar variante';
  } finally {
    isSavingAddStock.value = false;
  }
};

const duplicateProductAsNew = (prod) => {
  if (!prod) return;
  isAddStockModalOpen.value = false;
  openNewProductModal();
  newProductData.nombre = `${prod.nombre} (Copia)`;
  newProductData.descripcion = prod.descripcion || '';
  newProductData.categoria_id = prod.categoria_id;
  newProductData.proveedor_id = prod.proveedor_id;
  newProductData.precio_costo = prod.precio_costo || 0;
  newProductData.precio_base = prod.precio_base || 0;
  newProductData.tipo_impuesto = prod.tipo_impuesto || 'ISV_15';
  newProductData.precio_incluye_isv = Boolean(prod.precio_incluye_isv);
  newProductData.imagen_url = prod.imagen_url || '';
  imagePreview.value = prod.imagen_url ? formatImageUrl(prod.imagen_url) : '';
  
  if (prod.variantes && prod.variantes.length > 0) {
    newProductData.variantes = prod.variantes.map(v => ({
      talla: v.talla,
      color: v.color,
      sku: '',
      stock: v.stock || 5,
      stock_minimo: v.stock_minimo || 3,
      precio_costo: v.precio_costo || prod.precio_costo || 0,
      precio_venta: v.precio_venta || prod.precio_base || 0,
      codigo_barras: ''
    }));
  }
};

onMounted(() => {
  loadProducts();
  loadAuxiliaryData();

  onEvent('pos:stock_updated', () => loadProducts());
  onEvent('pos:sale_created', () => loadProducts());
  onEvent('pos:sale_cancelled', () => loadProducts());
  onEvent('pos:product_created', () => loadProducts());
});
</script>
