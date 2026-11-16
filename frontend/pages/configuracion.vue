<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">

    <!-- Encabezado de la Página -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
      <div>
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-opalo-600 to-rose-400 flex items-center justify-center text-white text-2xl shadow-md shadow-opalo-200 shrink-0">
            ⚙️
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Configuración del Sistema & Negocio</h1>
              <span class="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-opalo-50 text-opalo-700 border border-opalo-200">
                Administración
              </span>
            </div>
            <p class="text-xs sm:text-sm text-slate-500 font-medium">
              Administra el logotipo institucional, nombre comercial, RTN oficial y parámetros de facturación reflejados en todo el POS.
            </p>
          </div>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          @click="resetFormToSaved"
          type="button"
          class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
          :disabled="isSaving"
        >
          Deshacer Cambios
        </button>
        <button
          @click="handleSave"
          type="button"
          class="px-6 py-2.5 bg-opalo-600 hover:bg-opalo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-opalo-200 hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          :disabled="isSaving"
        >
          <span v-if="isSaving" class="animate-spin text-base">⏳</span>
          <span v-else class="text-base">💾</span>
          <span>{{ isSaving ? 'Guardando...' : 'Guardar Configuración' }}</span>
        </button>
      </div>
    </div>

    <!-- Alerta de Notificación / Toast -->
    <div 
      v-if="notification.show" 
      class="p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between shadow-xs"
      :class="notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'"
    >
      <div class="flex items-center space-x-3">
        <span class="text-2xl">{{ notification.type === 'success' ? '✅' : '⚠️' }}</span>
        <div>
          <p class="font-bold text-sm">{{ notification.title }}</p>
          <p class="text-xs opacity-90">{{ notification.message }}</p>
        </div>
      </div>
      <button @click="notification.show = false" class="text-slate-400 hover:text-slate-700 font-bold text-lg p-1">
        ✕
      </button>
    </div>

    <!-- Pestañas de Navegación de Configuración -->
    <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
      <button
        v-for="tab in configTabs"
        :key="tab.id"
        @click="activeConfigTab = tab.id"
        class="px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 cursor-pointer"
        :class="activeConfigTab === tab.id 
          ? 'bg-slate-900 text-white shadow-xs' 
          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'"
      >
        <span>{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Contenido Principal: Formulario y Vista Previa en Vivo -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- COLUMNA IZQUIERDA: FORMULARIOS DE CONFIGURACIÓN (7 Cols) -->
      <div class="lg:col-span-7 space-y-6">

        <!-- ================================================================================= -->
        <!-- SECCIÓN 1: CONFIGURACIONES DEL SISTEMA & LOGOTIPO INSTITUCIONAL                   -->
        <!-- ================================================================================= -->
        <div 
          v-if="activeConfigTab === 'sistema' || activeConfigTab === 'todos'" 
          class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🏢</span>
              <div>
                <h2 class="text-base font-black text-slate-900">Configuraciones del Sistema & Logotipo</h2>
                <p class="text-xs text-slate-400">
                  Sube el logotipo oficial y define la identidad empresarial reflejada en el Login, Navbar y Documentos.
                </p>
              </div>
            </div>
            <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg border border-indigo-200">
              Sistema & Branding
            </span>
          </div>

          <!-- ÁREA DE SUBIDA Y GESTIÓN DE LOGOTIPO -->
          <div 
            class="p-5 bg-gradient-to-br from-slate-50 via-white to-rose-50/40 border-2 border-dashed rounded-3xl transition"
            :class="dragOver ? 'border-opalo-500 bg-opalo-50/30' : 'border-slate-300'"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleLogoDrop"
          >
            <div class="flex flex-col sm:flex-row items-center gap-6">
              
              <!-- Contenedor del Logo con Previsualizador -->
              <div class="relative group shrink-0">
                <div class="w-28 h-28 rounded-2xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden p-2 shadow-sm">
                  <img
                    v-if="formData.logo_url && !logoLoadError"
                    :src="getFullLogoUrl(formData.logo_url)"
                    alt="Logo Empresa"
                    class="w-full h-full object-contain"
                    @error="logoLoadError = true"
                  />
                  <div v-else class="text-center text-slate-400">
                    <span class="text-4xl block">🖼️</span>
                    <span class="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {{ logoLoadError ? 'Error de carga' : 'Sin Logo' }}
                    </span>
                  </div>
                </div>

                <!-- Botón Flotante para Eliminar Logo si existe -->
                <button
                  v-if="formData.logo_url"
                  @click="handleRemoveLogo"
                  type="button"
                  title="Eliminar logotipo y volver al icono por defecto"
                  class="absolute -top-2 -right-2 w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs shadow-md transition cursor-pointer"
                  :disabled="isUploadingLogo"
                >
                  ✕
                </button>
              </div>

              <!-- Controles de Carga y Especificaciones -->
              <div class="flex-1 text-center sm:text-left space-y-2">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <p class="text-xs font-black text-slate-900">Logotipo Oficial de la Empresa</p>
                  <span 
                    v-if="formData.logo_url" 
                    class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200"
                  >
                    ✓ Activo en el Sistema
                  </span>
                  <span 
                    v-else 
                    class="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    Usando icono por defecto
                  </span>
                </div>

                <p class="text-[11px] text-slate-500 leading-relaxed">
                  Arrastra tu archivo aquí o haz clic en seleccionar. Formatos permitidos: <strong>PNG, JPG, WEBP o SVG</strong> (fondo transparente recomendado, 512x512 px).
                </p>

                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                  <label class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                    <span v-if="isUploadingLogo" class="animate-spin">⏳</span>
                    <span v-else>📁</span>
                    <span>{{ isUploadingLogo ? 'Subiendo Logotipo...' : 'Seleccionar Imagen' }}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      class="hidden"
                      @change="handleLogoFileSelect"
                      :disabled="isUploadingLogo"
                    />
                  </label>

                  <button
                    v-if="formData.logo_url"
                    type="button"
                    @click="handleRemoveLogo"
                    class="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs rounded-xl transition cursor-pointer"
                    :disabled="isUploadingLogo"
                  >
                    Quitar Logo
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Campos: Razón Social y Nombre Comercial -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Nombre de la Empresa / Razón Social <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.nombre_empresa"
                type="text"
                placeholder="Ej: ÓPALO ACCESORIOS S. DE R.L."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Nombre Comercial
              </label>
              <input
                v-model="formData.nombre_comercial"
                type="text"
                placeholder="Ej: Ópalo"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- CAMPO DESTACADO: RTN HONDUREÑO -->
          <div class="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5">
                <span>🇭🇳</span>
                <span>RTN de la Empresa (Registro Tributario Nacional)</span>
                <span class="text-rose-600 font-bold">*</span>
              </label>
              <span
                class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full"
                :class="isRtnValid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'"
              >
                {{ cleanRtnDigits.length }} / 14 dígitos {{ isRtnValid ? '✓ Válido' : '(Incompleto)' }}
              </span>
            </div>

            <div class="relative">
              <input
                v-model="formData.rtn"
                @input="formatRtnInput"
                type="text"
                maxlength="16"
                placeholder="0209-1995-001230"
                class="w-full px-4 py-3 rounded-xl border-2 font-mono font-bold text-base text-slate-900 tracking-wider bg-white focus:outline-none transition shadow-xs"
                :class="isRtnValid ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-400' : 'border-purple-300 focus:ring-2 focus:ring-purple-400'"
              />
              <span class="absolute right-3 top-3 text-lg">
                {{ isRtnValid ? '🛡️' : '📝' }}
              </span>
            </div>

            <p class="text-[11px] text-purple-700">
              Número de 14 dígitos asignado por el SAR de Honduras. Se imprimirá en el encabezado de todas las facturas y comprobantes térmicos.
            </p>
          </div>

        </div>

        <!-- ================================================================================= -->
        <!-- SECCIÓN 2: CONTACTO Y UBICACIÓN FÍSICA                                           -->
        <!-- ================================================================================= -->
        <div 
          v-if="activeConfigTab === 'contacto' || activeConfigTab === 'todos'" 
          class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
        >
          <div class="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span class="text-2xl">📍</span>
            <div>
              <h2 class="text-base font-black text-slate-900">Ubicación & Contacto Comercial</h2>
              <p class="text-xs text-slate-400">Datos mostrados en el pie del ticket y en los reportes de ventas</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Teléfono / WhatsApp de Atención
              </label>
              <input
                v-model="formData.telefono"
                type="text"
                placeholder="+504 9876-5432"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Correo Electrónico
              </label>
              <input
                v-model="formData.email"
                type="email"
                placeholder="contacto@opalo.hn"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Dirección del Local / Sucursal
              </label>
              <input
                v-model="formData.direccion"
                type="text"
                placeholder="Barrio El Centro, Calle Principal, frente a Parque Central"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Ciudad y Departamento
              </label>
              <input
                v-model="formData.ciudad"
                type="text"
                placeholder="Tocoa, Colón"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                País
              </label>
              <input
                v-model="formData.pais"
                type="text"
                placeholder="Honduras"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>
          </div>
        </div>

        <!-- ================================================================================= -->
        <!-- SECCIÓN 3: PARÁMETROS FISCALES SAR & MONEDA                                      -->
        <!-- ================================================================================= -->
        <div 
          v-if="activeConfigTab === 'fiscal' || activeConfigTab === 'todos'" 
          class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
        >
          <div class="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span class="text-2xl">🏛️</span>
            <div>
              <h2 class="text-base font-black text-slate-900">Parámetros Fiscales & SAR</h2>
              <p class="text-xs text-slate-400">Datos para facturación formal y cumplimiento tributario</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Código CAI (SAR)
              </label>
              <input
                v-model="formData.cai_sar"
                type="text"
                placeholder="E54D7A-B981F2-9942B5-17C3D8-72AE10-94"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500 uppercase"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Rango Autorizado SAR
              </label>
              <input
                v-model="formData.rango_autorizado_sar"
                type="text"
                placeholder="000-001-01-00000001 a 000-001-01-00050000"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Fecha Límite de Emisión (SAR)
              </label>
              <input
                v-model="formData.fecha_limite_emision"
                type="date"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Impuesto Sobre Ventas General (ISV 15%)
              </label>
              <div class="relative">
                <input
                  v-model.number="formData.isv_porcentaje"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
                />
                <span class="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5">Tasa general de Honduras para ropa y accesorios</p>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center justify-between">
                <span>ISV Especial SAR (18%)</span>
                <span class="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-bold">Especial</span>
              </label>
              <div class="relative">
                <input
                  v-model.number="formData.isv_18_porcentaje"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
                />
                <span class="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5">Línea fiscal requerida por el SAR</p>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase text-slate-600 mb-1">
                Símbolo de Moneda
              </label>
              <input
                v-model="formData.moneda_simbolo"
                type="text"
                placeholder="L."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500"
              />
            </div>
          </div>
        </div>

        <!-- ================================================================================= -->
        <!-- SECCIÓN 4: MENSAJE AL PIE DEL TICKET                                              -->
        <!-- ================================================================================= -->
        <div 
          v-if="activeConfigTab === 'ticket' || activeConfigTab === 'todos'" 
          class="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3"
        >
          <div class="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <span class="text-2xl">🧾</span>
            <div>
              <h2 class="text-base font-black text-slate-900">Pie de Página del Ticket Térmico</h2>
              <p class="text-xs text-slate-400">Políticas de garantía, cambios y mensaje de agradecimiento</p>
            </div>
          </div>

          <div>
            <textarea
              v-model="formData.mensaje_ticket_pie"
              rows="3"
              placeholder="¡Gracias por su compra en Ópalo Accesorios! No se aceptan devoluciones sin este recibo."
              class="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-opalo-500 leading-relaxed"
            ></textarea>
            <p class="text-[11px] text-slate-400 mt-1">
              Este texto se imprimirá al final de cada ticket de 80mm entregado a los clientes.
            </p>
          </div>
        </div>

      </div>

      <!-- ================================================================================= -->
      <!-- COLUMNA DERECHA: PREVISUALIZADOR MULTI-PANTALLA EN TIEMPO REAL (5 Cols)          -->
      <!-- ================================================================================= -->
      <div class="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
        
        <div class="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
          
          <!-- Encabezado del Previsualizador -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2">
              <span class="text-xl">👁️</span>
              <h3 class="text-sm font-black tracking-wide uppercase text-slate-200">
                Vistas del Logotipo en Vivo
              </h3>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Tiempo Real
            </span>
          </div>

          <!-- Selector de Pantallas de Previsualización -->
          <div class="grid grid-cols-4 gap-1 p-1 bg-slate-800/80 rounded-2xl text-[11px] font-bold">
            <button
              v-for="pv in previewModes"
              :key="pv.id"
              @click="activePreviewMode = pv.id"
              class="py-1.5 px-1 rounded-xl transition cursor-pointer text-center flex flex-col items-center gap-0.5"
              :class="activePreviewMode === pv.id ? 'bg-indigo-600 text-white font-black shadow-xs' : 'text-slate-400 hover:text-white'"
            >
              <span>{{ pv.icon }}</span>
              <span class="truncate">{{ pv.label }}</span>
            </button>
          </div>

          <!-- ============================================================================= -->
          <!-- 1. VISTA: PANTALLA DE LOGIN (INICIO DE SESIÓN)                                -->
          <!-- ============================================================================= -->
          <div v-if="activePreviewMode === 'login'" class="bg-gradient-to-br from-rose-50 to-pink-100 p-5 rounded-2xl text-slate-800 space-y-3 border border-rose-200/50">
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-rose-100/80 text-center space-y-2">
              <div class="flex justify-center">
                <img
                  v-if="formData.logo_url && !logoLoadError"
                  :src="getFullLogoUrl(formData.logo_url)"
                  alt="Logo Login"
                  class="h-12 max-w-[140px] object-contain rounded-xl p-1 bg-white border border-rose-100 shadow-2xs"
                  @error="logoLoadError = true"
                />
                <div v-else class="w-12 h-12 rounded-xl bg-gradient-to-tr from-opalo-600 to-rose-400 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
                  {{ (formData.nombre_empresa || 'Ó')[0].toUpperCase() }}
                </div>
              </div>
              <div>
                <h4 class="font-black text-xs text-slate-900 uppercase tracking-tight">
                  {{ formData.nombre_empresa || 'ÓPALO ACCESORIOS' }}
                </h4>
                <p class="text-[9px] uppercase font-bold text-opalo-700 tracking-wider">
                  {{ formData.nombre_comercial || 'Punto de Venta • POS' }}
                </p>
                <p class="text-[9px] text-slate-400">
                  {{ formData.ciudad || 'Tocoa, Colón' }} • {{ formData.pais || 'Honduras' }}
                </p>
              </div>

              <!-- Simulación de Campos Login -->
              <div class="space-y-1.5 pt-2 text-left">
                <div class="h-6 bg-slate-100 rounded-lg border border-slate-200/60 px-2 flex items-center text-[9px] text-slate-400">
                  cajero@opalo.hn
                </div>
                <div class="h-6 bg-slate-100 rounded-lg border border-slate-200/60 px-2 flex items-center text-[9px] text-slate-400">
                  ••••••••
                </div>
                <div class="h-7 bg-opalo-600 text-white rounded-lg flex items-center justify-center font-bold text-[10px] shadow-xs">
                  Iniciar Turno en POS →
                </div>
              </div>
            </div>
            <p class="text-[10px] text-slate-600 text-center font-medium">
              Así reciben tus cajeros y administradores la pantalla de acceso.
            </p>
          </div>

          <!-- ============================================================================= -->
          <!-- 2. VISTA: HEADER / NAVBAR SUPERIOR DEL POS                                    -->
          <!-- ============================================================================= -->
          <div v-if="activePreviewMode === 'navbar'" class="bg-slate-100 p-4 rounded-2xl text-slate-800 space-y-3">
            <div class="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 flex items-center justify-between gap-2">
              <div class="flex items-center space-x-2">
                <img
                  v-if="formData.logo_url && !logoLoadError"
                  :src="getFullLogoUrl(formData.logo_url)"
                  alt="Logo Navbar"
                  class="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-200 shadow-2xs"
                  @error="logoLoadError = true"
                />
                <div v-else class="w-8 h-8 rounded-lg bg-opalo-600 text-white flex items-center justify-center font-black text-xs">
                  {{ (formData.nombre_empresa || 'Ó')[0].toUpperCase() }}
                </div>
                <div>
                  <div class="flex items-center gap-1">
                    <span class="font-black text-xs text-slate-900 leading-none">
                      {{ formData.nombre_empresa || 'ÓPALO ACCESORIOS' }}
                    </span>
                    <span class="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      v1.0
                    </span>
                  </div>
                  <p class="text-[9px] text-slate-400">
                    {{ formData.ciudad || 'Tocoa, Colón' }}
                  </p>
                </div>
              </div>

              <!-- Píldora de Navegación simulada -->
              <div class="hidden sm:flex items-center gap-1 text-[9px] font-bold text-slate-600">
                <span class="px-2 py-1 bg-opalo-50 text-opalo-700 rounded-lg">Caja (POS)</span>
                <span class="px-2 py-1 bg-slate-50 rounded-lg">Inventario</span>
                <span class="px-2 py-1 bg-slate-50 rounded-lg">Ventas</span>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 text-center font-medium">
              Aparece en la barra superior permanente de todas las pantallas del sistema.
            </p>
          </div>

          <!-- ============================================================================= -->
          <!-- 3. VISTA: APERTURA DE CAJA (FONDO INICIAL)                                    -->
          <!-- ============================================================================= -->
          <div v-if="activePreviewMode === 'apertura'" class="bg-gradient-to-br from-rose-50 to-slate-50 p-4 rounded-2xl text-slate-800 space-y-3 border border-rose-100">
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center space-y-2">
              <div class="flex justify-center">
                <img
                  v-if="formData.logo_url && !logoLoadError"
                  :src="getFullLogoUrl(formData.logo_url)"
                  alt="Logo Apertura"
                  class="h-10 max-w-[120px] object-contain rounded-xl p-0.5 bg-white border border-rose-100"
                  @error="logoLoadError = true"
                />
                <div v-else class="w-10 h-10 rounded-xl bg-opalo-600 text-white flex items-center justify-center text-lg">
                  💵
                </div>
              </div>
              <div>
                <span class="px-2 py-0.5 bg-rose-50 text-opalo-700 border border-rose-200 rounded-full text-[9px] font-black">
                  Apertura de Turno POS
                </span>
                <h4 class="font-black text-xs text-slate-900 mt-1">Fondo Inicial de Cambio</h4>
                <p class="text-[9px] text-slate-400">
                  ¿Con cuánto efectivo inicia en {{ formData.nombre_empresa || 'Ópalo' }}?
                </p>
              </div>
              <div class="h-8 bg-slate-50 rounded-xl border-2 border-opalo-200 flex items-center justify-center font-black text-sm text-slate-900">
                L. 1,000.00
              </div>
            </div>
            <p class="text-[10px] text-slate-600 text-center font-medium">
              Visible al comenzar la jornada por los cajeros antes de cobrar.
            </p>
          </div>

          <!-- ============================================================================= -->
          <!-- 4. VISTA: TICKET TÉRMICO FÍSICO (80mm)                                        -->
          <!-- ============================================================================= -->
          <div v-if="activePreviewMode === 'ticket'" class="space-y-3">
            <div class="bg-white text-slate-900 font-mono p-4 rounded-2xl shadow-inner text-xs border border-slate-300 relative select-none">
              
              <!-- Marca de corte superior -->
              <div class="border-b-2 border-dashed border-slate-300 pb-3 mb-3 text-center">
                
                <!-- Logo en Ticket -->
                <div v-if="formData.logo_url && !logoLoadError" class="mb-2 flex justify-center">
                  <img
                    :src="getFullLogoUrl(formData.logo_url)"
                    alt="Logo Ticket"
                    class="h-10 max-w-[140px] object-contain grayscale"
                    @error="logoLoadError = true"
                  />
                </div>

                <h4 class="font-black text-xs tracking-tight uppercase leading-tight">
                  {{ formData.nombre_empresa || 'ÓPALO ACCESORIOS' }}
                </h4>
                <p class="text-[9px] text-slate-600 mt-0.5">
                  {{ formData.direccion || 'Tocoa, Colón • Honduras' }}
                </p>
                <p class="text-[9px] text-slate-600">
                  Tel: {{ formData.telefono || '+504 9876-5432' }}
                </p>

                <!-- RTN Destacado en Ticket -->
                <div class="mt-1.5 py-0.5 px-2 bg-slate-100 rounded border border-slate-200 inline-block">
                  <p class="text-[10px] font-extrabold text-slate-900">
                    RTN: {{ formattedRtnDisplay }}
                  </p>
                </div>

                <p v-if="formData.cai_sar" class="text-[8px] text-slate-400 break-all mt-1">
                  CAI: {{ formData.cai_sar }}
                </p>
              </div>

              <!-- Detalle Resumido -->
              <div class="border-b border-dashed border-slate-300 pb-2 mb-2 text-[10px] space-y-1">
                <div class="flex justify-between">
                  <span>1x Vestido Casual Floral</span>
                  <span class="font-bold">L. 450.00</span>
                </div>
                <div class="flex justify-between">
                  <span>1x Aretes Hoops Dorados</span>
                  <span class="font-bold">L. 180.00</span>
                </div>
              </div>

              <!-- Total Ticket -->
              <div class="flex justify-between text-xs font-black text-slate-900 pt-1">
                <span>TOTAL FACTURA:</span>
                <span>L. 630.00</span>
              </div>

              <!-- Pie de Ticket Personalizado -->
              <div class="mt-3 pt-2 border-t-2 border-dashed border-slate-300 text-center text-[8px] text-slate-500 whitespace-pre-line leading-relaxed">
                {{ formData.mensaje_ticket_pie || '¡Gracias por su compra en Ópalo Accesorios!\nNo se aceptan devoluciones sin este recibo.' }}
              </div>

            </div>
            <p class="text-[10px] text-slate-400 text-center font-medium">
              Impreso en cada comprobante térmico entregado a tus clientes.
            </p>
          </div>

          <!-- Botón Guardar Duplicado en Columna Derecha -->
          <button
            @click="handleSave"
            type="button"
            class="w-full py-3 bg-gradient-to-r from-opalo-600 to-rose-500 hover:from-opalo-700 hover:to-rose-600 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="animate-spin text-sm">⏳</span>
            <span v-else>💾</span>
            <span>{{ isSaving ? 'Guardando...' : 'Aplicar Cambios en Todo el Sistema' }}</span>
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
const { companyConfig, getFullLogoUrl, fetchCompanyConfig, saveCompanyConfig, uploadLogoFile, removeLogo } = useCompanyConfig();

// Pestañas de configuración
const configTabs = [
  { id: 'sistema', label: 'Configuraciones del Sistema (Logo)', icon: '🏢' },
  { id: 'contacto', label: 'Contacto & Ubicación', icon: '📍' },
  { id: 'fiscal', label: 'Parámetros Fiscales & SAR', icon: '🏛️' },
  { id: 'ticket', label: 'Pie de Ticket', icon: '🧾' },
  { id: 'todos', label: 'Ver Todo', icon: '📋' }
];
const activeConfigTab = ref('sistema');

// Modos de previsualización en vivo del logotipo
const previewModes = [
  { id: 'login', label: 'Login', icon: '🔐' },
  { id: 'navbar', label: 'Navbar', icon: '🖥️' },
  { id: 'apertura', label: 'Apertura', icon: '💵' },
  { id: 'ticket', label: 'Ticket', icon: '🧾' }
];
const activePreviewMode = ref('login');

const dragOver = ref(false);

// Formulario local reactivo
const formData = ref({
  nombre_empresa: '',
  nombre_comercial: '',
  rtn: '',
  logo_url: null,
  telefono: '',
  email: '',
  direccion: '',
  ciudad: '',
  pais: '',
  moneda_simbolo: 'L.',
  moneda_codigo: 'HNL',
  isv_porcentaje: 15,
  isv_18_porcentaje: 18,
  cai_sar: '',
  rango_autorizado_sar: '',
  fecha_limite_emision: '',
  mensaje_ticket_pie: ''
});

const isSaving = ref(false);
const isUploadingLogo = ref(false);
const logoLoadError = ref(false);

watch(() => formData.value.logo_url, () => {
  logoLoadError.value = false;
});

const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: ''
});

const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

// Sincronizar datos iniciales desde el composable
const syncFormData = () => {
  const current = companyConfig.value;
  formData.value = {
    nombre_empresa: current.nombre_empresa || 'Ópalo Accesorios',
    nombre_comercial: current.nombre_comercial || 'Ópalo',
    rtn: current.rtn || '02091995001230',
    logo_url: current.logo_url || null,
    telefono: current.telefono || '+504 9876-5432',
    email: current.email || 'contacto@opalo.hn',
    direccion: current.direccion || 'Barrio El Centro, Calle Principal, Tocoa, Colón',
    ciudad: current.ciudad || 'Tocoa, Colón',
    pais: current.pais || 'Honduras',
    moneda_simbolo: current.moneda_simbolo || 'L.',
    moneda_codigo: current.moneda_codigo || 'HNL',
    isv_porcentaje: current.isv_porcentaje || 15,
    isv_18_porcentaje: current.isv_18_porcentaje || 18,
    cai_sar: current.cai_sar || '',
    rango_autorizado_sar: current.rango_autorizado_sar || '',
    fecha_limite_emision: current.fecha_limite_emision ? current.fecha_limite_emision.substring(0, 10) : '',
    mensaje_ticket_pie: current.mensaje_ticket_pie || ''
  };
};

// Dígitos limpios del RTN (solo números)
const cleanRtnDigits = computed(() => {
  return (formData.value.rtn || '').replace(/[^0-9]/g, '');
});

// Validación de RTN hondureño (14 dígitos)
const isRtnValid = computed(() => {
  return cleanRtnDigits.value.length === 14;
});

// Formateo visual del RTN: 0209-1995-001230
const formattedRtnDisplay = computed(() => {
  const digits = cleanRtnDigits.value;
  if (!digits) return '0209-1995-001230';
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 14)}`;
});

const formatRtnInput = (e) => {
  let val = e.target.value.replace(/[^0-9]/g, '');
  if (val.length > 14) val = val.slice(0, 14);

  let formatted = '';
  if (val.length > 0) formatted += val.slice(0, 4);
  if (val.length > 4) formatted += '-' + val.slice(4, 8);
  if (val.length > 8) formatted += '-' + val.slice(8, 14);

  formData.value.rtn = formatted;
};

// Subida de Archivo de Logotipo
const processLogoUpload = async (file) => {
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showNotification('error', 'Archivo demasiado grande', 'La imagen no debe superar los 10 MB.');
    return;
  }

  isUploadingLogo.value = true;
  try {
    const res = await uploadLogoFile(file);
    if (res && res.success) {
      logoLoadError.value = false;
      formData.value.logo_url = res.data.url;
      showNotification('success', '¡Logotipo subido con éxito!', 'El nuevo logo ahora se refleja en el Login, Navbar, Apertura de Caja y Tickets.');
    }
  } catch (err) {
    console.error('Error al subir logo:', err);
    showNotification('error', 'Error al subir imagen', err?.data?.message || 'No se pudo cargar el logotipo.');
  } finally {
    isUploadingLogo.value = false;
  }
};

const handleLogoFileSelect = async (e) => {
  const file = e.target.files?.[0];
  await processLogoUpload(file);
  e.target.value = '';
};

const handleLogoDrop = async (e) => {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  await processLogoUpload(file);
};

// Eliminar Logo
const handleRemoveLogo = async () => {
  if (!confirm('¿Deseas quitar el logotipo actual y volver al icono por defecto?')) return;

  isUploadingLogo.value = true;
  try {
    await removeLogo();
    formData.value.logo_url = null;
    showNotification('success', 'Logotipo eliminado', 'Se ha restablecido el icono por defecto en todo el sistema.');
  } catch (err) {
    console.error('Error al quitar logo:', err);
    showNotification('error', 'Error', 'No se pudo eliminar el logotipo.');
  } finally {
    isUploadingLogo.value = false;
  }
};

// Deshacer Cambios
const resetFormToSaved = () => {
  syncFormData();
  showNotification('success', 'Cambios revertidos', 'Se han restablecido los valores guardados anteriormente.');
};

// Guardar Configuración General
const handleSave = async () => {
  if (!formData.value.nombre_empresa.trim()) {
    showNotification('error', 'Campo Requerido', 'El nombre o razón social de la empresa es obligatorio.');
    return;
  }

  if (!isRtnValid.value) {
    showNotification('error', 'RTN Inválido', 'El RTN de la empresa debe tener exactamente 14 dígitos numéricos.');
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      ...formData.value,
      rtn: cleanRtnDigits.value
    };

    const res = await saveCompanyConfig(payload);
    if (res && res.success) {
      showNotification('success', '¡Configuración Guardada!', 'Todos los cambios fueron guardados y aplicados en el POS.');
    } else {
      showNotification('error', 'Error al guardar', res?.message || 'No se pudo guardar la configuración.');
    }
  } catch (err) {
    console.error('Error guardando configuración:', err);
    showNotification('error', 'Error de Conexión', err?.data?.message || 'Ocurrió un error al guardar los datos.');
  } finally {
    isSaving.value = false;
  }
};

// Cargar al montar el componente
onMounted(async () => {
  await fetchCompanyConfig();
  syncFormData();
});

watch(companyConfig, () => {
  syncFormData();
}, { deep: true });
</script>
