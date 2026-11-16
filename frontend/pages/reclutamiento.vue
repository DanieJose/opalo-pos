<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
    
    <!-- ===================================================================== -->
    <!-- CABECERA DEL MÓDULO                                                  -->
    <!-- ===================================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Reclutamiento y Talento Humano</h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            En Vivo
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Publica vacantes, genera volantes QR para imprimir y gestiona las hojas de vida recibidas en tiempo real
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Botón Afiche QR Imprimible / PDF -->
        <button 
          @click="openQrFlyerModal(null)"
          class="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <span>🖨️</span>
          <span>Afiche QR (PDF / Imprimir)</span>
        </button>

        <!-- Botón Nueva Vacante -->
        <button 
          @click="openNewVacancyModal"
          class="px-4 py-2.5 bg-gradient-to-r from-opalo-600 via-rose-600 to-pink-600 hover:from-opalo-700 hover:to-rose-700 text-white rounded-xl text-xs font-black transition shadow-lg shadow-opalo-500/25 flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span>
          <span>Nueva Vacante</span>
        </button>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TARJETAS DE MÉTRICAS Y KPIS DE RECLUTAMIENTO                          -->
    <!-- ===================================================================== -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Vacantes Abiertas</p>
        <p class="text-2xl font-black text-opalo-600 mt-0.5">{{ metrics.vacantes?.vacantes_abiertas || 0 }}</p>
        <p class="text-[10px] text-slate-400">De {{ metrics.vacantes?.total_vacantes || 0 }} registradas</p>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Total Postulantes</p>
        <p class="text-2xl font-black text-slate-900 mt-0.5">{{ metrics.postulaciones?.total_postulaciones || 0 }}</p>
        <p class="text-[10px] text-slate-400">Currículums recibidos</p>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
        <p class="text-[10px] font-extrabold uppercase text-rose-600 flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Nuevos CVs</span>
        </p>
        <p class="text-2xl font-black text-rose-600 mt-0.5">{{ metrics.postulaciones?.nuevos || 0 }}</p>
        <p class="text-[10px] text-rose-700 font-semibold">Pendientes de revisión</p>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">En Entrevista</p>
        <p class="text-2xl font-black text-amber-600 mt-0.5">{{ metrics.postulaciones?.en_entrevista || 0 }}</p>
        <p class="text-[10px] text-slate-400">Candidatos preseleccionados</p>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <p class="text-[10px] font-extrabold uppercase text-slate-400">Contratados</p>
        <p class="text-2xl font-black text-emerald-600 mt-0.5">{{ metrics.postulaciones?.contratados || 0 }}</p>
        <p class="text-[10px] text-emerald-700 font-medium">Incorporados al equipo</p>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- NAVEGACIÓN POR PESTAÑAS (CANDIDATOS / VACANTES)                       -->
    <!-- ===================================================================== -->
    <div class="flex items-center space-x-2 border-b border-slate-200 pb-2">
      <button 
        @click="activeTab = 'candidatos'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        :class="activeTab === 'candidatos' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
      >
        <span>👥</span>
        <span>Hojas de Vida y Candidatos ({{ candidates.length }})</span>
        <span v-if="metrics.postulaciones?.nuevos > 0" class="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
          {{ metrics.postulaciones?.nuevos }}
        </span>
      </button>

      <button 
        @click="activeTab = 'vacantes'"
        class="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        :class="activeTab === 'vacantes' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
      >
        <span>📋</span>
        <span>Plazas y Vacantes ({{ vacancies.length }})</span>
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 1: LISTADO DE CANDIDATOS Y HOJAS DE VIDA (CVs)               -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'candidatos'" class="space-y-4">
      
      <!-- Barra de Filtros y Búsqueda -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
        <div class="relative w-full sm:w-80">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            v-model="candidateSearch"
            @input="debouncedFetchCandidates"
            type="text" 
            placeholder="Buscar por nombre, teléfono, DNI o email..."
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs bg-slate-50/50"
          />
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <!-- Filtro por Vacante -->
          <select 
            v-model="filterVacancyId"
            @change="loadCandidates"
            class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="">Todas las Vacantes</option>
            <option v-for="vac in vacancies" :key="vac.id" :value="vac.id">
              {{ vac.titulo }}
            </option>
          </select>

          <!-- Filtro por Estado -->
          <select 
            v-model="filterStatus"
            @change="loadCandidates"
            class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="NUEVO">Nuevos</option>
            <option value="EN_REVISION">En Revisión</option>
            <option value="ENTREVISTA">En Entrevista</option>
            <option value="CONTRATADO">Contratados</option>
            <option value="DESCARTADO">Descartados</option>
          </select>
        </div>
      </div>

      <!-- Tarjetas de Candidatos -->
      <div v-if="isLoadingCandidates" class="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
        <span class="inline-block animate-spin text-2xl mb-2">⏳</span>
        <p class="text-xs font-bold">Cargando hojas de vida de candidatos...</p>
      </div>

      <div v-else-if="candidates.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
        <span class="text-4xl block mb-2">📭</span>
        <p class="text-sm font-bold text-slate-700">No se encontraron postulaciones</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Genera e imprime el afiche QR para colocarlo en tu tienda o compartirlo en redes sociales.
        </p>
        <button 
          @click="openQrFlyerModal(null)"
          class="mt-4 px-4 py-2 bg-opalo-50 text-opalo-700 hover:bg-opalo-100 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Generar Afiche con Código QR
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          v-for="cand in candidates" 
          :key="cand.id"
          class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-opalo-300 transition flex flex-col justify-between space-y-4"
        >
          <!-- Cabecera de la Tarjeta del Candidato -->
          <div>
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-opalo-100 to-rose-100 text-opalo-800 flex items-center justify-center font-black text-sm shrink-0">
                  {{ cand.nombre_completo.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h3 class="text-sm font-black text-slate-900 leading-tight">{{ cand.nombre_completo }}</h3>
                  <p class="text-[11px] text-opalo-600 font-bold mt-0.5">
                    🎯 {{ cand.vacante_titulo || cand.puesto_interes || 'Postulación General' }}
                  </p>
                </div>
              </div>

              <!-- Selector Rápido de Estado -->
              <select 
                :value="cand.estado"
                @change="onCandidateStatusChange(cand, $event.target.value)"
                class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border"
                :class="getStatusBadgeClass(cand.estado)"
              >
                <option value="NUEVO">NUEVO</option>
                <option value="EN_REVISION">EN REVISIÓN</option>
                <option value="ENTREVISTA">ENTREVISTA</option>
                <option value="CONTRATADO">CONTRATADO</option>
                <option value="DESCARTADO">DESCARTADO</option>
              </select>
            </div>

            <!-- Datos de Contacto y Ubicación -->
            <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 mt-2">
              <p class="flex items-center gap-1.5 truncate">
                <span>📞</span>
                <strong class="text-slate-800 font-mono">{{ cand.telefono }}</strong>
              </p>
              <p class="flex items-center gap-1.5 truncate" :title="cand.ciudad_direccion">
                <span>📍</span>
                <span class="truncate">{{ cand.ciudad_direccion || 'Tocoa, Colón' }}</span>
              </p>
              <p v-if="cand.identidad_dni" class="flex items-center gap-1.5 truncate">
                <span>🪪</span>
                <span class="font-mono text-slate-700">{{ cand.identidad_dni }}</span>
              </p>
              <p v-if="cand.email" class="flex items-center gap-1.5 truncate" :title="cand.email">
                <span>✉️</span>
                <span class="truncate">{{ cand.email }}</span>
              </p>
              <p class="col-span-2 text-[10px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-200/50">
                <span>🕒 Recibido:</span>
                <span>{{ formatDate(cand.created_at) }}</span>
              </p>
            </div>

            <!-- Resumen de Experiencia Previa -->
            <div v-if="cand.experiencia_previa" class="mt-2.5 p-2.5 bg-white rounded-xl border border-slate-100 text-xs text-slate-600">
              <p class="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Experiencia previa:</p>
              <p class="line-clamp-2 text-[11px] leading-relaxed">{{ cand.experiencia_previa }}</p>
            </div>

            <!-- Notas Internas si existen -->
            <div v-if="cand.notas_internas" class="mt-2 p-2 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
              <span>📌</span>
              <p class="flex-1 italic">{{ cand.notas_internas }}</p>
            </div>
          </div>

          <!-- Acciones de la Tarjeta -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <!-- Botón Ver CV (PDF / DOC) -->
            <a 
              :href="formatFileUrl(cand.cv_archivo_url)" 
              target="_blank"
              class="px-3.5 py-1.5 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>📄</span>
              <span>Ver Hoja de Vida</span>
            </a>

            <div class="flex items-center gap-1.5">
              <!-- Contactar WhatsApp -->
              <a 
                :href="getWhatsAppLink(cand)"
                target="_blank"
                class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition border border-emerald-200 flex items-center gap-1 cursor-pointer"
                title="Escribir al candidato por WhatsApp"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>

              <!-- Agregar Notas Internas -->
              <button 
                @click="openNotesModal(cand)"
                class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition cursor-pointer"
                title="Editar notas de entrevista"
              >
                ✏️
              </button>

              <!-- Eliminar -->
              <button 
                @click="deleteCandidate(cand)"
                class="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-xl text-xs transition cursor-pointer"
                title="Eliminar postulación"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ===================================================================== -->
    <!-- PESTAÑA 2: GESTIÓN DE VACANTES DE EMPLEO                             -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'vacantes'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <th class="py-3 px-4">Puesto / Vacante</th>
              <th class="py-3 px-4">Departamento</th>
              <th class="py-3 px-4">Tipo Contrato</th>
              <th class="py-3 px-4">Salario Estimado</th>
              <th class="py-3 px-4 text-center">Postulantes</th>
              <th class="py-3 px-4 text-center">Estado</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="vac in vacancies" :key="vac.id" class="hover:bg-slate-50/70 transition">
              <td class="py-3.5 px-4">
                <p class="font-extrabold text-slate-900 text-sm">{{ vac.titulo }}</p>
                <p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{{ vac.descripcion }}</p>
              </td>
              <td class="py-3.5 px-4 font-bold text-slate-700">
                {{ vac.departamento }}
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  {{ vac.tipo_contrato.replace('_', ' ') }}
                </span>
              </td>
              <td class="py-3.5 px-4 font-mono font-bold text-slate-800">
                {{ vac.salario_ofrecido || 'A convenir' }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span class="px-2.5 py-1 rounded-full font-black text-xs bg-rose-50 text-rose-700 border border-rose-200">
                  {{ vac.total_postulantes || 0 }} CVs
                </span>
              </td>
              <td class="py-3.5 px-4 text-center">
                <button 
                  @click="toggleVacancyStatus(vac)"
                  class="px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider transition cursor-pointer"
                  :class="vac.estado === 'ABIERTA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'"
                >
                  {{ vac.estado }}
                </button>
              </td>
              <td class="py-3.5 px-4 text-right space-x-1.5">
                <!-- Generar QR para esta vacante -->
                <button 
                  @click="openQrFlyerModal(vac)"
                  class="p-1.5 bg-slate-100 hover:bg-opalo-50 hover:text-opalo-600 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Generar afiche QR para esta vacante"
                >
                  🖨️ QR
                </button>
                <button 
                  @click="openEditVacancyModal(vac)"
                  class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Editar vacante"
                >
                  ✏️
                </button>
                <button 
                  @click="deleteVacancy(vac)"
                  class="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg text-xs transition cursor-pointer"
                  title="Eliminar vacante"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 1: AFICHE Y CÓDIGO QR PARA IMPRIMIR O ENVIAR EN PDF            -->
    <!-- ===================================================================== -->
    <div v-if="isQrModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
        
        <!-- Cabecera del Modal -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-lg font-black text-slate-900">Afiche QR de Contratación</h2>
            <p class="text-xs text-slate-500">Imprime o guarda en PDF para colocar en tienda o enviar por WhatsApp</p>
          </div>
          <button 
            @click="isQrModalOpen = false" 
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <!-- VISTA PREVIA DEL AFICHE IMPRIMIBLE (ÁREA IMPRIMIBLE) -->
        <div id="printable-recruitment-flyer" class="bg-gradient-to-b from-slate-950 via-slate-900 to-opalo-950 text-white p-8 rounded-3xl text-center space-y-4 border-4 border-opalo-500/40 shadow-xl">
          
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-opalo-600 via-rose-500 to-pink-500 text-white text-2xl shadow-lg">
            💎
          </div>

          <div>
            <h3 class="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              ¡Ópalo Accesorios!
            </h3>
            <p class="text-rose-400 font-black text-sm tracking-widest uppercase mt-0.5">
              Estamos Contratando
            </p>
            <p class="text-xs text-slate-300 mt-1">
              {{ selectedQrVacancy ? `Plaza: ${selectedQrVacancy.titulo}` : 'Únete a nuestro equipo de trabajo en Tocoa' }}
            </p>
          </div>

          <!-- CONTENEDOR DEL CÓDIGO QR -->
          <div class="bg-white p-5 rounded-2xl inline-block shadow-2xl border-4 border-rose-300 mx-auto">
            <img 
              :src="qrCodeImageUrl" 
              alt="Código QR de Postulación Ópalo Accesorios"
              class="w-52 h-52 object-contain mx-auto"
            />
          </div>

          <!-- INSTRUCCIONES CLARAS PARA EL POSTULANTE -->
          <div class="space-y-1 max-w-sm mx-auto">
            <p class="text-sm font-black text-rose-200">
              📸 Escanea con la cámara de tu celular
            </p>
            <p class="text-xs text-slate-300 leading-snug">
              Para conocer los requisitos, plazas disponibles y subir tu currículum vitae en línea al instante.
            </p>
          </div>

          <div class="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-4">
            <span>📍 Tocoa, Colón, Honduras</span>
            <span>💬 WhatsApp: +504 9988-7766</span>
          </div>

        </div>

        <!-- ACCIONES Y ENLACES DEL AFICHE -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <span class="text-slate-400">🔗</span>
            <input 
              type="text" 
              readonly 
              :value="publicApplyUrl" 
              class="w-full bg-transparent font-mono text-[11px] text-slate-700 outline-none"
            />
            <button 
              @click="copyApplyUrl" 
              class="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 shrink-0 cursor-pointer text-xs"
            >
              {{ copiedLink ? '✓ Copiado' : 'Copiar' }}
            </button>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <!-- Compartir WhatsApp -->
            <a 
              :href="shareFlyerWhatsAppUrl" 
              target="_blank"
              class="px-4 py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>📲</span>
              <span>Enviar por WhatsApp</span>
            </a>

            <!-- Botón Imprimir / PDF -->
            <button 
              @click="printFlyer"
              class="px-5 py-2.5 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-lg shadow-opalo-500/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Imprimir / Guardar en PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 2: CREAR O EDITAR VACANTE DE EMPLEO                            -->
    <!-- ===================================================================== -->
    <div v-if="isVacancyModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="text-lg font-black text-slate-900">
            {{ editingVacancyId ? 'Editar Vacante' : 'Crear Nueva Vacante de Empleo' }}
          </h2>
          <button @click="isVacancyModalOpen = false" class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center cursor-pointer">
            ✕
          </button>
        </div>

        <form @submit.prevent="saveVacancy" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Título del Puesto *</label>
            <input 
              v-model="vacancyForm.titulo" 
              type="text" 
              required 
              placeholder="Ej. Asesora de Ventas, Cajera POS, Encargada de Bodega"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-opalo-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
              <input 
                v-model="vacancyForm.departamento" 
                type="text" 
                placeholder="Ventas / Caja / Logística"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Tipo de Contrato</label>
              <select v-model="vacancyForm.tipo_contrato" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs">
                <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                <option value="TEMPORAL">Temporal</option>
                <option value="POR_TEMPORADA">Por Temporada (Navidad / Verano)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Salario Ofrecido (Opcional)</label>
              <input 
                v-model="vacancyForm.salario_ofrecido" 
                type="text" 
                placeholder="Ej. L. 12,000 + comisiones"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Estado</label>
              <select v-model="vacancyForm.estado" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs">
                <option value="ABIERTA">ABIERTA (Aceptando CVs)</option>
                <option value="PAUSADA">PAUSADA</option>
                <option value="CERRADA">CERRADA</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Descripción del Puesto *</label>
            <textarea 
              v-model="vacancyForm.descripcion" 
              rows="3" 
              required
              placeholder="Funciones principales a desempeñar en Ópalo..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Requisitos Principales</label>
            <textarea 
              v-model="vacancyForm.requisitos" 
              rows="2" 
              placeholder="Experiencia, nivel educativo, habilidades requeridas..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" @click="isVacancyModalOpen = false" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer">
              Guardar Vacante
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL 3: NOTAS INTERNAS DEL CANDIDATO                                -->
    <!-- ===================================================================== -->
    <div v-if="isNotesModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <h3 class="text-sm font-black text-slate-900">Notas Internas de Entrevista</h3>
        <p class="text-xs text-slate-500">Candidato: <strong>{{ activeCandidate?.nombre_completo }}</strong></p>
        <textarea 
          v-model="candidateNoteText" 
          rows="4" 
          placeholder="Escribe comentarios sobre la entrevista, disponibilidad, expectativas salariales..."
          class="w-full p-3 rounded-xl border border-slate-200 text-xs"
        ></textarea>
        <div class="flex justify-end gap-2">
          <button @click="isNotesModalOpen = false" class="px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer">Cancelar</button>
          <button @click="saveCandidateNotes" class="px-4 py-1.5 bg-opalo-600 text-white font-bold text-xs rounded-xl cursor-pointer">Guardar Nota</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { onEvent } = useSocket();
const config = useRuntimeConfig();

// Estados reactivos
const activeTab = ref('candidatos');
const metrics = ref({});
const candidates = ref([]);
const vacancies = ref([]);
const isLoadingCandidates = ref(false);

const candidateSearch = ref('');
const filterVacancyId = ref('');
const filterStatus = ref('');

// Modales
const isQrModalOpen = ref(false);
const selectedQrVacancy = ref(null);
const copiedLink = ref(false);

const isVacancyModalOpen = ref(false);
const editingVacancyId = ref(null);
const vacancyForm = reactive({
  titulo: '',
  departamento: 'Ventas',
  ubicacion: 'Tocoa, Colón',
  tipo_contrato: 'TIEMPO_COMPLETO',
  salario_ofrecido: '',
  descripcion: '',
  requisitos: '',
  beneficios: '',
  estado: 'ABIERTA'
});

const isNotesModalOpen = ref(false);
const activeCandidate = ref(null);
const candidateNoteText = ref('');

// URL Pública de Postulación para el Código QR
const publicApplyUrl = computed(() => {
  if (process.client) {
    const origin = window.location.origin;
    if (selectedQrVacancy.value) {
      return `${origin}/postulacion?vacante_id=${selectedQrVacancy.value.id}`;
    }
    return `${origin}/postulacion`;
  }
  return 'http://localhost:3000/postulacion';
});

// URL del generador de QR de alta resolución
const qrCodeImageUrl = computed(() => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(publicApplyUrl.value)}`;
});

const shareFlyerWhatsAppUrl = computed(() => {
  const text = `¡Hola! En Ópalo Accesorios estamos contratando personal para nuestra tienda en Tocoa. Conoce las vacantes abiertas y sube tu currículum aquí: ${publicApplyUrl.value}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
});

// Cargar métricas de reclutamiento
const loadMetrics = async () => {
  try {
    const res = await apiFetch('/reclutamiento/metricas');
    if (res && res.success) {
      metrics.value = res.data || {};
    }
  } catch (err) {
    console.error('Error cargando métricas:', err);
  }
};

// Cargar listado de candidatos
const loadCandidates = async () => {
  isLoadingCandidates.value = true;
  try {
    let url = '/reclutamiento/candidatos?';
    if (filterStatus.value) url += `&estado=${filterStatus.value}`;
    if (filterVacancyId.value) url += `&vacante_id=${filterVacancyId.value}`;
    if (candidateSearch.value) url += `&search=${encodeURIComponent(candidateSearch.value)}`;

    const res = await apiFetch(url);
    if (res && res.success) {
      candidates.value = res.data || [];
    }
  } catch (err) {
    console.error('Error cargando candidatos:', err);
  } finally {
    isLoadingCandidates.value = false;
  }
};

let debounceTimer = null;
const debouncedFetchCandidates = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadCandidates();
  }, 300);
};

// Cargar vacantes
const loadVacancies = async () => {
  try {
    const res = await apiFetch('/reclutamiento/vacantes');
    if (res && res.success) {
      vacancies.value = res.data || [];
    }
  } catch (err) {
    console.error('Error cargando vacantes:', err);
  }
};

// Formato de URL de archivo de CV
const formatFileUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = config.public.apiBase ? config.public.apiBase.replace('/api/v1', '') : 'http://localhost:4000';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Enlace directo a WhatsApp del candidato
const getWhatsAppLink = (cand) => {
  const cleanPhone = cand.telefono.replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.startsWith('504') ? cleanPhone : `504${cleanPhone}`;
  const message = `¡Hola ${cand.nombre_completo}! Te saludamos de Recursos Humanos de Ópalo Accesorios en Tocoa. Recibimos tu hoja de vida para la vacante de ${cand.vacante_titulo || cand.puesto_interes}.`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
};

const getStatusBadgeClass = (estado) => {
  switch (estado) {
    case 'NUEVO': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'EN_REVISION': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ENTREVISTA': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'CONTRATADO': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DESCARTADO': return 'bg-slate-100 text-slate-500 border-slate-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('es-HN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const onCandidateStatusChange = async (cand, newStatus) => {
  try {
    const res = await apiFetch(`/reclutamiento/candidatos/${cand.id}/estado`, {
      method: 'PATCH',
      body: { estado: newStatus }
    });
    if (res && res.success) {
      cand.estado = newStatus;
      loadMetrics();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error actualizando estado del candidato');
  }
};

const openNotesModal = (cand) => {
  activeCandidate.value = cand;
  candidateNoteText.value = cand.notas_internas || '';
  isNotesModalOpen.value = true;
};

const saveCandidateNotes = async () => {
  if (!activeCandidate.value) return;
  try {
    const res = await apiFetch(`/reclutamiento/candidatos/${activeCandidate.value.id}/estado`, {
      method: 'PATCH',
      body: { notas_internas: candidateNoteText.value }
    });
    if (res && res.success) {
      activeCandidate.value.notas_internas = candidateNoteText.value;
      isNotesModalOpen.value = false;
    }
  } catch (err) {
    alert(err?.data?.message || 'Error guardando nota');
  }
};

const deleteCandidate = async (cand) => {
  if (!confirm(`¿Estás seguro de eliminar la postulación de "${cand.nombre_completo}"?`)) return;
  try {
    const res = await apiFetch(`/reclutamiento/candidatos/${cand.id}`, {
      method: 'DELETE'
    });
    if (res && res.success) {
      loadCandidates();
      loadMetrics();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error eliminando candidato');
  }
};

// Modal de Afiche QR
const openQrFlyerModal = (vacancy = null) => {
  selectedQrVacancy.value = vacancy;
  copiedLink.value = false;
  isQrModalOpen.value = true;
};

const copyApplyUrl = async () => {
  try {
    await navigator.clipboard.writeText(publicApplyUrl.value);
    copiedLink.value = true;
    setTimeout(() => { copiedLink.value = false; }, 2500);
  } catch (e) {
    console.error('Error al copiar:', e);
  }
};

const printFlyer = () => {
  window.print();
};

// Gestión de Vacantes
const openNewVacancyModal = () => {
  editingVacancyId.value = null;
  vacancyForm.titulo = '';
  vacancyForm.departamento = 'Ventas';
  vacancyForm.ubicacion = 'Tocoa, Colón';
  vacancyForm.tipo_contrato = 'TIEMPO_COMPLETO';
  vacancyForm.salario_ofrecido = '';
  vacancyForm.descripcion = '';
  vacancyForm.requisitos = '';
  vacancyForm.beneficios = '';
  vacancyForm.estado = 'ABIERTA';
  isVacancyModalOpen.value = true;
};

const openEditVacancyModal = (vac) => {
  editingVacancyId.value = vac.id;
  vacancyForm.titulo = vac.titulo || '';
  vacancyForm.departamento = vac.departamento || 'Ventas';
  vacancyForm.ubicacion = vac.ubicacion || 'Tocoa, Colón';
  vacancyForm.tipo_contrato = vac.tipo_contrato || 'TIEMPO_COMPLETO';
  vacancyForm.salario_ofrecido = vac.salario_ofrecido || '';
  vacancyForm.descripcion = vac.descripcion || '';
  vacancyForm.requisitos = vac.requisitos || '';
  vacancyForm.beneficios = vac.beneficios || '';
  vacancyForm.estado = vac.estado || 'ABIERTA';
  isVacancyModalOpen.value = true;
};

const saveVacancy = async () => {
  try {
    let res;
    if (editingVacancyId.value) {
      res = await apiFetch(`/reclutamiento/vacantes/${editingVacancyId.value}`, {
        method: 'PUT',
        body: vacancyForm
      });
    } else {
      res = await apiFetch('/reclutamiento/vacantes', {
        method: 'POST',
        body: vacancyForm
      });
    }

    if (res && res.success) {
      alert(editingVacancyId.value ? 'Vacante actualizada exitosamente' : 'Vacante creada con éxito');
      isVacancyModalOpen.value = false;
      loadVacancies();
      loadMetrics();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error guardando vacante');
  }
};

const toggleVacancyStatus = async (vac) => {
  const newStatus = vac.estado === 'ABIERTA' ? 'CERRADA' : 'ABIERTA';
  try {
    const res = await apiFetch(`/reclutamiento/vacantes/${vac.id}`, {
      method: 'PUT',
      body: { estado: newStatus }
    });
    if (res && res.success) {
      vac.estado = newStatus;
      loadMetrics();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error cambiando estado');
  }
};

const deleteVacancy = async (vac) => {
  if (!confirm(`¿Eliminar la vacante "${vac.titulo}"?`)) return;
  try {
    const res = await apiFetch(`/reclutamiento/vacantes/${vac.id}`, {
      method: 'DELETE'
    });
    if (res && res.success) {
      loadVacancies();
      loadMetrics();
    }
  } catch (err) {
    alert(err?.data?.message || 'Error eliminando vacante');
  }
};

onMounted(() => {
  loadMetrics();
  loadCandidates();
  loadVacancies();

  // Escuchar en tiempo real nuevas aplicaciones
  onEvent('reclutamiento:nueva_postulacion', (data) => {
    loadCandidates();
    loadMetrics();
  });
});
</script>

<style>
@media print {
  body * {
    visibility: hidden !important;
  }
  #printable-recruitment-flyer, #printable-recruitment-flyer * {
    visibility: visible !important;
  }
  #printable-recruitment-flyer {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 25mm 20mm !important;
    background: #090d16 !important;
    color: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-shadow: none !important;
    border: none !important;
  }
}
</style>

