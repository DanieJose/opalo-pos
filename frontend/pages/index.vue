<template>
  <div class="flex-1 flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] min-h-0 bg-slate-100 overflow-hidden relative">
    
    <!-- Selector de Vista en Móvil y Tablet (< lg) -->
    <div class="lg:hidden flex items-center px-3 py-2 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-20 shadow-xs">
      <div class="grid grid-cols-2 w-full bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
        <button 
          type="button"
          @click="mobilePosTab = 'catalogo'"
          class="py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
          :class="mobilePosTab === 'catalogo' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'"
        >
          <span>🛍️ Catálogo</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
            {{ products.length }}
          </span>
        </button>
        <button 
          type="button"
          @click="mobilePosTab = 'carrito'"
          class="py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer relative"
          :class="mobilePosTab === 'carrito' ? 'bg-white text-opalo-700 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'"
        >
          <span>🧾 Carrito</span>
          <span 
            class="text-[10px] px-1.5 py-0.2 rounded-full font-black transition"
            :class="totalItemsCount > 0 ? 'bg-opalo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'"
          >
            {{ totalItemsCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- COLUMNA IZQUIERDA: CATÁLOGO, FILTROS Y BÚSQUEDA RÁPIDA (70%)          -->
    <!-- ===================================================================== -->
    <div 
      :class="mobilePosTab === 'catalogo' ? 'flex' : 'hidden lg:flex'"
      class="flex-1 flex-col overflow-y-auto lg:overflow-hidden p-3 sm:p-4 lg:p-6 lg:pr-2 pb-24 lg:pb-6 min-h-0"
    >
      
      <!-- Barra de Búsqueda y Escáner de Código de Barras -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div class="relative flex-1 w-full">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-lg">
            🔍
          </span>
          <input 
            ref="searchInputRef"
            v-model="searchTerm" 
            type="text" 
            placeholder="Escanear código de barras o buscar prenda / accesorio... (Presiona Enter)"
            @keydown.enter="handleBarcodeOrSearch"
            class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 focus:border-transparent text-sm transition"
          />
        </div>

        <button 
          @click="loadProducts" 
          class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
        >
          <span>🔄</span>
          <span>Actualizar</span>
        </button>

        <!-- Botón Salidas de Efectivo / Caja Chica -->
        <button 
          @click="openCashOutModal" 
          class="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0"
          title="Registrar una salida o retiro de dinero en efectivo de la caja"
        >
          <span>💸</span>
          <span>Salidas de Efectivo</span>
          <span 
            v-if="cashShift?.turno?.salidas_efectivo > 0" 
            class="ml-1 bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-black"
          >
            -L. {{ cashShift.turno.salidas_efectivo.toFixed(2) }}
          </span>
        </button>
      </div>

      <!-- Filtro de Categorías -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
        <button 
          @click="selectCategory(null)"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
          :class="selectedCategoryId === null ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'"
        >
          ✨ Todos
        </button>
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          @click="selectCategory(cat.id)"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
          :class="selectedCategoryId === cat.id ? 'bg-opalo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'"
        >
          {{ cat.nombre }}
        </button>
      </div>

      <!-- Cuadrícula de Productos -->
      <div class="flex-1 overflow-y-auto pr-1">
        <div v-if="isLoadingProducts" class="flex flex-col items-center justify-center h-64 text-slate-400">
          <div class="animate-spin text-3xl mb-2">⏳</div>
          <p class="text-xs font-semibold">Cargando inventario de Ópalo...</p>
        </div>

        <div v-else-if="products.length === 0" class="flex flex-col items-center justify-center h-64 text-slate-400">
          <span class="text-4xl mb-2">🛍️</span>
          <p class="text-sm font-bold text-slate-600">No se encontraron productos</p>
          <p class="text-xs">Prueba con otra búsqueda o selecciona otra categoría</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          <div 
            v-for="prod in products" 
            :key="prod.id"
            @click="onProductClick(prod)"
            class="bg-white rounded-2xl p-3 border border-slate-200/90 hover:border-opalo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
          >
            <div>
              <!-- Imagen del producto con adaptación inteligente de tamaño y badge de stock -->
              <div class="relative w-full aspect-square sm:aspect-[4/3] mb-2.5 rounded-2xl overflow-hidden bg-slate-100/90 flex items-center justify-center border border-slate-200/80 group-hover:border-opalo-300 transition-all duration-300 shadow-2xs">
                
                <!-- Fondo difuminado para armonizar cualquier proporción de imagen (vertical u horizontal) -->
                <img 
                  v-if="prod.imagen_url" 
                  :src="formatImageUrl(prod.imagen_url)" 
                  class="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none select-none" 
                  aria-hidden="true"
                />

                <!-- Fotografía principal: se adapta al contenedor al 100% sin recortarse, sin estirarse y sin deformarse -->
                <img 
                  v-if="prod.imagen_url" 
                  :src="formatImageUrl(prod.imagen_url)" 
                  :alt="prod.nombre"
                  class="relative z-10 max-h-full max-w-full w-auto h-auto object-contain p-1.5 group-hover:scale-105 transition-transform duration-300 drop-shadow-2xs"
                  loading="lazy"
                />

                <div v-else class="w-full h-full bg-gradient-to-tr from-rose-50/70 to-pink-50 text-opalo-400 flex flex-col items-center justify-center">
                  <span class="text-3xl mb-1">👗</span>
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ópalo</span>
                </div>

                <!-- Badge Stock Flotante -->
                <span 
                  class="absolute top-2 right-2 z-20 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-md"
                  :class="prod.total_stock > 3 ? 'text-emerald-700 bg-white/95 border border-emerald-400/40' : prod.total_stock > 0 ? 'text-amber-700 bg-white/95 border border-amber-400/40' : 'text-rose-700 bg-white/95 border border-rose-400/40'"
                >
                  {{ prod.total_stock > 0 ? `${prod.total_stock} disp.` : 'Agotado' }}
                </span>

                <!-- Badge Oferta Flotante -->
                <span 
                  v-if="prod.aplica_descuento && prod.descuento_porcentaje > 0"
                  class="absolute top-2 left-2 z-20 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs bg-rose-600 text-white flex items-center gap-0.5"
                >
                  <span>🔥</span>
                  <span>-{{ prod.descuento_porcentaje }}%</span>
                </span>
              </div>

              <div class="flex items-center gap-1 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-opalo-600 bg-opalo-50 px-2 py-0.5 rounded-md truncate">
                  {{ prod.categoria_nombre }}
                </span>
              </div>
              <h3 class="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-opalo-600 transition">
                {{ prod.nombre }}
              </h3>
            </div>

            <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">
                  {{ prod.aplica_descuento && prod.descuento_porcentaje > 0 ? 'Precio Oferta' : 'Precio' }}
                </p>
                <div class="flex items-baseline gap-1.5">
                  <p class="text-sm sm:text-base font-extrabold" :class="prod.aplica_descuento && prod.descuento_porcentaje > 0 ? 'text-rose-600' : 'text-slate-900'">
                    L. {{ parseFloat(prod.precio_con_descuento || (prod.aplica_descuento && prod.descuento_porcentaje > 0 ? (prod.precio_base * (1 - prod.descuento_porcentaje / 100)) : prod.precio_base)).toFixed(2) }}
                  </p>
                  <p v-if="prod.aplica_descuento && prod.descuento_porcentaje > 0" class="text-[11px] text-slate-400 line-through">
                    L. {{ parseFloat(prod.precio_base).toFixed(2) }}
                  </p>
                </div>
              </div>
              <span class="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-opalo-600 group-hover:text-white transition flex items-center justify-center text-xs font-bold text-slate-600">
                {{ prod.variantes?.length > 1 ? `${prod.variantes.length}v` : '+' }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ===================================================================== -->
    <!-- COLUMNA DERECHA: TICKET / CARRITO DE VENTA ACTIVO (30%)               -->
    <!-- ===================================================================== -->
    <div 
      :class="mobilePosTab === 'carrito' ? 'flex' : 'hidden lg:flex'"
      class="w-full lg:w-[420px] bg-white border-l border-slate-200 flex-col h-full shadow-lg min-h-0"
    >
      
      <!-- Botón de regreso a Catálogo (Solo en vista móvil del Carrito) -->
      <div v-if="mobilePosTab === 'carrito'" class="lg:hidden p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
        <button
          @click="mobilePosTab = 'catalogo'"
          type="button"
          class="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <span>←</span>
          <span>Volver al Catálogo</span>
        </button>
        <span class="text-xs font-bold text-slate-500">
          {{ totalItemsCount }} productos en ticket
        </span>
      </div>

      <!-- Cabecera del Ticket & Cliente -->
      <div class="p-4 border-b border-slate-200 bg-slate-50/70">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span>🧾</span>
            <span>Ticket de Venta</span>
          </span>
          <span class="text-xs font-bold text-opalo-600 bg-opalo-50 px-2 py-0.5 rounded-full">
            {{ totalItemsCount }} artículos
          </span>
        </div>

        <!-- Tarjeta de Cliente Activo / Facturación -->
        <div class="bg-white p-3 rounded-xl border border-slate-200">
          <div class="flex items-center justify-between">
            <div class="truncate mr-2 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] uppercase font-bold text-slate-400">Cliente / Facturación</span>
                <span v-if="customer?.rtn_dni" class="text-[9px] font-black uppercase bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                  Con RTN
                </span>
              </div>
              <p class="text-xs font-bold text-slate-900 truncate mt-0.5">
                {{ customer ? customer.nombre : 'Consumidor Final' }}
              </p>
              <p v-if="customer?.rtn_dni" class="text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                <span>📄 RTN:</span>
                <span>{{ customer.rtn_dni }}</span>
              </p>
              <p v-if="customer && customer.puntos_lealtad !== undefined" class="text-[10px] text-emerald-600 font-semibold mt-0.5">
                💎 {{ customer.puntos_lealtad || 0 }} puntos acumulados
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button 
                v-if="customer"
                type="button"
                @click="assignCustomer(null)"
                title="Quitar cliente y usar Consumidor Final"
                class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center font-bold text-xs transition cursor-pointer"
              >
                ✕
              </button>
              <button 
                type="button"
                @click="openCustomerModal"
                class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-opalo-50 hover:text-opalo-600 text-slate-700 transition shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>{{ customer ? 'Cambiar' : '+ Factura / RTN' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Listado de Ítems en el Carrito -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div v-if="items.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
          <span class="text-5xl mb-2">🛒</span>
          <p class="text-sm font-bold text-slate-400">Carrito vacío</p>
          <p class="text-xs text-slate-400 text-center max-w-[200px]">Haz clic en una prenda o escanea un código para cobrar</p>
        </div>

        <div 
          v-for="(item, index) in items" 
          :key="item.variante_id"
          class="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-2"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-2.5 min-w-0">
              <!-- Miniatura adaptada del producto en carrito -->
              <div class="w-11 h-11 rounded-xl overflow-hidden bg-white border border-slate-200/90 shrink-0 flex items-center justify-center p-0.5 shadow-2xs relative">
                <img 
                  v-if="item.imagen_url" 
                  :src="formatImageUrl(item.imagen_url)" 
                  class="absolute inset-0 w-full h-full object-cover blur-xs opacity-20 pointer-events-none" 
                  aria-hidden="true"
                />
                <img 
                  v-if="item.imagen_url" 
                  :src="formatImageUrl(item.imagen_url)" 
                  :alt="item.producto_nombre"
                  class="relative z-10 max-h-full max-w-full w-auto h-auto object-contain"
                />
                <span v-else class="text-base">👗</span>
              </div>

              <div class="min-w-0">
                <h4 class="text-xs font-bold text-slate-900 leading-snug truncate max-w-[170px] sm:max-w-[200px]" :title="item.producto_nombre">
                  {{ item.producto_nombre }}
                </h4>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    Talla: {{ item.talla }}
                  </span>
                  <span class="text-[10px] font-semibold text-slate-600 truncate max-w-[90px]">
                    Color: {{ item.color }}
                  </span>
                </div>
              </div>
            </div>
            <button 
              @click="removeItem(index)" 
              class="text-slate-400 hover:text-rose-600 transition p-1 text-xs cursor-pointer shrink-0"
              title="Quitar"
            >
              ✕
            </button>
          </div>

          <div class="flex items-center justify-between pt-1">
            <!-- Controles de Cantidad -->
            <div class="flex items-center bg-white rounded-lg border border-slate-200">
              <button 
                @click="updateQuantity(index, item.cantidad - 1)"
                class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-lg font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <span class="w-8 text-center text-xs font-bold text-slate-900">
                {{ item.cantidad }}
              </span>
              <button 
                @click="updateQuantity(index, item.cantidad + 1)"
                class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-lg font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>

            <!-- Precio y Subtotal -->
            <div class="text-right">
              <p class="text-[10px] text-slate-400">
                L. {{ item.precio_unitario.toFixed(2) }} c/u
                <span v-if="item.precio_incluye_isv" class="text-[9px] font-bold text-sky-600 bg-sky-50 px-1 rounded ml-0.5">ISV inc.</span>
              </p>
              
              <!-- Descuento / Rebaja por Prenda -->
              <div class="flex items-center justify-end gap-1 mt-0.5">
                <button 
                  type="button"
                  @click="promptItemDiscount(index)" 
                  class="text-[10px] font-bold transition cursor-pointer"
                  :class="item.descuento > 0 ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200' : 'text-slate-400 hover:text-emerald-600'"
                  title="Haga clic para agregar o editar descuento / rebaja"
                >
                  {{ item.descuento > 0 ? `🏷️ Rebaja: -L. ${item.descuento.toFixed(2)}` : '+ Rebaja' }}
                </button>
                <button 
                  v-if="item.descuento > 0"
                  type="button"
                  @click="updateDiscount(index, 0)" 
                  class="text-[10px] font-black text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-1 py-0.5 rounded transition cursor-pointer"
                  title="Quitar rebaja y restaurar precio normal"
                >
                  ✕
                </button>
              </div>

              <p class="text-xs font-extrabold text-slate-900 mt-0.5">
                L. {{ (item.precio_incluye_isv ? (item.total_linea !== undefined ? item.total_linea : (item.precio_unitario * item.cantidad - item.descuento)) : item.subtotal).toFixed(2) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen de Totales y Botón de Cobro -->
      <div class="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
        <div class="space-y-1.5 text-xs text-slate-600">
          <div class="flex justify-between">
            <span>Subtotal Gravable (15%)</span>
            <span class="font-bold text-slate-800">L. {{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>ISV (15%)</span>
            <span class="font-bold text-slate-800">L. {{ isv15.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Subtotal Gravable (18%)</span>
            <span class="font-bold text-slate-500">L. 0.00</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>ISV (18%)</span>
            <span class="font-bold text-slate-500">L. 0.00</span>
          </div>
          <div class="flex justify-between" :class="totalDescuento > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'">
            <span>Descuentos y Rebajas Otorgados</span>
            <span :class="totalDescuento > 0 ? 'text-emerald-700 font-bold' : 'text-slate-500'">{{ totalDescuento > 0 ? `- L. ${totalDescuento.toFixed(2)}` : 'L. 0.00' }}</span>
          </div>
          <div class="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>Total Cobro al Cliente</span>
            <span class="text-opalo-600 font-mono">L. {{ total.toFixed(2) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-2 pt-1">
          <button 
            @click="clearCart" 
            :disabled="items.length === 0"
            class="col-span-1 py-3 bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-40"
            title="Limpiar Carrito"
          >
            🗑️
          </button>
          
          <button 
            @click="openCheckoutModal" 
            :disabled="items.length === 0"
            class="col-span-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40"
          >
            <span>💵</span>
            <span>COBRAR (L. {{ total.toFixed(2) }})</span>
          </button>
        </div>
      </div>

    </div>

    <!-- ===================================================================== -->
    <!-- BARRA FLOTANTE DE COBRO EN MÓVIL (Visible al explorar catálogo con ítems) -->
    <!-- ===================================================================== -->
    <div 
      v-if="mobilePosTab === 'catalogo' && totalItemsCount > 0"
      class="lg:hidden fixed bottom-3 inset-x-3 z-30"
    >
      <button
        @click="mobilePosTab = 'carrito'"
        type="button"
        class="w-full p-3.5 bg-gradient-to-r from-opalo-600 via-rose-600 to-rose-700 text-white rounded-2xl shadow-xl shadow-opalo-600/40 flex items-center justify-between font-black text-xs sm:text-sm cursor-pointer border border-white/20 active:scale-98 transition"
      >
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs">
            🛒 {{ totalItemsCount }}
          </span>
          <span class="text-xs font-bold text-rose-100">Total:</span>
          <span class="text-sm font-black text-white">L. {{ total.toFixed(2) }}</span>
        </div>
        <div class="flex items-center gap-1 text-[11px] sm:text-xs uppercase tracking-wider font-extrabold bg-white/20 px-3 py-1.5 rounded-xl">
          <span>Ver Carrito / Cobrar</span>
          <span>→</span>
        </div>
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 1: SELECTOR DE TALLA Y COLOR PARA PRODUCTOS CON VARIANTES       -->
    <!-- ===================================================================== -->
    <div v-if="isVariantModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-start space-x-3.5 min-w-0">
            <!-- Fotografía adaptada de la prenda activa -->
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center p-1 shadow-2xs relative">
              <img 
                v-if="activeProduct?.imagen_url" 
                :src="formatImageUrl(activeProduct.imagen_url)" 
                class="absolute inset-0 w-full h-full object-cover blur-xs opacity-25 scale-110 pointer-events-none" 
                aria-hidden="true"
              />
              <img 
                v-if="activeProduct?.imagen_url" 
                :src="formatImageUrl(activeProduct.imagen_url)" 
                :alt="activeProduct.nombre"
                class="relative z-10 max-h-full max-w-full w-auto h-auto object-contain"
              />
              <span v-else class="text-2xl">👗</span>
            </div>

            <div class="min-w-0">
              <span class="text-[10px] font-bold uppercase text-opalo-600 bg-opalo-50 px-2 py-0.5 rounded">
                Seleccionar Talla y Color
              </span>
              <h3 class="text-base font-black text-slate-900 mt-1 truncate">{{ activeProduct?.nombre }}</h3>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span class="text-xs text-slate-500 font-semibold">Total Cobro:</span>
                <span class="text-sm font-black text-slate-900 font-mono">
                  L. {{ parseFloat((activeProduct?.aplica_descuento && Number(activeProduct?.descuento_porcentaje) > 0) ? (activeProduct.precio_con_descuento || (activeProduct.precio_base * (1 - activeProduct.descuento_porcentaje / 100))) : (activeProduct?.precio_base || 0)).toFixed(2) }}
                </span>
                <span v-if="activeProduct?.aplica_descuento && Number(activeProduct?.descuento_porcentaje) > 0" class="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  -{{ activeProduct.descuento_porcentaje }}% OFF
                </span>
                <span class="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  ISV 15% incluido
                </span>
              </div>
            </div>
          </div>
          <button @click="isVariantModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 text-base cursor-pointer shrink-0">✕</button>
        </div>

        <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
          <div 
            v-for="v in activeProduct?.variantes" 
            :key="v.id"
            @click="selectVariantAndAdd(v)"
            :class="v.stock > 0 ? 'hover:border-opalo-500 hover:bg-opalo-50/40 cursor-pointer' : 'opacity-40 cursor-not-allowed bg-slate-50'"
            class="p-3 rounded-2xl border border-slate-200 flex items-center justify-between transition"
          >
            <div class="flex items-center space-x-3">
              <span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-extrabold text-xs text-slate-800">
                {{ v.talla }}
              </span>
              <div>
                <p class="text-xs font-bold text-slate-800">{{ v.color }}</p>
                <p class="text-[10px] text-slate-400 font-mono">SKU: {{ v.sku }}</p>
              </div>
            </div>

            <div class="text-right">
              <template v-if="activeProduct?.aplica_descuento && (Number(v.descuento_porcentaje) > 0 || Number(activeProduct?.descuento_porcentaje) > 0)">
                <p class="text-xs font-black text-rose-600 font-mono">
                  L. {{ (parseFloat(v.precio_venta || activeProduct?.precio_base) * (1 - (parseFloat(v.descuento_porcentaje || activeProduct?.descuento_porcentaje) / 100))).toFixed(2) }}
                </p>
                <div class="flex items-center justify-end gap-1 text-[10px]">
                  <span class="line-through text-slate-400 font-mono">L. {{ parseFloat(v.precio_venta || activeProduct?.precio_base).toFixed(2) }}</span>
                  <span class="text-[9px] font-black text-rose-500 bg-rose-50 px-1 rounded">-{{ v.descuento_porcentaje || activeProduct?.descuento_porcentaje }}%</span>
                </div>
              </template>
              <template v-else>
                <p class="text-xs font-extrabold text-slate-900 font-mono">
                  L. {{ parseFloat(v.precio_venta || activeProduct?.precio_base).toFixed(2) }}
                </p>
              </template>
              <span 
                class="text-[10px] font-bold block mt-0.5"
                :class="v.stock > 3 ? 'text-emerald-600' : v.stock > 0 ? 'text-amber-600' : 'text-rose-600'"
              >
                {{ v.stock > 0 ? `${v.stock} disp.` : 'Agotado' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 2: COBRO EN CAJA / MÉTODOS DE PAGO (EFECTIVO, TARJETA, BANCOS)   -->
    <!-- ===================================================================== -->
    <div v-if="isCheckoutModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 class="text-base font-black text-slate-900">Cobro de Venta (POS)</h3>
            <p class="text-xs text-slate-400">Total a liquidar: <strong class="text-opalo-600 text-sm">L. {{ total.toFixed(2) }}</strong></p>
          </div>
          <button @click="isCheckoutModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <!-- Resumen de Facturación / Cliente -->
        <div class="mb-3.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] uppercase font-bold text-slate-400">Factura emitida a:</span>
              <span v-if="customer?.rtn_dni" class="text-[9px] font-black uppercase bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                Con RTN
              </span>
            </div>
            <p class="font-bold text-slate-900 mt-0.5">{{ customer ? customer.nombre : 'Consumidor Final' }}</p>
            <p v-if="customer?.rtn_dni" class="font-mono text-slate-700 font-bold text-[11px]">
              RTN: {{ customer.rtn_dni }}
            </p>
          </div>
          <button 
            type="button" 
            @click="openCustomerModal" 
            class="px-2.5 py-1 bg-white border border-slate-200 hover:border-opalo-300 rounded-lg text-[11px] font-bold text-opalo-600 hover:text-opalo-700 cursor-pointer transition shadow-2xs"
          >
            {{ customer ? 'Cambiar' : '+ Factura con RTN' }}
          </button>
        </div>

        <!-- Selección de Método de Pago (Efectivo, Tarjeta POS, Transferencia o Mixto) -->
        <div class="grid grid-cols-4 gap-1.5 mb-4">
          <button 
            type="button"
            @click="setPaymentMethod('EFECTIVO')"
            :class="paymentMethod === 'EFECTIVO' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
            class="py-2.5 px-1 rounded-xl text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1"
          >
            <span class="text-base">💵</span>
            <span class="truncate">Efectivo</span>
          </button>

          <button 
            type="button"
            @click="setPaymentMethod('TARJETA')"
            :class="paymentMethod === 'TARJETA' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
            class="py-2.5 px-1 rounded-xl text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1"
          >
            <span class="text-base">💳</span>
            <span class="truncate">Tarjeta</span>
          </button>

          <button 
            type="button"
            @click="setPaymentMethod('TRANSFERENCIA')"
            :class="paymentMethod === 'TRANSFERENCIA' ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
            class="py-2.5 px-1 rounded-xl text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1"
          >
            <span class="text-base">🏦</span>
            <span class="truncate">Transf.</span>
          </button>

          <button 
            type="button"
            @click="setPaymentMethod('MIXTO')"
            :class="paymentMethod === 'MIXTO' ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30 ring-2 ring-purple-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
            class="py-2.5 px-1 rounded-xl text-xs font-semibold transition cursor-pointer flex flex-col items-center gap-1"
          >
            <span class="text-base">🔀</span>
            <span class="truncate">Mixto</span>
          </button>
        </div>

        <!-- Vista según Método de Pago: Efectivo -->
        <div v-if="paymentMethod === 'EFECTIVO'" class="space-y-3 bg-slate-50 p-4 rounded-2xl mb-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Monto Recibido (Lempiras)</label>
            <input 
              v-model.number="cashReceived" 
              type="number" 
              step="any"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <!-- Billetes Rápidos en Honduras -->
          <div class="flex items-center gap-2">
            <button 
              v-for="bill in [100, 200, 500, 1000]" 
              :key="bill"
              @click="cashReceived = bill"
              class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              L. {{ bill }}
            </button>
            <button 
              @click="cashReceived = total"
              class="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-200 transition cursor-pointer"
            >
              Exacto
            </button>
          </div>

          <!-- Cambio a Devolver -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-200">
            <span class="text-xs font-bold text-slate-600">Cambio a Entregar:</span>
            <span class="text-base font-black" :class="changeAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'">
              L. {{ changeAmount >= 0 ? changeAmount.toFixed(2) : '0.00 (Faltante)' }}
            </span>
          </div>
        </div>

        <!-- Vista según Método de Pago: Transferencia -->
        <div v-if="paymentMethod === 'TRANSFERENCIA'" class="space-y-3 bg-slate-50 p-4 rounded-2xl mb-4">
          <label class="block text-xs font-bold text-slate-700">Banco Receptor en Honduras</label>
          <select 
            v-model="transferBank"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="BAC Credomatic">BAC Credomatic Honduras</option>
            <option value="Banco Atlántida">Banco Atlántida</option>
            <option value="Banco Ficohsa">Banco Ficohsa</option>
            <option value="Banrural">Banrural Honduras</option>
            <option value="Banco de Occidente">Banco de Occidente</option>
          </select>
        </div>

        <!-- Vista según Método de Pago: Mixto (Efectivo + Tarjeta + Transferencia) -->
        <div v-if="paymentMethod === 'MIXTO'" class="space-y-3 bg-slate-50 p-4 rounded-2xl mb-4 border border-purple-100">
          <div class="flex items-center justify-between border-b border-purple-200/70 pb-2">
            <span class="text-xs font-black text-purple-900 flex items-center gap-1.5">
              <span>🔀</span>
              <span>Desglose de Pago Mixto</span>
            </span>
            <span class="text-[11px] font-extrabold text-slate-700 font-mono">
              Total a cubrir: <span class="text-purple-700">L. {{ total.toFixed(2) }}</span>
            </span>
          </div>

          <!-- Método 1: Porción Efectivo -->
          <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>💵</span>
                <span>Porción en Efectivo:</span>
              </label>
              <button 
                type="button" 
                @click="fillMixedRemaining('efectivo')" 
                class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                title="Asignar el saldo restante a Efectivo"
              >
                + Restante
              </button>
            </div>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">L.</span>
              <input 
                v-model.number="mixedPayment.efectivo" 
                type="number" 
                step="any"
                min="0"
                placeholder="0.00"
                class="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <!-- Si hay porción de efectivo, pedir el billete o efectivo entregado para calcular vuelto -->
            <div v-if="mixedPayment.efectivo > 0" class="pt-2 border-t border-slate-100 space-y-2">
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-bold text-slate-600">Efectivo entregado por cliente:</span>
                <span class="font-black font-mono" :class="mixedChangeAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'">
                  Cambio: L. {{ mixedChangeAmount >= 0 ? mixedChangeAmount.toFixed(2) : '0.00 (Faltante)' }}
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <input 
                  v-model.number="mixedPayment.efectivoRecibido" 
                  type="number" 
                  step="any"
                  placeholder="L. Billete recibido"
                  class="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  type="button"
                  @click="mixedPayment.efectivoRecibido = mixedPayment.efectivo"
                  class="px-2 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                >
                  Exacto
                </button>
                <button 
                  v-for="b in [100, 200, 500]" 
                  :key="b"
                  type="button"
                  @click="mixedPayment.efectivoRecibido = b"
                  class="px-2 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  {{ b }}
                </button>
              </div>
            </div>
          </div>

          <!-- Método 2: Porción Tarjeta POS -->
          <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>💳</span>
                <span>Porción en Tarjeta POS:</span>
              </label>
              <button 
                type="button" 
                @click="fillMixedRemaining('tarjeta')" 
                class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                title="Asignar el saldo restante a Tarjeta"
              >
                + Restante
              </button>
            </div>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">L.</span>
              <input 
                v-model.number="mixedPayment.tarjeta" 
                type="number" 
                step="any"
                min="0"
                placeholder="0.00"
                class="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Método 3: Porción Transferencia Bancaria -->
          <div class="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>🏦</span>
                <span>Porción en Transferencia:</span>
              </label>
              <button 
                type="button" 
                @click="fillMixedRemaining('transferencia')" 
                class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
                title="Asignar el saldo restante a Transferencia"
              >
                + Restante
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">L.</span>
                <input 
                  v-model.number="mixedPayment.transferencia" 
                  type="number" 
                  step="any"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <select 
                v-model="mixedPayment.banco"
                class="w-full px-2 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="BAC Credomatic">BAC Credomatic</option>
                <option value="Banco Atlántida">Banco Atlántida</option>
                <option value="Banco Ficohsa">Banco Ficohsa</option>
                <option value="Banrural">Banrural Honduras</option>
                <option value="Banco de Occidente">Banco de Occidente</option>
              </select>
            </div>
          </div>

          <!-- Barra de Estado de Cuadre Mixto -->
          <div class="p-3 rounded-xl border transition" :class="Math.abs(mixedDifference) <= 0.05 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : mixedDifference > 0 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-rose-50 border-rose-300 text-rose-900'">
            <div class="flex items-center justify-between text-xs font-bold">
              <span>Suma de Métodos:</span>
              <span class="font-mono text-sm">L. {{ mixedTotalCovered.toFixed(2) }} / L. {{ total.toFixed(2) }}</span>
            </div>
            <div class="text-[11px] font-bold mt-1 flex items-center justify-between">
              <span v-if="Math.abs(mixedDifference) <= 0.05">
                ✅ Total cubierto exactamente para cobro mixto
              </span>
              <span v-else-if="mixedDifference > 0">
                ⚠️ Falta por asignar a métodos: L. {{ mixedDifference.toFixed(2) }}
              </span>
              <span v-else>
                ❌ La suma excede el total por: L. {{ Math.abs(mixedDifference).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Botón de Confirmación de Cobro -->
        <button 
          @click="submitSale"
          :disabled="isSubmittingSale || 
            (paymentMethod === 'EFECTIVO' && cashReceived < total) ||
            (paymentMethod === 'MIXTO' && (Math.abs(mixedDifference) > 0.05 || (mixedPayment.efectivo > 0 && mixedPayment.efectivoRecibido < mixedPayment.efectivo)))"
          class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40"
        >
          <span v-if="isSubmittingSale" class="animate-spin text-lg">⏳</span>
          <span>{{ isSubmittingSale ? 'Procesando Venta e Inventario...' : 'Confirmar e Imprimir Recibo' }}</span>
        </button>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 3: RECIBO IMPRIMIBLE / TICKET TÉRMICO (80mm)                    -->
    <!-- ===================================================================== -->
    <div v-if="isReceiptModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col items-center">
        
        <!-- Contenedor del Ticket Imprimible -->
        <div id="thermal-receipt" class="w-full font-mono text-[11px] text-slate-800 border-b border-dashed border-slate-300 pb-4">
          <div class="text-center mb-3">
            <img 
              v-if="companyConfig?.logo_url && !logoError" 
              :src="getFullLogoUrl(companyConfig.logo_url)" 
              alt="Logo" 
              class="h-10 mx-auto mb-1.5 object-contain"
              @error="logoError = true"
            />
            <h2 class="text-sm font-black tracking-tight">{{ companyConfig?.nombre_empresa || 'ÓPALO ACCESORIOS' }}</h2>
            <p class="text-[10px] text-slate-500">{{ companyConfig?.direccion || companyConfig?.ciudad || 'Tocoa, Colón • Honduras' }}</p>
            <p class="text-[10px] text-slate-700 font-bold">RTN: {{ companyConfig?.rtn || '02091995001230' }}</p>
            <p v-if="companyConfig?.cai_sar" class="text-[8px] text-slate-400 break-all">CAI: {{ companyConfig.cai_sar }}</p>
            <p class="text-[10px] font-bold mt-1">Factura: {{ completedSale?.numero_factura }}</p>
            <p class="text-[9px] text-slate-400">{{ completedSale?.fecha }}</p>
          </div>

          <div class="border-t border-b border-dashed border-slate-200 py-1.5 my-2 text-[10px]">
            <p><strong>Cajero:</strong> {{ user?.nombre }}</p>
            <p><strong>Cliente:</strong> {{ customer ? customer.nombre : (completedSale?.cliente_nombre || 'Consumidor Final') }}</p>
            <p v-if="customer?.rtn_dni || completedSale?.cliente_rtn">
              <strong>RTN Cliente:</strong> {{ customer?.rtn_dni || completedSale?.cliente_rtn }}
            </p>
            <p><strong>Método de Pago:</strong> {{ completedSale?.metodo_pago }} {{ completedSale?.banco_transferencia ? `(${completedSale.banco_transferencia})` : '' }}</p>
            
            <!-- Desglose impreso si fue pago MIXTO -->
            <div v-if="completedSale?.metodo_pago === 'MIXTO'" class="mt-1 pl-2 text-[9px] text-slate-700 border-l-2 border-purple-500 space-y-0.5">
              <div v-if="Number(completedSale?.monto_efectivo) > 0" class="flex justify-between">
                <span>↳ Efectivo:</span>
                <span class="font-bold">L. {{ Number(completedSale.monto_efectivo).toFixed(2) }}</span>
              </div>
              <div v-if="Number(completedSale?.monto_tarjeta) > 0" class="flex justify-between">
                <span>↳ Tarjeta POS:</span>
                <span class="font-bold">L. {{ Number(completedSale.monto_tarjeta).toFixed(2) }}</span>
              </div>
              <div v-if="Number(completedSale?.monto_transferencia) > 0" class="flex justify-between">
                <span>↳ Transferencia ({{ completedSale?.banco_transferencia || 'Banco' }}):</span>
                <span class="font-bold">L. {{ Number(completedSale.monto_transferencia).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Tabla de Artículos -->
          <div class="space-y-1 my-2">
            <div v-for="it in completedSale?.items" :key="it.variante_id" class="border-b border-dotted border-slate-200 pb-1">
              <div class="flex justify-between">
                <span class="truncate mr-2">{{ it.cantidad }}x {{ it.nombre }}</span>
                <span class="font-bold shrink-0">L. {{ (it.precio_unitario * it.cantidad).toFixed(2) }}</span>
              </div>
              <div v-if="it.descuento > 0" class="flex justify-between text-[9px] text-emerald-800 pl-2">
                <span>↳ Rebaja / Descuento:</span>
                <span>- L. {{ parseFloat(it.descuento).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Desglose de Totales SAR (ISV 15% e ISV 18%) -->
          <div class="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right">
            <div class="flex justify-between">
              <span>Subtotal Gravable (15%):</span>
              <span>L. {{ completedSale?.subtotal?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>ISV (15%):</span>
              <span>L. {{ completedSale?.isv_15?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Subtotal Gravable (18%):</span>
              <span>L. 0.00</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>ISV (18%):</span>
              <span>L. 0.00</span>
            </div>
            <div class="flex justify-between font-bold" :class="(completedSale?.total_descuento > 0) ? 'text-emerald-800' : 'text-slate-500'">
              <span>Descuentos y Rebajas Otorgados:</span>
              <span>{{ (completedSale?.total_descuento > 0) ? `- L. ${completedSale.total_descuento.toFixed(2)}` : 'L. 0.00' }}</span>
            </div>
            <div class="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
              <span>TOTAL A PAGAR:</span>
              <span>L. {{ completedSale?.total?.toFixed(2) }}</span>
            </div>
            <div v-if="completedSale?.metodo_pago === 'MIXTO' && completedSale?.monto_efectivo > 0" class="flex justify-between text-[10px] text-slate-600 font-mono">
              <span>Recibido (Efectivo):</span>
              <span>L. {{ completedSale?.monto_recibido?.toFixed(2) }}</span>
            </div>
            <div v-else-if="completedSale?.metodo_pago === 'EFECTIVO'" class="flex justify-between text-[10px] text-slate-600 font-mono">
              <span>Recibido:</span>
              <span>L. {{ completedSale?.monto_recibido?.toFixed(2) }}</span>
            </div>
            <div v-if="completedSale?.cambio > 0" class="flex justify-between text-[10px] text-slate-800 font-bold font-mono">
              <span>Cambio Entregado:</span>
              <span>L. {{ completedSale?.cambio?.toFixed(2) }}</span>
            </div>
          </div>

          <div v-if="completedSale?.puntos_lealtad_ganados > 0" class="mt-3 text-center text-[10px] bg-rose-50 p-1.5 rounded text-rose-800">
            💎 ¡Has ganado {{ completedSale.puntos_lealtad_ganados }} puntos de lealtad en esta compra!
          </div>

          <div class="text-center mt-3 text-[9px] text-slate-400 whitespace-pre-line leading-relaxed">
            <p>{{ companyConfig?.mensaje_ticket_pie || '¡Gracias por tu compra en Ópalo Accesorios!\nNo se aceptan devoluciones sin este recibo.' }}</p>
          </div>
        </div>

        <!-- Acciones del Recibo -->
        <div class="w-full flex gap-2 mt-4">
          <button 
            @click="printReceipt" 
            class="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🖨️</span>
            <span>Imprimir Ticket</span>
          </button>
          <button 
            @click="closeReceiptModal" 
            class="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
          >
            Nueva Venta
          </button>
        </div>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 4: ASIGNAR CLIENTE O FACTURA CON RTN / QR LEALTAD                 -->
    <!-- ===================================================================== -->
    <div v-if="isCustomerModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-opalo-100 text-opalo-700 flex items-center justify-center font-bold text-sm">
              🧾
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Datos de Facturación / Cliente</h3>
              <p class="text-[11px] text-slate-500">Factura con Nombre y RTN o búsqueda en lealtad</p>
            </div>
          </div>
          <button @click="isCustomerModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">✕</button>
        </div>

        <!-- Selector de Pestaña -->
        <div class="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button 
            type="button"
            @click="customerModalTab = 'factura'"
            class="flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            :class="customerModalTab === 'factura' ? 'bg-white text-opalo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <span>📝 Factura con RTN</span>
          </button>
          <button 
            type="button"
            @click="customerModalTab = 'buscar'"
            class="flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            :class="customerModalTab === 'buscar' ? 'bg-white text-opalo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <span>🔍 Buscar / Escanear QR</span>
          </button>
        </div>

        <!-- PESTAÑA 1: Factura con Nombre y RTN -->
        <div v-if="customerModalTab === 'factura'" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Nombre o Razón Social del Cliente *
            </label>
            <input 
              v-model="invoiceCustomer.nombre" 
              type="text" 
              placeholder="Ej. Inversiones Honduras S.A. o Juan Pérez"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>RTN Hondureño (14 dígitos) *</span>
              <span class="text-[10px] text-slate-400 font-mono">{{ invoiceCustomer.rtn ? invoiceCustomer.rtn.length : 0 }}/14</span>
            </label>
            <input 
              v-model="invoiceCustomer.rtn" 
              type="text" 
              maxlength="14"
              placeholder="08011990123456"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Teléfono (Opcional)</label>
              <input 
                v-model="invoiceCustomer.telefono" 
                type="text" 
                placeholder="+504 9876-5432"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Dirección (Opcional)</label>
              <input 
                v-model="invoiceCustomer.direccion" 
                type="text" 
                placeholder="Tocoa, Colón"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>
          </div>

          <p v-if="customerFormError" class="text-xs text-rose-600 font-bold">
            ⚠️ {{ customerFormError }}
          </p>

          <div class="pt-2 flex gap-2">
            <button 
              type="button"
              @click="assignInvoiceCustomer" 
              :disabled="isSavingCustomer || !invoiceCustomer.nombre.trim()"
              class="flex-1 py-2.5 bg-opalo-600 hover:bg-opalo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>{{ isSavingCustomer ? 'Guardando...' : '✓ Asignar a Factura' }}</span>
            </button>
            <button 
              type="button"
              @click="assignCustomer(null)" 
              class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
            >
              Consumidor Final
            </button>
          </div>
        </div>

        <!-- PESTAÑA 2: Buscar en Catálogo / Escanear QR -->
        <div v-else class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Buscar por Nombre, RTN o Escanear QR</label>
            <input 
              v-model="customerQuery" 
              type="text" 
              placeholder="Buscar por nombre, RTN o código QR..."
              @keydown.enter="searchCustomer"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <button 
            type="button"
            @click="searchCustomer" 
            class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Buscar Cliente
          </button>

          <!-- Resultados de búsqueda -->
          <div v-if="customerResults.length > 0" class="max-h-48 overflow-y-auto space-y-2 pt-1">
            <div 
              v-for="c in customerResults" 
              :key="c.id"
              @click="assignCustomer(c)"
              class="p-2.5 rounded-xl border border-slate-200 hover:border-opalo-500 hover:bg-opalo-50/40 cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <p class="text-xs font-bold text-slate-900">{{ c.nombre }}</p>
                <p class="text-[10px] text-slate-500 font-mono">RTN/DNI: {{ c.rtn_dni || 'Sin documento' }}</p>
              </div>
              <span class="text-xs font-extrabold text-emerald-600">💎 {{ c.puntos_lealtad || 0 }} pts</span>
            </div>
          </div>
          <p v-else-if="customerSearched && customerResults.length === 0" class="text-xs text-slate-400 text-center py-2">
            No se encontró ningún cliente registrado. Puedes agregarlo en la pestaña "Factura con RTN".
          </p>

          <div class="pt-3 border-t border-slate-100 flex justify-between items-center">
            <button 
              type="button"
              @click="assignCustomer(null)" 
              class="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Usar Consumidor Final
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 5: SALIDAS DE EFECTIVO / CAJA CHICA (RETIROS DE DINERO)          -->
    <!-- ===================================================================== -->
    <div v-if="isCashOutModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        
        <!-- Cabecera del Modal -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shadow-xs">
              💸
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Salidas de Dinero / Efectivo</h3>
              <p class="text-[11px] text-slate-500">Registrar egreso de efectivo físico de la caja registradora</p>
            </div>
          </div>
          <button 
            type="button"
            @click="isCashOutModalOpen = false" 
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Resumen de Caja Actual -->
        <div class="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-slate-600 font-bold">Estado de Gaveta en Turno:</span>
            <span class="font-extrabold text-amber-900 font-mono">
              Disponible: L. {{ (cashShift?.turno?.total_esperado_caja || 0).toFixed(2) }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-amber-200/60 font-mono">
            <div>Fondo Inicial: <b class="text-slate-700 font-bold">L. {{ (cashShift?.turno?.monto_inicial || 0).toFixed(2) }}</b></div>
            <div>Ventas Ef.: <b class="text-emerald-700 font-bold">+L. {{ (cashShift?.turno?.ventas_efectivo || 0).toFixed(2) }}</b></div>
            <div>Salidas: <b class="text-rose-700 font-bold">-L. {{ (cashShift?.turno?.salidas_efectivo || 0).toFixed(2) }}</b></div>
          </div>
        </div>

        <!-- Pestañas de Navegación -->
        <div class="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button 
            type="button"
            @click="cashOutTab = 'new'" 
            class="flex-1 py-1.5 rounded-lg transition cursor-pointer"
            :class="cashOutTab === 'new' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
          >
            💸 Registrar Nueva Salida
          </button>
          <button 
            type="button"
            @click="openCashOutHistoryTab" 
            class="flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
            :class="cashOutTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
          >
            <span>📋 Salidas de Hoy</span>
            <span v-if="cashOutsList.length > 0" class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {{ cashOutsList.length }}
            </span>
          </button>
        </div>

        <!-- PESTAÑA 1: NUEVA SALIDA -->
        <div v-if="cashOutTab === 'new'" class="space-y-4 pt-1">
          
          <!-- Atajos de Monto -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Monto a Retirar en Efectivo *
            </label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button 
                v-for="amt in [50, 100, 200, 300, 500, 1000]" 
                :key="amt"
                type="button"
                @click="cashOutForm.monto = amt" 
                class="px-2.5 py-1 text-xs font-extrabold rounded-lg border transition cursor-pointer"
                :class="Number(cashOutForm.monto) === amt ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
              >
                + L. {{ amt }}
              </button>
            </div>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-base text-amber-600">L.</span>
              <input 
                v-model.number="cashOutForm.monto" 
                type="number" 
                step="0.01"
                min="0.01"
                placeholder="0.00"
                class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-extrabold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <!-- Atajos Rápidos de Motivos Habituales -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Concepto / Motivo de la Salida *
            </label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button 
                v-for="quick in quickCashOutReasons" 
                :key="quick.title"
                type="button"
                @click="setQuickReason(quick)"
                class="px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer"
                :class="cashOutForm.motivo === quick.title ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
              >
                {{ quick.emoji }} {{ quick.title }}
              </button>
            </div>
            <input 
              v-model="cashOutForm.motivo" 
              type="text" 
              placeholder="Ej: Pago flete de mercadería, compra de bolsas o empaques..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <!-- Categoría Financiera y Beneficiario -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Categoría Contable</label>
              <select 
                v-model="cashOutForm.categoria" 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="TRANSPORTE_FLETES">🚚 Transporte y Fletes</option>
                <option value="EMPAQUES_SUMINISTROS">📦 Empaques y Suministros</option>
                <option value="PAGO_PROVEEDORES">🤝 Pago a Proveedores</option>
                <option value="SERVICIOS_PUBLICOS">💡 Servicios Públicos / Tienda</option>
                <option value="MANTENIMIENTO">🔧 Mantenimiento y Limpieza</option>
                <option value="NOMINA_SALARIOS">👥 Nómina / Adelantos</option>
                <option value="OTROS">📌 Otros Egresos de Caja</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Entregado a (Beneficiario)</label>
              <input 
                v-model="cashOutForm.beneficiario" 
                type="text" 
                placeholder="Ej: Don Pedro (Repartidor)"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <!-- N° Comprobante y Notas Opcionales -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">N° Factura / Recibo Externo</label>
              <input 
                v-model="cashOutForm.numero_comprobante" 
                type="text" 
                placeholder="Opcional (Dejar vacío para auto)"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">Observaciones</label>
              <input 
                v-model="cashOutForm.notas" 
                type="text" 
                placeholder="Notas adicionales..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <p v-if="cashOutError" class="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            ⚠️ {{ cashOutError }}
          </p>

          <p v-if="cashOutSuccess" class="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            ✅ {{ cashOutSuccess }}
          </p>

          <!-- Botón de Confirmación -->
          <div class="pt-2 flex gap-2">
            <button 
              type="button"
              @click="submitCashOut" 
              :disabled="isSubmittingCashOut || !cashOutForm.monto || Number(cashOutForm.monto) <= 0 || !cashOutForm.motivo"
              class="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-600/30 flex items-center justify-center gap-2"
            >
              <span>{{ isSubmittingCashOut ? 'Guardando Salida...' : '💸 Confirmar Salida e Imprimir Vale' }}</span>
            </button>
            <button 
              type="button"
              @click="isCashOutModalOpen = false" 
              class="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>

        <!-- PESTAÑA 2: HISTORIAL DE SALIDAS DEL TURNO -->
        <div v-else class="space-y-3 pt-1">
          <div v-if="cashOutsList.length === 0" class="text-center py-8 text-slate-400">
            <span class="text-3xl block mb-2">🍃</span>
            <p class="text-xs font-semibold">No se han registrado salidas de efectivo en este turno.</p>
          </div>

          <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-1">
            <div 
              v-for="sal in cashOutsList" 
              :key="sal.id"
              class="p-3 bg-slate-50 hover:bg-amber-50/50 rounded-2xl border border-slate-200 flex items-center justify-between transition"
            >
              <div class="flex-1 pr-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-rose-700 font-mono">
                    - L. {{ parseFloat(sal.monto).toFixed(2) }}
                  </span>
                  <span class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    {{ sal.categoria }}
                  </span>
                </div>
                <p class="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">
                  {{ sal.descripcion }}
                </p>
                <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                  <span>{{ sal.numero_comprobante }}</span>
                  <span>•</span>
                  <span>{{ formatTime(sal.created_at) }}</span>
                  <span v-if="sal.usuario_nombre">• Cajero: {{ sal.usuario_nombre }}</span>
                </div>
              </div>

              <button 
                type="button"
                @click="printCashOutReceipt(sal)" 
                class="px-2.5 py-1.5 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                title="Reimprimir Vale Térmico de Salida"
              >
                <span>🖨️</span>
                <span>Vale</span>
              </button>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span class="text-slate-500 font-semibold">Total Salidas Registradas:</span>
            <span class="font-black text-rose-700 font-mono text-sm">
              - L. {{ cashOutsList.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0).toFixed(2) }}
            </span>
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
const mobilePosTab = ref('catalogo');

watch(() => companyConfig.value?.logo_url, () => {
  logoError.value = false;
});
const { 
  items, 
  customer, 
  subtotal, 
  isv, 
  isv15,
  isv18,
  hasIsv18,
  totalDescuento,
  total, 
  totalItemsCount, 
  addItem, 
  updateQuantity, 
  updateDiscount,
  removeItem, 
  clearCart, 
  setCustomer 
} = useCart();

const promptItemDiscount = (index) => {
  const item = items.value[index];
  if (!item) return;
  const maxDisc = item.precio_unitario * item.cantidad;
  const current = item.descuento || 0;
  const input = prompt(
    `Ingresa el descuento / rebaja en Lempiras para "${item.producto_nombre}" (Talla: ${item.talla}, Color: ${item.color})\nMáximo permitido: L. ${maxDisc.toFixed(2)}:`, 
    current > 0 ? current.toString() : ''
  );
  if (input !== null) {
    const val = parseFloat(input.trim() || '0');
    if (!isNaN(val) && val >= 0) {
      updateDiscount(index, Math.min(val, maxDisc));
    }
  }
};

// Estados reactivos
const products = ref([]);
const categories = ref([]);
const selectedCategoryId = ref(null);
const searchTerm = ref('');
const isLoadingProducts = ref(false);
const searchInputRef = ref(null);

// Modales
const isVariantModalOpen = ref(false);
const activeProduct = ref(null);

const isCheckoutModalOpen = ref(false);
const paymentMethod = ref('EFECTIVO');
const transferBank = ref('BAC Credomatic');
const cashReceived = ref(0);
const isSubmittingSale = ref(false);

const mixedPayment = reactive({
  efectivo: 0,
  tarjeta: 0,
  transferencia: 0,
  banco: 'BAC Credomatic',
  efectivoRecibido: 0
});

const mixedTotalCovered = computed(() => {
  const ef = parseFloat(mixedPayment.efectivo) || 0;
  const tar = parseFloat(mixedPayment.tarjeta) || 0;
  const tr = parseFloat(mixedPayment.transferencia) || 0;
  return parseFloat((ef + tar + tr).toFixed(2));
});

const mixedDifference = computed(() => {
  return parseFloat((total.value - mixedTotalCovered.value).toFixed(2));
});

const mixedChangeAmount = computed(() => {
  const ef = parseFloat(mixedPayment.efectivo) || 0;
  const rec = parseFloat(mixedPayment.efectivoRecibido) || 0;
  return parseFloat((rec - ef).toFixed(2));
});

const setPaymentMethod = (method) => {
  paymentMethod.value = method;
  if (method === 'MIXTO') {
    if (mixedTotalCovered.value === 0 && total.value > 0) {
      mixedPayment.efectivo = 0;
      mixedPayment.tarjeta = 0;
      mixedPayment.transferencia = 0;
      mixedPayment.efectivoRecibido = 0;
    }
  }
};

const fillMixedRemaining = (method) => {
  const currentTotal = total.value;
  if (method === 'efectivo') {
    const others = (parseFloat(mixedPayment.tarjeta) || 0) + (parseFloat(mixedPayment.transferencia) || 0);
    const rem = Math.max(0, parseFloat((currentTotal - others).toFixed(2)));
    mixedPayment.efectivo = rem;
    if (!mixedPayment.efectivoRecibido || mixedPayment.efectivoRecibido < rem) {
      mixedPayment.efectivoRecibido = rem;
    }
  } else if (method === 'tarjeta') {
    const others = (parseFloat(mixedPayment.efectivo) || 0) + (parseFloat(mixedPayment.transferencia) || 0);
    mixedPayment.tarjeta = Math.max(0, parseFloat((currentTotal - others).toFixed(2)));
  } else if (method === 'transferencia') {
    const others = (parseFloat(mixedPayment.efectivo) || 0) + (parseFloat(mixedPayment.tarjeta) || 0);
    mixedPayment.transferencia = Math.max(0, parseFloat((currentTotal - others).toFixed(2)));
  }
};

const isReceiptModalOpen = ref(false);
const completedSale = ref(null);

const isCustomerModalOpen = ref(false);
const customerQuery = ref('');
const customerResults = ref([]);
const customerSearched = ref(false);
const customerModalTab = ref('factura');
const isSavingCustomer = ref(false);
const customerFormError = ref('');

const invoiceCustomer = reactive({
  nombre: '',
  rtn: '',
  telefono: '',
  direccion: ''
});

// Estado de Turno de Caja y Salidas de Efectivo
const cashShift = ref(null);
const isCashOutModalOpen = ref(false);
const cashOutTab = ref('new'); // 'new' | 'history'
const cashOutsList = ref([]);
const isSubmittingCashOut = ref(false);
const cashOutError = ref('');
const cashOutSuccess = ref('');

const cashOutForm = reactive({
  monto: '',
  motivo: '',
  categoria: 'OTROS',
  beneficiario: '',
  numero_comprobante: '',
  notas: ''
});

const quickCashOutReasons = [
  { title: 'Flete / Transporte', emoji: '🚚', cat: 'TRANSPORTE_FLETES' },
  { title: 'Empaques y Bolsas', emoji: '📦', cat: 'EMPAQUES_SUMINISTROS' },
  { title: 'Limpieza y Tienda', emoji: '🧹', cat: 'MANTENIMIENTO' },
  { title: 'Pago a Proveedor', emoji: '🤝', cat: 'PAGO_PROVEEDORES' },
  { title: 'Retiro a Bóveda', emoji: '🏦', cat: 'OTROS' },
  { title: 'Almuerzo / Viáticos', emoji: '🍱', cat: 'OTROS' }
];

// Cambio a devolver
const changeAmount = computed(() => {
  return parseFloat((cashReceived.value - total.value).toFixed(2));
});

// Formateo de URL de imagen para el catálogo
const formatImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const config = useRuntimeConfig();
  const backendBase = config.public.apiBase ? config.public.apiBase.replace('/api/v1', '') : 'http://localhost:4000';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Cargar Categorías
const loadCategories = async () => {
  try {
    const res = await apiFetch('/categorias?estado=ACTIVO');
    if (res.success) {
      categories.value = res.data;
    }
  } catch (err) {
    console.error('Error cargando categorías', err);
  }
};

// Cargar Productos
const loadProducts = async () => {
  isLoadingProducts.value = true;
  try {
    let url = '/productos?estado=ACTIVO&limit=50';
    if (selectedCategoryId.value) {
      url += `&categoria_id=${selectedCategoryId.value}`;
    }
    if (searchTerm.value) {
      url += `&search=${encodeURIComponent(searchTerm.value)}`;
    }
    const res = await apiFetch(url);
    if (res.success) {
      products.value = res.data;
    }
  } catch (err) {
    console.error('Error cargando productos', err);
  } finally {
    isLoadingProducts.value = false;
  }
};

const selectCategory = (catId) => {
  selectedCategoryId.value = catId;
  loadProducts();
};

// Manejo de clic en producto
const onProductClick = (prod) => {
  if (prod.variantes && prod.variantes.length > 1) {
    activeProduct.value = prod;
    isVariantModalOpen.value = true;
  } else if (prod.variantes && prod.variantes.length === 1) {
    const res = addItem(prod.variantes[0], prod, 1);
    if (!res.success) alert(res.message);
  }
};

// Selección de variante desde el modal
const selectVariantAndAdd = (variante) => {
  if (variante.stock <= 0) return;
  const res = addItem(variante, activeProduct.value, 1);
  if (!res.success) {
    alert(res.message);
  } else {
    isVariantModalOpen.value = false;
  }
};

// Escáner de código de barras o búsqueda rápida
const handleBarcodeOrSearch = async () => {
  const term = searchTerm.value.trim();
  if (!term) return;

  try {
    // 1. Intentar buscar como código de barras / SKU directo para caja
    const barcodeRes = await apiFetch(`/productos/buscar/codigo?term=${encodeURIComponent(term)}`);
    if (barcodeRes.success && barcodeRes.data) {
      const v = barcodeRes.data;
      const res = addItem(
        {
          id: v.variante_id,
          talla: v.talla,
          color: v.color,
          sku: v.sku,
          precio_venta: v.precio_venta,
          stock: v.stock
        },
        {
          id: v.producto_id,
          nombre: v.producto_nombre,
          precio_base: v.precio_venta
        },
        1
      );
      if (res.success) {
        searchTerm.value = '';
        return;
      }
    }
  } catch (e) {
    // No fue código exacto, filtrar por catálogo de texto
  }

  loadProducts();
};

// Apertura del modal de cobro
const openCheckoutModal = () => {
  cashReceived.value = total.value;
  mixedPayment.efectivo = 0;
  mixedPayment.tarjeta = 0;
  mixedPayment.transferencia = 0;
  mixedPayment.efectivoRecibido = 0;
  isCheckoutModalOpen.value = true;
};

// Procesar Venta en el Backend
const submitSale = async () => {
  isSubmittingSale.value = true;
  try {
    let payloadMetodo = paymentMethod.value;
    let finalEfectivo = 0;
    let finalTarjeta = 0;
    let finalTransf = 0;
    let finalBanco = null;
    let finalMontoRecibido = total.value;

    if (payloadMetodo === 'MIXTO') {
      finalEfectivo = parseFloat(mixedPayment.efectivo) || 0;
      finalTarjeta = parseFloat(mixedPayment.tarjeta) || 0;
      finalTransf = parseFloat(mixedPayment.transferencia) || 0;
      finalBanco = finalTransf > 0 ? mixedPayment.banco : null;
      finalMontoRecibido = finalEfectivo > 0 
        ? (parseFloat(mixedPayment.efectivoRecibido) || finalEfectivo) 
        : total.value;
    } else if (payloadMetodo === 'EFECTIVO') {
      finalEfectivo = total.value;
      finalMontoRecibido = cashReceived.value;
    } else if (payloadMetodo === 'TARJETA') {
      finalTarjeta = total.value;
      finalMontoRecibido = total.value;
    } else if (payloadMetodo === 'TRANSFERENCIA') {
      finalTransf = total.value;
      finalBanco = transferBank.value;
      finalMontoRecibido = total.value;
    }

    const payload = {
      cliente_id: customer.value ? customer.value.id : null,
      metodo_pago: payloadMetodo,
      monto_efectivo: finalEfectivo,
      monto_tarjeta: finalTarjeta,
      monto_transferencia: finalTransf,
      banco_transferencia: finalBanco,
      monto_recibido: finalMontoRecibido,
      items: items.value.map(i => ({
        variante_id: i.variante_id,
        cantidad: i.cantidad,
        descuento: i.descuento || 0
      }))
    };

    const res = await apiFetch('/ventas', {
      method: 'POST',
      body: payload
    });

    if (res.success) {
      completedSale.value = res.data;
      isCheckoutModalOpen.value = false;
      isReceiptModalOpen.value = true;
      clearCart();
      loadProducts(); // Actualizar stock visual
    }
  } catch (err) {
    alert(err?.data?.message || 'Error al procesar la venta en caja');
  } finally {
    isSubmittingSale.value = false;
  }
};

const printThermalDocument = (htmlContent, title = 'Impresión') => {
  // Buscar o crear iframe dedicado exclusivamente a la impresión del ticket térmico
  let printFrame = document.getElementById('receipt-print-frame');
  if (printFrame) {
    printFrame.remove();
  }

  printFrame = document.createElement('iframe');
  printFrame.id = 'receipt-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '80mm';
  printFrame.style.height = '600px';
  printFrame.style.border = 'none';
  printFrame.style.opacity = '0.01'; // Permite que el motor de renderizado de Chromium procese el documento sin dejarlo en blanco
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
        @page {
          size: 80mm auto;
          margin: 0;
        }
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
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        img {
          max-height: 48px;
          max-width: 140px;
          display: block;
          margin: 0 auto 6px auto;
          filter: grayscale(100%);
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-4 { gap: 16px; }
        .border-t { border-top: 1px solid #cbd5e1; }
        .border-b { border-bottom: 1px solid #cbd5e1; }
        .border-b-2 { border-bottom: 2px solid #111827; }
        .border-dashed { border-style: dashed; }
        .border-dotted { border-style: dotted; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
        .py-2 { padding-top: 8px; padding-bottom: 8px; }
        .p-2 { padding: 8px; }
        .my-1 { margin-top: 4px; margin-bottom: 4px; }
        .my-1\\.5 { margin-top: 6px; margin-bottom: 6px; }
        .my-2 { margin-top: 8px; margin-bottom: 8px; }
        .pt-1 { padding-top: 4px; }
        .pt-2 { padding-top: 8px; }
        .pt-4 { padding-top: 16px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .mt-1 { margin-top: 4px; }
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }
        .mt-4 { margin-top: 16px; }
        .mt-8 { margin-top: 32px; }
        .text-xs { font-size: 12px; }
        .text-sm { font-size: 13px; }
        .text-\\[10px\\] { font-size: 10px; }
        .text-\\[9px\\] { font-size: 9px; }
        .text-\\[8px\\] { font-size: 8px; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .tracking-tight { letter-spacing: -0.025em; }
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .shrink-0 { flex-shrink: 0; }
        .break-all { word-break: break-all; }
        .whitespace-pre-line { white-space: pre-line; }
        .space-y-1 > * + * { margin-top: 4px; }
        .space-y-1\\.5 > * + * { margin-top: 6px; }
        .space-y-0\\.5 > * + * { margin-top: 2px; }
        .pl-2 { padding-left: 8px; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  doc.close();

  // Esperar a que se procese el renderizado y el logo antes de disparar la impresión
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

const printReceipt = () => {
  const receiptEl = document.getElementById('thermal-receipt');
  if (!receiptEl) {
    window.print();
    return;
  }
  printThermalDocument(receiptEl.innerHTML, `Ticket de Venta - ${completedSale.value?.numero_factura || 'Comprobante'}`);
};

const printCashOutReceipt = (sal) => {
  const logoHtml = companyConfig.value?.logo_url 
    ? `<img src="${getFullLogoUrl(companyConfig.value.logo_url)}" alt="Logo" />` 
    : '';

  const slipHtml = `
    <div class="text-center mb-2">
      ${logoHtml}
      <h2 class="text-xs font-black tracking-tight">${companyConfig.value?.nombre_empresa || 'ÓPALO ACCESORIOS'}</h2>
      <p class="text-[9px] text-slate-500">${companyConfig.value?.direccion || companyConfig.value?.ciudad || 'Tocoa, Colón • Honduras'}</p>
      <div class="my-1.5 py-1 border-t border-b border-dashed border-slate-300">
        <h3 class="text-xs font-black uppercase tracking-wider">VALE DE SALIDA DE EFECTIVO</h3>
        <p class="text-[9px] font-bold">EGRESO DE CAJA POS / GAVETA</p>
      </div>
      <p class="text-[10px] font-bold">Comprobante: ${sal.numero_comprobante || 'VALE-' + sal.id}</p>
      <p class="text-[9px] text-slate-500">${new Date(sal.created_at || Date.now()).toLocaleString('es-HN')}</p>
    </div>

    <div class="border-t border-b border-dashed border-slate-200 py-1.5 my-2 text-[10px] space-y-0.5">
      <div class="flex justify-between">
        <span class="font-bold">Cajero(a):</span>
        <span>${sal.usuario_nombre || user.value?.nombre || 'Cajero'}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Beneficiario:</span>
        <span>${sal.beneficiario || 'No especificado'}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Categoría:</span>
        <span>${sal.categoria || 'OTROS'}</span>
      </div>
    </div>

    <div class="my-2 p-2 bg-slate-50 border border-slate-200 rounded">
      <p class="text-[9px] text-slate-500 uppercase font-bold">Concepto / Motivo:</p>
      <p class="text-[10px] font-bold text-slate-900 break-all">${sal.descripcion || sal.motivo || 'Salida de dinero de caja'}</p>
      ${sal.notas ? `<p class="text-[8px] text-slate-400 mt-1 italic">${sal.notas}</p>` : ''}
    </div>

    <div class="border-t border-b-2 border-slate-900 py-2 my-2 flex justify-between items-center">
      <span class="text-xs font-black">TOTAL ENTREGADO:</span>
      <span class="text-sm font-black font-mono">L. ${parseFloat(sal.monto || 0).toFixed(2)}</span>
    </div>

    <!-- Firmas de Respaldo -->
    <div class="mt-8 pt-4 grid grid-cols-2 gap-4 text-center text-[9px]">
      <div>
        <div class="border-t border-slate-400 pt-1">
          <p class="font-bold">Entregado por</p>
          <p class="text-[8px] text-slate-400">Firma del Cajero</p>
        </div>
      </div>
      <div>
        <div class="border-t border-slate-400 pt-1">
          <p class="font-bold">Recibido por</p>
          <p class="text-[8px] text-slate-400">Firma de Recibido</p>
        </div>
      </div>
    </div>

    <div class="text-center mt-4 text-[8px] text-slate-400">
      <p>Comprobante de Egreso Interno de Caja Registradora</p>
      <p>Conserve este vale firmado para el arqueo de cierre de turno</p>
    </div>
  `;

  printThermalDocument(slipHtml, `Vale de Salida - ${sal.numero_comprobante || sal.id}`);
};

// Métodos de Salida de Efectivo
const fetchCashShiftStatus = async () => {
  try {
    const res = await apiFetch('/caja/estado');
    if (res && res.success && res.data) {
      cashShift.value = res.data;
    }
  } catch (err) {
    console.warn('Error al consultar estado de caja:', err);
  }
};

const openCashOutModal = () => {
  cashOutTab.value = 'new';
  cashOutError.value = '';
  cashOutSuccess.value = '';
  cashOutForm.monto = '';
  cashOutForm.motivo = '';
  cashOutForm.categoria = 'TRANSPORTE_FLETES';
  cashOutForm.beneficiario = '';
  cashOutForm.numero_comprobante = '';
  cashOutForm.notas = '';
  fetchCashShiftStatus();
  fetchShiftCashOuts();
  isCashOutModalOpen.value = true;
};

const openCashOutHistoryTab = async () => {
  cashOutTab.value = 'history';
  await fetchShiftCashOuts();
};

const fetchShiftCashOuts = async () => {
  try {
    const res = await apiFetch('/caja/salidas');
    if (res && res.success && res.data) {
      cashOutsList.value = res.data;
    }
  } catch (err) {
    console.error('Error cargando salidas de caja:', err);
  }
};

const setQuickReason = (quick) => {
  cashOutForm.motivo = quick.title;
  if (quick.cat) {
    cashOutForm.categoria = quick.cat;
  }
};

const submitCashOut = async () => {
  const montoNum = parseFloat(cashOutForm.monto);
  if (!montoNum || isNaN(montoNum) || montoNum <= 0) {
    cashOutError.value = 'Ingresa un monto válido mayor a L. 0.00';
    return;
  }
  if (!cashOutForm.motivo || !cashOutForm.motivo.trim()) {
    cashOutError.value = 'Especifica el motivo de la salida de dinero';
    return;
  }

  isSubmittingCashOut.value = true;
  cashOutError.value = '';
  cashOutSuccess.value = '';

  try {
    const res = await apiFetch('/caja/salida', {
      method: 'POST',
      body: {
        monto: montoNum,
        motivo: cashOutForm.motivo.trim(),
        categoria: cashOutForm.categoria,
        beneficiario: cashOutForm.beneficiario ? cashOutForm.beneficiario.trim() : null,
        numero_comprobante: cashOutForm.numero_comprobante ? cashOutForm.numero_comprobante.trim() : null,
        notas: cashOutForm.notas ? cashOutForm.notas.trim() : null
      }
    });

    if (res && res.success && res.data) {
      cashOutSuccess.value = `¡Salida registrada exitosamente por L. ${montoNum.toFixed(2)}!`;
      await fetchCashShiftStatus();
      await fetchShiftCashOuts();
      
      // Imprimir vale térmico de 80mm
      printCashOutReceipt(res.data);

      setTimeout(() => {
        cashOutSuccess.value = '';
        cashOutTab.value = 'history';
      }, 1500);
    } else {
      cashOutError.value = res?.message || 'Error al registrar la salida';
    }
  } catch (err) {
    cashOutError.value = err?.data?.message || err?.message || 'Error al registrar salida de efectivo';
  } finally {
    isSubmittingCashOut.value = false;
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const closeReceiptModal = () => {
  isReceiptModalOpen.value = false;
  completedSale.value = null;
  searchInputRef.value?.focus();
};

// Búsqueda y Asignación de Clientes / Factura con RTN
const openCustomerModal = () => {
  customerFormError.value = '';
  customerSearched.value = false;
  if (customer.value) {
    invoiceCustomer.nombre = customer.value.nombre || '';
    invoiceCustomer.rtn = customer.value.rtn_dni || '';
    invoiceCustomer.telefono = customer.value.telefono || '';
    invoiceCustomer.direccion = customer.value.direccion || '';
  } else {
    invoiceCustomer.nombre = '';
    invoiceCustomer.rtn = '';
    invoiceCustomer.telefono = '';
    invoiceCustomer.direccion = '';
  }
  customerModalTab.value = 'factura';
  isCustomerModalOpen.value = true;
};

const assignInvoiceCustomer = async () => {
  if (!invoiceCustomer.nombre || !invoiceCustomer.nombre.trim()) {
    customerFormError.value = 'El nombre o razón social del cliente es obligatorio.';
    return;
  }

  isSavingCustomer.value = true;
  customerFormError.value = '';

  try {
    const res = await apiFetch('/clientes', {
      method: 'POST',
      body: {
        nombre: invoiceCustomer.nombre.trim(),
        rtn_dni: invoiceCustomer.rtn ? invoiceCustomer.rtn.trim() : null,
        telefono: invoiceCustomer.telefono ? invoiceCustomer.telefono.trim() : null,
        direccion: invoiceCustomer.direccion ? invoiceCustomer.direccion.trim() : null
      }
    });

    if (res && res.success && res.data) {
      setCustomer(res.data);
      isCustomerModalOpen.value = false;
    } else {
      customerFormError.value = res?.message || 'Error al asignar el cliente a la factura';
    }
  } catch (err) {
    customerFormError.value = err?.data?.message || err?.message || 'Error al registrar cliente';
  } finally {
    isSavingCustomer.value = false;
  }
};

const searchCustomer = async () => {
  if (!customerQuery.value) return;
  customerSearched.value = true;
  try {
    const res = await apiFetch(`/clientes?search=${encodeURIComponent(customerQuery.value)}`);
    if (res && res.success) {
      customerResults.value = res.data || [];
    }
  } catch (err) {
    console.error('Error buscando cliente:', err);
  }
};

const assignCustomer = (c) => {
  setCustomer(c);
  isCustomerModalOpen.value = false;
  customerQuery.value = '';
  customerResults.value = [];
  customerSearched.value = false;
};

onMounted(() => {
  loadCategories();
  loadProducts();
  fetchCashShiftStatus();
  searchInputRef.value?.focus();

  // Escuchar eventos en tiempo real desde la App Móvil u otras cajas
  onEvent('pos:sale_created', (sale) => {
    loadProducts();
    fetchCashShiftStatus();
  });

  onEvent('pos:stock_updated', () => {
    loadProducts();
  });

  onEvent('pos:product_created', () => {
    loadProducts();
  });

  onEvent('pos:salida_caja', () => {
    fetchCashShiftStatus();
    fetchShiftCashOuts();
  });

  onEvent('pos:caja_abierta', () => {
    fetchCashShiftStatus();
  });

  onEvent('pos:caja_cerrada', () => {
    fetchCashShiftStatus();
  });
});
</script>

<style>
@media print {
  /* En caso de disparar Ctrl+P directamente en la ventana */
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #ffffff !important;
  }
  .h-screen {
    height: auto !important;
    overflow: visible !important;
  }
  body * {
    visibility: hidden;
  }
  #thermal-receipt, #thermal-receipt *,
  #receipt-print-frame {
    visibility: visible !important;
  }
  #receipt-print-frame {
    display: block !important;
    opacity: 1 !important;
    position: static !important;
  }
  #thermal-receipt {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 80mm !important;
    margin: 0 !important;
    padding: 4mm !important;
    background: #ffffff !important;
    color: #000000 !important;
    z-index: 999999 !important;
  }
}
</style>

