<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
    
    <!-- Cabecera de Página -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
      <div>
        <div class="flex items-center space-x-3">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center text-white text-xl shadow-md shadow-purple-200 shrink-0">
            🏷️
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Impresión de Etiquetas de Precios</h1>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Códigos de Barras & Precios
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Generador de etiquetas adhesivas térmicas, mariposas para joyería y hojas para prendas y accesorios
            </p>
          </div>
        </div>
      </div>

      <!-- Resumen Rápido de la Cola y Botón de Impresión -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-xs font-bold text-slate-500">En cola de impresión:</p>
          <p class="text-base font-black text-slate-900 font-mono">
            {{ totalLabelsInQueue }} etiqueta(s) <span class="text-xs font-normal text-slate-400">({{ printQueue.length }} productos)</span>
          </p>
        </div>

        <button 
          @click="printAllLabels"
          :disabled="printQueue.length === 0"
          class="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-rose-600 to-rose-700 hover:from-purple-700 hover:to-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-black transition shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer"
        >
          <span>🖨️</span>
          <span>Imprimir {{ totalLabelsInQueue }} Etiquetas</span>
        </button>
      </div>
    </div>

    <!-- Layout Principal: 2 Columnas (Selector de Productos vs Configuración / Cola / Vista Previa) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- ===================================================================== -->
      <!-- COLUMNA IZQUIERDA: CATÁLOGO Y SELECTOR DE MERCADERÍA (5 COLUMNAS)    -->
      <!-- ===================================================================== -->
      <div class="lg:col-span-5 space-y-4">
        
        <!-- Tarjeta de Búsqueda y Filtros -->
        <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <span>🔍</span>
              <span>Seleccionar Productos</span>
            </h3>
            <span class="text-[10px] font-bold text-slate-400 font-mono">
              {{ filteredItems.length }} variantes
            </span>
          </div>

          <!-- Buscador -->
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar por nombre, SKU, código de barras..."
              class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <!-- Filtro por Categoría -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <select 
                v-model="selectedCategoryId" 
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="">Todas las Categorías</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.nombre }}
                </option>
              </select>
            </div>

            <!-- Toggle Solo con Stock -->
            <div class="flex items-center">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input 
                  v-model="onlyWithStock" 
                  type="checkbox" 
                  class="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <span>Solo con existencias</span>
              </label>
            </div>
          </div>

          <!-- Botón Rápido: Cargar Todo el Stock a la Cola -->
          <button 
            @click="addAllFilteredToQueue"
            :disabled="filteredItems.length === 0"
            class="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>⚡</span>
            <span>Añadir todo el stock mostrado ({{ totalStockOfFiltered }} etiquetas)</span>
          </button>
        </div>

        <!-- Lista de Productos y Variantes Disponibles -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Listado de Artículos</span>
            <span>Acción Rápida</span>
          </div>

          <div class="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            
            <div v-if="isLoadingCatalog" class="text-center py-12 text-slate-400">
              <span class="inline-block animate-spin text-lg mb-1">⏳</span>
              <p class="text-xs font-bold">Cargando catálogo...</p>
            </div>

            <div v-else-if="filteredItems.length === 0" class="text-center py-12 text-slate-400">
              <span class="text-2xl block mb-1">🏷️</span>
              <p class="text-xs font-bold text-slate-600">No se encontraron artículos</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Ajusta los filtros o la búsqueda</p>
            </div>

            <!-- Fila de Variante -->
            <div 
              v-else
              v-for="item in filteredItems"
              :key="item.variante_id"
              class="p-3 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 group"
            >
              <!-- Info del Artículo -->
              <div class="flex items-center space-x-2.5 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    v-if="item.imagen_url" 
                    :src="item.imagen_url" 
                    alt="Foto" 
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-sm">💎</span>
                </div>

                <div class="min-w-0">
                  <p class="text-xs font-black text-slate-900 truncate" :title="item.producto_nombre">
                    {{ item.producto_nombre }}
                  </p>
                  <p class="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span class="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                      {{ item.talla }} / {{ item.color }}
                    </span>
                    <span class="font-mono text-[10px] text-slate-400">
                      {{ item.codigo_barras || item.sku }}
                    </span>
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs font-black text-emerald-700 font-mono">
                      L. {{ formatMoney(item.precio_con_descuento || item.precio_venta) }}
                    </span>
                    <span class="text-[10px] font-bold"
                          :class="item.stock > 0 ? 'text-slate-500' : 'text-rose-500'">
                      Stock: {{ item.stock }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Botones para agregar a la cola -->
              <div class="flex items-center gap-1 shrink-0">
                <button 
                  @click="addToQueue(item, 1)"
                  class="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                  title="Añadir 1 etiqueta"
                >
                  + 1
                </button>
                <button 
                  v-if="item.stock > 1"
                  @click="addToQueue(item, item.stock)"
                  class="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Añadir tantas etiquetas como existencias en stock"
                >
                  +{{ item.stock }}
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

      <!-- ===================================================================== -->
      <!-- COLUMNA DERECHA: CONFIGURACIÓN, VISTA PREVIA Y COLA (7 COLUMNAS)      -->
      <!-- ===================================================================== -->
      <div class="lg:col-span-7 space-y-5">
        
        <!-- 1. Configuración de Formato y Estilo de Etiqueta -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span>⚙️</span>
              <span>1. Formato de Etiqueta & Contenido</span>
            </h3>
            <span class="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              {{ labelFormats[labelConfig.format].name }}
            </span>
          </div>

          <!-- Selector de Tamaños de Etiquetas -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button 
              type="button"
              v-for="(f, key) in labelFormats" 
              :key="key"
              @click="labelConfig.format = key"
              class="p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between"
              :class="labelConfig.format === key ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-500/20 shadow-xs' : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'"
            >
              <div>
                <span class="text-lg block mb-0.5">{{ f.icon }}</span>
                <p class="text-xs font-black leading-tight">{{ f.name }}</p>
              </div>
              <p class="text-[10px] text-slate-400 font-mono mt-1 font-bold">{{ f.dimensions }}</p>
            </button>
          </div>

          <!-- Opciones de Elementos a Mostrar en la Etiqueta -->
          <div class="p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
            <p class="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Elementos visibles en cada etiqueta adhesiva:
            </p>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input v-model="labelConfig.showStoreName" type="checkbox" class="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer" />
                <span>Nombre Tienda (Ópalo)</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer">
                <input v-model="labelConfig.showProductName" type="checkbox" class="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer" />
                <span>Nombre del Producto</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer">
                <input v-model="labelConfig.showVariant" type="checkbox" class="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer" />
                <span>Talla y Color</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer">
                <input v-model="labelConfig.showBarcode" type="checkbox" class="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer" />
                <span>Código de Barras</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer">
                <input v-model="labelConfig.showSku" type="checkbox" class="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer" />
                <span>Código SKU / Ref.</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer text-emerald-700 font-black">
                <input v-model="labelConfig.showPrice" type="checkbox" class="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer" />
                <span>Precio de Venta (L.)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 2. Vista Previa en Vivo de la Etiqueta (Live Preview) -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span>👁️</span>
              <span>2. Vista Previa en Tiempo Real</span>
            </h3>

            <!-- Navegación entre items en cola -->
            <div v-if="printQueue.length > 1" class="flex items-center gap-2 text-xs">
              <button 
                @click="previewIndex = (previewIndex - 1 + printQueue.length) % printQueue.length"
                class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold"
              >
                ◀
              </button>
              <span class="text-[11px] font-bold text-slate-500">
                Item {{ previewIndex + 1 }} de {{ printQueue.length }}
              </span>
              <button 
                @click="previewIndex = (previewIndex + 1) % printQueue.length"
                class="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold"
              >
                ▶
              </button>
            </div>
          </div>

          <!-- Contenedor del Preview Visual Centrado -->
          <div class="p-6 bg-slate-100/80 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center min-h-[160px]">
            
            <div v-if="!currentPreviewItem" class="text-center text-slate-400 text-xs">
              <span class="text-3xl block mb-1">🏷️</span>
              <p class="font-bold">Añade productos de la izquierda para previsualizar la etiqueta</p>
            </div>

            <!-- ETIQUETA RENDERIZADA EN TIEMPO REAL -->
            <div 
              v-else
              class="bg-white shadow-md border border-slate-300 rounded p-2 text-center text-black font-sans select-none overflow-hidden transition-all"
              :style="getPreviewStyle"
            >
              <!-- Nombre Tienda -->
              <p v-if="labelConfig.showStoreName" class="text-[8px] font-black uppercase tracking-wider text-slate-700 leading-tight">
                {{ companyConfig?.nombre_empresa || 'ÓPALO ACCESORIOS' }}
              </p>

              <!-- Nombre del Producto -->
              <p v-if="labelConfig.showProductName" class="text-[9px] font-bold line-clamp-1 leading-tight mt-0.5">
                {{ currentPreviewItem.producto_nombre }}
              </p>

              <!-- Talla / Color -->
              <p v-if="labelConfig.showVariant" class="text-[8px] text-slate-600 font-bold leading-tight">
                {{ currentPreviewItem.talla }} • {{ currentPreviewItem.color }}
              </p>

              <!-- Código de Barras SVG Generado -->
              <div v-if="labelConfig.showBarcode" class="my-1 flex justify-center items-center overflow-hidden">
                <div v-html="generateBarcodeSvg(currentPreviewItem.codigo_barras || currentPreviewItem.sku, getBarcodeWidth, getBarcodeHeight)"></div>
              </div>

              <!-- SKU o Código Texto -->
              <p v-if="labelConfig.showSku" class="text-[8px] font-mono text-slate-500 leading-tight">
                {{ currentPreviewItem.codigo_barras || currentPreviewItem.sku }}
              </p>

              <!-- Precio de Venta en Lempiras -->
              <div v-if="labelConfig.showPrice" class="mt-0.5">
                <p class="text-xs font-black font-mono tracking-tight text-slate-900 leading-tight">
                  L. {{ formatMoney(currentPreviewItem.precio_con_descuento || currentPreviewItem.precio_venta) }}
                </p>
              </div>
            </div>

          </div>
        </div>

        <!-- 3. Cola de Impresión de Etiquetas -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <span>📋</span>
                <span>3. Cola de Impresión</span>
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Configura cuántas copias adhesivas imprimirás por cada prenda o joya
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button 
                v-if="printQueue.length > 0"
                @click="matchQueueWithStock"
                class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Ajustar la cantidad de etiquetas al stock de cada variante"
              >
                Stock Real
              </button>
              <button 
                v-if="printQueue.length > 0"
                @click="clearQueue"
                class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Vaciar Cola
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <th class="py-2.5 px-4">Artículo & Variante</th>
                  <th class="py-2.5 px-4">Código</th>
                  <th class="py-2.5 px-4 text-right">Precio Unit.</th>
                  <th class="py-2.5 px-4 text-center">Cantidad a Imprimir</th>
                  <th class="py-2.5 px-4 text-right">Quitar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                
                <tr v-if="printQueue.length === 0" class="text-center py-8">
                  <td colspan="5" class="py-8 text-slate-400">
                    <p class="font-bold">No hay artículos en la cola de impresión</p>
                    <p class="text-[11px] mt-0.5">Selecciona artículos de la izquierda para comenzar</p>
                  </td>
                </tr>

                <tr 
                  v-else
                  v-for="(item, idx) in printQueue"
                  :key="item.variante_id"
                  class="hover:bg-slate-50/70 transition"
                  :class="previewIndex === idx ? 'bg-purple-50/30' : ''"
                >
                  <td class="py-3 px-4">
                    <p class="font-bold text-slate-900">{{ item.producto_nombre }}</p>
                    <p class="text-[11px] text-slate-500">{{ item.talla }} / {{ item.color }}</p>
                  </td>

                  <td class="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {{ item.codigo_barras || item.sku }}
                  </td>

                  <td class="py-3 px-4 text-right font-mono font-bold text-slate-800">
                    L. {{ formatMoney(item.precio_con_descuento || item.precio_venta) }}
                  </td>

                  <td class="py-3 px-4 text-center">
                    <div class="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button 
                        @click="decrementQty(idx)"
                        class="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer shadow-xs"
                      >
                        -
                      </button>
                      <input 
                        v-model.number="item.cantidad_imprimir"
                        type="number" 
                        min="1" 
                        max="500"
                        class="w-12 text-center text-xs font-mono font-black bg-transparent focus:outline-none"
                      />
                      <button 
                        @click="incrementQty(idx)"
                        class="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td class="py-3 px-4 text-right">
                    <button 
                      @click="removeFromQueue(idx)"
                      class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Quitar de la cola"
                    >
                      ✕
                    </button>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <!-- Pie de la Cola con Botón de Impresión -->
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="text-xs">
              <span class="font-bold text-slate-600">Total etiquetas a imprimir:</span>
              <span class="font-mono font-black text-purple-700 text-sm ml-1.5">{{ totalLabelsInQueue }} unidades</span>
            </div>

            <button 
              @click="printAllLabels"
              :disabled="printQueue.length === 0"
              class="px-6 py-3 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <span>🖨️</span>
              <span>Imprimir {{ totalLabelsInQueue }} Etiquetas ({{ labelFormats[labelConfig.format].name }})</span>
            </button>
          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import JsBarcode from 'jsbarcode';

const { apiFetch } = useApi();
const route = useRoute();
const { companyConfig, getFullLogoUrl } = useCompanyConfig();

// Catálogo de artículos disponibles
const catalogItems = ref([]);
const categories = ref([]);
const isLoadingCatalog = ref(true);
const searchQuery = ref('');
const selectedCategoryId = ref('');
const onlyWithStock = ref(false);

// Cola de Impresión
const printQueue = ref([]);
const previewIndex = ref(0);

// Formatos de etiquetas soportados
const labelFormats = {
  termica_50x30: {
    name: 'Térmica Adhesiva (50x30mm)',
    dimensions: '50 × 30 mm',
    widthMm: 50,
    heightMm: 30,
    icon: '🏷️',
    type: 'roll'
  },
  joyeria_40x20: {
    name: 'Joyería / Mini (40x20mm)',
    dimensions: '40 × 20 mm',
    widthMm: 40,
    heightMm: 20,
    icon: '💍',
    type: 'roll'
  },
  rollo_80mm: {
    name: 'Rollo Térmico 80mm POS',
    dimensions: '72 × 35 mm',
    widthMm: 72,
    heightMm: 35,
    icon: '🧾',
    type: 'roll'
  },
  hoja_carta_3x10: {
    name: 'Hoja Adhesiva Carta / A4 (3x10)',
    dimensions: '63.5 × 25.4 mm (30/hoja)',
    widthMm: 63.5,
    heightMm: 25.4,
    icon: '📄',
    type: 'sheet'
  }
};

// Configuración de visualización de elementos en la etiqueta
const labelConfig = reactive({
  format: 'termica_50x30',
  showStoreName: true,
  showProductName: true,
  showVariant: true,
  showBarcode: true,
  showSku: true,
  showPrice: true
});

// Helpers
const formatMoney = (val) => {
  return parseFloat(val || 0).toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Filtrado reactivo de catálogo
const filteredItems = computed(() => {
  let list = catalogItems.value;

  if (selectedCategoryId.value) {
    list = list.filter(it => it.categoria_id === Number(selectedCategoryId.value));
  }

  if (onlyWithStock.value) {
    list = list.filter(it => it.stock > 0);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(it => 
      it.producto_nombre?.toLowerCase().includes(q) ||
      it.sku?.toLowerCase().includes(q) ||
      it.codigo_barras?.toLowerCase().includes(q) ||
      it.talla?.toLowerCase().includes(q) ||
      it.color?.toLowerCase().includes(q)
    );
  }

  return list;
});

const totalStockOfFiltered = computed(() => {
  return filteredItems.value.reduce((acc, it) => acc + (it.stock > 0 ? it.stock : 1), 0);
});

const totalLabelsInQueue = computed(() => {
  return printQueue.value.reduce((acc, it) => acc + (it.cantidad_imprimir || 1), 0);
});

const currentPreviewItem = computed(() => {
  if (printQueue.value.length === 0) {
    return filteredItems.value.length > 0 ? filteredItems.value[0] : null;
  }
  return printQueue.value[previewIndex.value] || printQueue.value[0];
});

// Estilos visuales del Preview según formato seleccionado
const getPreviewStyle = computed(() => {
  const f = labelFormats[labelConfig.format];
  return {
    width: `${f.widthMm * 3.78}px`,
    minHeight: `${f.heightMm * 3.78}px`
  };
});

const getBarcodeWidth = computed(() => {
  if (labelConfig.format === 'joyeria_40x20') return 1.0;
  if (labelConfig.format === 'hoja_carta_3x10') return 1.2;
  return 1.35;
});

const getBarcodeHeight = computed(() => {
  if (labelConfig.format === 'joyeria_40x20') return 16;
  if (labelConfig.format === 'hoja_carta_3x10') return 20;
  return 24;
});

// Generador de Código de Barras SVG con JsBarcode
const generateBarcodeSvg = (code, width = 1.3, height = 24) => {
  if (!code) return '';
  if (typeof document === 'undefined') return '';
  try {
    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svgNode, String(code).trim(), {
      format: 'CODE128',
      width: width,
      height: height,
      displayValue: false,
      margin: 0
    });
    return svgNode.outerHTML;
  } catch (err) {
    return `<div style="font-family:monospace;font-weight:bold;font-size:9px;">${code}</div>`;
  }
};

// Gestión de la Cola
const addToQueue = (item, qty = 1) => {
  const existing = printQueue.value.find(q => q.variante_id === item.variante_id);
  if (existing) {
    existing.cantidad_imprimir += qty;
  } else {
    printQueue.value.push({
      ...item,
      cantidad_imprimir: qty
    });
  }
};

const addAllFilteredToQueue = () => {
  filteredItems.value.forEach(it => {
    addToQueue(it, it.stock > 0 ? it.stock : 1);
  });
};

const incrementQty = (idx) => {
  printQueue.value[idx].cantidad_imprimir++;
};

const decrementQty = (idx) => {
  if (printQueue.value[idx].cantidad_imprimir > 1) {
    printQueue.value[idx].cantidad_imprimir--;
  } else {
    removeFromQueue(idx);
  }
};

const removeFromQueue = (idx) => {
  printQueue.value.splice(idx, 1);
  if (previewIndex.value >= printQueue.value.length) {
    previewIndex.value = Math.max(0, printQueue.value.length - 1);
  }
};

const clearQueue = () => {
  printQueue.value = [];
  previewIndex.value = 0;
};

const matchQueueWithStock = () => {
  printQueue.value.forEach(it => {
    it.cantidad_imprimir = it.stock > 0 ? it.stock : 1;
  });
};

// =============================================================================
// IMPRESIÓN DIRECTA DE ETIQUETAS
// =============================================================================
const printAllLabels = () => {
  if (printQueue.value.length === 0) return;

  const f = labelFormats[labelConfig.format];
  const isSheet = f.type === 'sheet';

  // Desglosar la cola en etiquetas individuales según la cantidad a imprimir
  const individualLabels = [];
  printQueue.value.forEach(item => {
    const qty = item.cantidad_imprimir || 1;
    for (let i = 0; i < qty; i++) {
      individualLabels.push(item);
    }
  });

  // Renderizar HTML de cada etiqueta
  const renderSingleLabelHtml = (it) => {
    const code = it.codigo_barras || it.sku || '';
    const barcodeSvg = labelConfig.showBarcode ? generateBarcodeSvg(code, getBarcodeWidth.value, getBarcodeHeight.value) : '';
    const priceFormatted = formatMoney(it.precio_con_descuento || it.precio_venta);

    return `
      <div class="label-item">
        ${labelConfig.showStoreName ? `
          <div class="label-store">${companyConfig.value?.nombre_empresa || 'ÓPALO ACCESORIOS'}</div>
        ` : ''}

        ${labelConfig.showProductName ? `
          <div class="label-product">${it.producto_nombre}</div>
        ` : ''}

        ${labelConfig.showVariant ? `
          <div class="label-variant">${it.talla} • ${it.color}</div>
        ` : ''}

        ${barcodeSvg ? `
          <div class="label-barcode">${barcodeSvg}</div>
        ` : ''}

        ${labelConfig.showSku && code ? `
          <div class="label-code">${code}</div>
        ` : ''}

        ${labelConfig.showPrice ? `
          <div class="label-price">L. ${priceFormatted}</div>
        ` : ''}
      </div>
    `;
  };

  let pageStyles = '';
  let bodyContent = '';

  if (isSheet) {
    // Hoja Carta/A4 (Cuadrícula 3x10 = 30 etiquetas por hoja)
    pageStyles = `
      @page {
        size: letter portrait;
        margin: 10mm 5mm;
      }
      .sheet-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3mm;
        width: 100%;
        page-break-after: always;
      }
      .label-item {
        box-sizing: border-box;
        border: 1px dotted #cbd5e1;
        border-radius: 4px;
        padding: 3px;
        text-align: center;
        height: 25.4mm;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      }
    `;

    // Agrupar en páginas de 30
    const chunks = [];
    for (let i = 0; i < individualLabels.length; i += 30) {
      chunks.push(individualLabels.slice(i, i + 30));
    }

    bodyContent = chunks.map(chunk => `
      <div class="sheet-grid">
        ${chunk.map(renderSingleLabelHtml).join('')}
      </div>
    `).join('');

  } else {
    // Rollo Térmico Continuo (50x30mm, 40x20mm o 80mm)
    pageStyles = `
      @page {
        size: ${f.widthMm}mm ${f.heightMm}mm;
        margin: 0;
      }
      html, body {
        width: ${f.widthMm}mm;
        margin: 0 !important;
        padding: 0 !important;
      }
      .label-item {
        box-sizing: border-box;
        width: ${f.widthMm}mm;
        height: ${f.heightMm}mm;
        padding: 2mm 1.5mm;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        page-break-after: always;
        page-break-inside: avoid;
      }
    `;

    bodyContent = individualLabels.map(renderSingleLabelHtml).join('');
  }

  // Estilos compartidos de texto y código de barras
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Etiquetas - Ópalo Accesorios</title>
      <style>
        ${pageStyles}
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .label-store {
          font-size: 7.5px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1;
          margin-bottom: 1px;
        }
        .label-product {
          font-size: 8.5px;
          font-weight: bold;
          line-height: 1.1;
          max-height: 2.2em;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 1px;
        }
        .label-variant {
          font-size: 7.5px;
          font-weight: 600;
          color: #333;
          line-height: 1;
          margin-bottom: 1px;
        }
        .label-barcode {
          margin: 1px 0;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        .label-barcode svg {
          max-width: 95%;
          display: block;
        }
        .label-code {
          font-family: monospace;
          font-size: 7.5px;
          font-weight: bold;
          line-height: 1;
        }
        .label-price {
          font-family: monospace, sans-serif;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.1;
          margin-top: 1px;
          color: #000;
        }
      </style>
    </head>
    <body>
      ${bodyContent}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 350);
        };
      <\/script>
    </body>
    </html>
  `;

  // Imprimir mediante iframe aislado
  let printFrame = document.getElementById('etiquetas-print-frame');
  if (printFrame) printFrame.remove();

  printFrame = document.createElement('iframe');
  printFrame.id = 'etiquetas-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '100px';
  printFrame.style.height = '100px';
  printFrame.style.border = 'none';
  printFrame.style.opacity = '0.01';
  printFrame.style.pointerEvents = 'none';
  printFrame.style.zIndex = '-9999';
  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(fullHtml);
  doc.close();
};

// =============================================================================
// CARGA INICIAL
// =============================================================================
const loadCatalog = async () => {
  isLoadingCatalog.value = true;
  try {
    const [itemsRes, catRes] = await Promise.all([
      apiFetch('/productos/etiquetas/items'),
      apiFetch('/categorias')
    ]);

    if (itemsRes && itemsRes.success) {
      catalogItems.value = itemsRes.data || [];
    }

    if (catRes && catRes.success) {
      categories.value = catRes.data || [];
    }

    // Si viene con parámetro ?producto_id=... o ?variante_id=..., auto-cargar a la cola
    if (route.query.producto_id) {
      const prodId = Number(route.query.producto_id);
      const matched = catalogItems.value.filter(it => it.producto_id === prodId);
      if (matched.length > 0) {
        matched.forEach(it => addToQueue(it, it.stock > 0 ? it.stock : 1));
      }
    } else if (route.query.variante_id) {
      const varId = Number(route.query.variante_id);
      const matched = catalogItems.value.find(it => it.variante_id === varId);
      if (matched) {
        addToQueue(matched, matched.stock > 0 ? matched.stock : 1);
      }
    }

  } catch (err) {
    console.error('Error cargando catálogo para etiquetas:', err);
  } finally {
    isLoadingCatalog.value = false;
  }
};

onMounted(() => {
  loadCatalog();
});
</script>
