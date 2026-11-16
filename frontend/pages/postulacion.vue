<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-opalo-950 to-slate-900 py-6 sm:py-10 px-3 sm:px-6 flex flex-col justify-between font-sans">
    
    <!-- CONTENIDO PRINCIPAL -->
    <div class="max-w-3xl mx-auto w-full">
      
      <!-- LOGO Y CABECERA INSTITUCIONAL -->
      <div class="text-center mb-6 sm:mb-8">
        <div class="mb-3 flex justify-center">
          <img 
            v-if="companyConfig?.logo_url && !logoError" 
            :src="getFullLogoUrl(companyConfig.logo_url)" 
            :alt="companyConfig?.nombre_empresa || 'Logo Empresa'" 
            class="h-16 sm:h-20 max-w-[200px] sm:max-w-[220px] object-contain rounded-2xl p-1.5 bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl"
            @error="logoError = true"
          />
          <div 
            v-else 
            class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-opalo-600 via-rose-500 to-pink-500 text-white shadow-xl shadow-opalo-500/25 text-2xl sm:text-3xl"
          >
            💎
          </div>
        </div>
        <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
          {{ companyConfig?.nombre_empresa || 'ÓPALO ACCESORIOS' }}
        </h1>
        <p class="text-rose-400 font-bold text-xs uppercase tracking-widest mt-1">
          {{ companyConfig?.nombre_comercial || 'Boutique de Moda' }} • {{ companyConfig?.ciudad || 'Tocoa, Colón' }}, {{ companyConfig?.pais || 'Honduras' }}
        </p>
        <p class="text-slate-300 text-sm mt-2 max-w-md mx-auto">
          ¡Forma parte de nuestro equipo de trabajo en {{ companyConfig?.nombre_empresa || 'Ópalo Accesorios' }}! Postúlate a nuestras vacantes abiertas y sube tu hoja de vida.
        </p>
      </div>

      <!-- VISTA 1: MENSAJE DE ÉXITO TRAS POSTULAR -->
      <div v-if="applicationSubmitted" class="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-5 animate-fadeIn">
        <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-emerald-100 shadow-inner">
          ✓
        </div>
        <div>
          <h2 class="text-2xl font-black text-slate-900">¡Postulación Enviada con Éxito!</h2>
          <p class="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
            Muchas gracias, <strong class="text-slate-900">{{ candidateForm.nombre_completo }}</strong>. Hemos recibido tu hoja de vida y datos de contacto para la plaza de 
            <strong class="text-opalo-600 font-bold">{{ selectedVacancyTitle || candidateForm.puesto_interes }}</strong>.
          </p>
        </div>

        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
          <p class="font-bold text-slate-700 flex items-center gap-1.5">
            <span>ℹ️</span>
            <span>¿Cuáles son los siguientes pasos?</span>
          </p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1">
            <li>Nuestro equipo de Recursos Humanos revisará tu experiencia y currículum.</li>
            <li>Si tu perfil cumple con los requisitos, te contactaremos vía WhatsApp o llamada telefónica al <strong>{{ candidateForm.telefono }}</strong>.</li>
            <li>Las entrevistas presenciales se realizarán en nuestra tienda en Tocoa.</li>
          </ul>
        </div>

        <div class="pt-4">
          <button 
            @click="resetForm"
            class="px-6 py-3 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-opalo-500/25 transition cursor-pointer"
          >
            Enviar otra postulación
          </button>
        </div>
      </div>

      <!-- VISTA 2: FORMULARIO DE POSTULACIÓN -->
      <div v-else class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        <!-- Barra de Progreso / Título -->
        <div class="bg-gradient-to-r from-opalo-700 via-rose-600 to-pink-600 p-6 text-white">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              Portal de Reclutamiento
            </span>
            <span class="text-xs font-semibold text-rose-100">
              {{ vacancies.length }} {{ vacancies.length === 1 ? 'plaza abierta' : 'plazas abiertas' }}
            </span>
          </div>
          <h2 class="text-xl font-black mt-2">Formulario de Aplicación Laboral</h2>
          <p class="text-xs text-rose-100 mt-0.5">Completa tus datos personales y adjunta tu currículum vitae en formato PDF o Word.</p>
        </div>

        <form @submit.prevent="submitApplication" class="p-6 sm:p-8 space-y-6">
          
          <!-- SECCIÓN 1: SELECCIÓN DE PUESTO / VACANTE -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span>🎯</span>
                <span>Puesto o Vacante a la que Aplicas *</span>
              </span>
              <span class="text-[11px] text-opalo-600 font-semibold">Selecciona una opción</span>
            </label>

            <!-- Cargando vacantes -->
            <div v-if="isLoadingVacancies" class="p-3 bg-slate-50 text-slate-400 text-xs text-center rounded-xl animate-pulse">
              Cargando puestos disponibles...
            </div>

            <!-- Selector de Vacantes Disponibles -->
            <div v-else class="space-y-2">
              <select 
                v-model="candidateForm.vacante_id"
                required
                class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-bold text-slate-800 bg-white cursor-pointer"
              >
                <option value="" disabled>Selecciona el puesto de tu interés</option>
                <option v-for="vac in vacancies" :key="vac.id" :value="vac.id">
                  {{ vac.titulo }} — ({{ vac.departamento }} • {{ vac.tipo_contrato.replace('_', ' ') }})
                </option>
                <option value="OTRO">✨ Otra área / Postulación Espontánea</option>
              </select>

              <!-- Tarjeta Informativa de la Vacante Seleccionada -->
              <div v-if="selectedVacancy" class="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80 text-xs space-y-2 animate-fadeIn">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-extrabold text-slate-900 text-sm">{{ selectedVacancy.titulo }}</h3>
                    <p class="text-[11px] text-opalo-700 font-semibold">{{ selectedVacancy.departamento }} • {{ selectedVacancy.ubicacion }}</p>
                  </div>
                  <span v-if="selectedVacancy.salario_ofrecido" class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[11px]">
                    {{ selectedVacancy.salario_ofrecido }}
                  </span>
                </div>
                <p class="text-slate-600 text-xs leading-relaxed">{{ selectedVacancy.descripcion }}</p>
                <div v-if="selectedVacancy.requisitos" class="pt-1 text-[11px] text-slate-500">
                  <strong class="text-slate-700">Requisitos principales:</strong>
                  <p class="whitespace-pre-line mt-0.5">{{ selectedVacancy.requisitos }}</p>
                </div>
              </div>

              <!-- Campo libre si eligió 'OTRO' -->
              <div v-if="candidateForm.vacante_id === 'OTRO'" class="pt-2">
                <label class="block text-xs font-bold text-slate-700 mb-1">Escribe el puesto de tu interés *</label>
                <input 
                  v-model="candidateForm.puesto_interes"
                  type="text" 
                  required
                  placeholder="Ej. Fotografía y Redes Sociales, Limpieza, Seguridad, etc."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-opalo-500"
                />
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: DATOS PERSONALES Y DE CONTACTO -->
          <div class="space-y-4 pt-4 border-t border-slate-100">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>👤</span>
              <span>Tus Datos de Contacto</span>
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Nombre Completo -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 mb-1">Nombre y Apellidos Completos *</label>
                <input 
                  v-model="candidateForm.nombre_completo"
                  type="text" 
                  required
                  placeholder="Ej. Ana María Martínez Pérez"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs"
                />
              </div>

              <!-- Teléfono / WhatsApp -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Teléfono o WhatsApp *</span>
                  <span class="text-[10px] text-emerald-600 font-semibold">Te contactaremos aquí</span>
                </label>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">+504</span>
                  <input 
                    v-model="candidateForm.telefono"
                    type="tel" 
                    required
                    placeholder="9988-7766"
                    class="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <!-- Número de Identidad / DNI -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Número de Identidad (DNI)</label>
                <input 
                  v-model="candidateForm.identidad_dni"
                  type="text" 
                  placeholder="Ej. 0209-1998-12345"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs font-mono"
                />
              </div>

              <!-- Correo Electrónico -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
                <input 
                  v-model="candidateForm.email"
                  type="email" 
                  placeholder="nombre@ejemplo.com"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs"
                />
              </div>

              <!-- Ciudad / Barrio en Tocoa -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Ciudad y Barrio de Residencia</label>
                <input 
                  v-model="candidateForm.ciudad_direccion"
                  type="text" 
                  placeholder="Ej. Barrio El Centro, Tocoa, Colón"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs"
                />
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: EXPERIENCIA LABORAL -->
          <div class="space-y-2 pt-4 border-t border-slate-100">
            <label class="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span>📝</span>
                <span>Resumen de Experiencia Previa y Habilidades</span>
              </span>
              <span class="text-[10px] text-slate-400">Breve descripción</span>
            </label>
            <textarea 
              v-model="candidateForm.experiencia_previa"
              rows="3"
              placeholder="Cuéntanos dónde has trabajado, experiencia en atención al cliente, ventas, manejo de caja, etc."
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs"
            ></textarea>
          </div>

          <!-- SECCIÓN 4: SUBIDA DE HOJA DE VIDA / CV -->
          <div class="space-y-3 pt-4 border-t border-slate-100">
            <label class="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <span>📄</span>
                <span>Adjuntar Hoja de Vida / Currículum Vitae (CV) *</span>
              </span>
              <span class="text-[10px] text-slate-400">PDF, Word o Imagen (máx. 15 MB)</span>
            </label>

            <!-- Si ya está subido -->
            <div v-if="candidateForm.cv_archivo_url" class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-3xl">📄</span>
                <div>
                  <p class="text-xs font-extrabold text-emerald-900">{{ uploadedFileName || 'Hoja de Vida Adjuntada' }}</p>
                  <p class="text-[11px] text-emerald-700">✓ Archivo cargado exitosamente en el servidor</p>
                </div>
              </div>
              <button 
                type="button" 
                @click="removeUploadedCv"
                class="px-3 py-1.5 bg-white text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition border border-rose-200 cursor-pointer"
              >
                Cambiar archivo
              </button>
            </div>

            <!-- Selector de Archivo -->
            <div v-else>
              <label 
                class="relative border-2 border-dashed border-slate-300 hover:border-opalo-500 hover:bg-rose-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition"
                :class="isUploadingCv ? 'opacity-50 pointer-events-none' : ''"
              >
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  @change="onFileSelected"
                  class="sr-only"
                />
                <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-2xl mb-2">
                  <span v-if="isUploadingCv" class="animate-spin">⏳</span>
                  <span v-else>📤</span>
                </div>
                <p class="text-xs font-bold text-slate-800">
                  {{ isUploadingCv ? 'Subiendo currículum...' : 'Haz clic para seleccionar tu Hoja de Vida o arrástrala aquí' }}
                </p>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Formatos recomendados: PDF o Word (.docx)
                </p>
              </label>
            </div>
          </div>

          <!-- MENSAJE DE ERROR -->
          <div v-if="errorMessage" class="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- BOTÓN DE ENVÍO -->
          <div class="pt-4">
            <button 
              type="submit"
              :disabled="isSubmitting || isUploadingCv || !candidateForm.cv_archivo_url"
              class="w-full py-3.5 bg-gradient-to-r from-opalo-600 via-rose-600 to-pink-600 hover:from-opalo-700 hover:to-rose-700 text-white rounded-2xl font-black text-sm transition shadow-xl shadow-opalo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span v-if="isSubmitting">⏳ Enviando Postulación...</span>
              <span v-else>🚀 Enviar mi Postulación a Ópalo Accesorios</span>
            </button>
            <p class="text-center text-[10px] text-slate-400 mt-2">
              🔒 Tus datos personales y hoja de vida serán tratados de manera confidencial exclusivamente para fines de selección de personal.
            </p>
          </div>

        </form>

      </div>

    </div>

    <!-- PIE DE PÁGINA -->
    <div class="text-center text-xs text-slate-400 mt-8">
      <p>© {{ new Date().getFullYear() }} Ópalo Accesorios • Todos los derechos reservados</p>
      <p class="text-[11px] text-slate-400 mt-0.5">Tocoa, Colón, Honduras • Moda & Tendencias</p>
    </div>

  </div>
</template>

<script setup>
// Usar layout minimalista / limpio sin barra de navegación interna de cajeros
definePageMeta({
  layout: false
});

const route = useRoute();
const config = useRuntimeConfig();

const vacancies = ref([]);
const isLoadingVacancies = ref(true);

const candidateForm = reactive({
  vacante_id: '',
  nombre_completo: '',
  identidad_dni: '',
  telefono: '',
  email: '',
  ciudad_direccion: 'Tocoa, Colón',
  puesto_interes: '',
  experiencia_previa: '',
  cv_archivo_url: ''
});

const uploadedFileName = ref('');
const isUploadingCv = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const applicationSubmitted = ref(false);

const selectedVacancy = computed(() => {
  if (!candidateForm.vacante_id || candidateForm.vacante_id === 'OTRO') return null;
  return vacancies.value.find(v => v.id === parseInt(candidateForm.vacante_id, 10)) || null;
});

const selectedVacancyTitle = computed(() => {
  return selectedVacancy.value ? selectedVacancy.value.titulo : '';
});

// Cargar las vacantes abiertas desde el backend público
const loadPublicVacancies = async () => {
  isLoadingVacancies.value = true;
  try {
    const res = await $fetch(`${config.public.apiBase}/reclutamiento/vacantes-publicas`);
    if (res && res.success) {
      vacancies.value = res.data || [];

      // Si viene un vacante_id por query param (ej. desde un QR específico), seleccionarlo
      if (route.query.vacante_id) {
        const found = vacancies.value.find(v => v.id === parseInt(route.query.vacante_id, 10));
        if (found) {
          candidateForm.vacante_id = found.id;
        }
      } else if (vacancies.value.length > 0) {
        candidateForm.vacante_id = vacancies.value[0].id;
      }
    }
  } catch (err) {
    console.error('Error cargando vacantes públicas:', err);
  } finally {
    isLoadingVacancies.value = false;
  }
};

// Manejo de la subida del archivo de Hoja de Vida
const onFileSelected = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  errorMessage.value = '';
  isUploadingCv.value = true;

  try {
    const formData = new FormData();
    formData.append('cv', file);

    const response = await $fetch(`${config.public.apiBase}/reclutamiento/upload-cv`, {
      method: 'POST',
      body: formData
    });

    if (response && response.success && response.data) {
      candidateForm.cv_archivo_url = response.data.url;
      uploadedFileName.value = file.name;
    } else {
      errorMessage.value = response?.message || 'Error al subir el currículum';
    }
  } catch (err) {
    errorMessage.value = err?.data?.message || err?.message || 'Error al subir el archivo de hoja de vida';
    candidateForm.cv_archivo_url = '';
    uploadedFileName.value = '';
  } finally {
    isUploadingCv.value = false;
  }
};

const removeUploadedCv = () => {
  candidateForm.cv_archivo_url = '';
  uploadedFileName.value = '';
};

// Enviar postulación
const submitApplication = async () => {
  errorMessage.value = '';

  if (!candidateForm.nombre_completo.trim()) {
    errorMessage.value = 'Por favor ingresa tu nombre completo';
    return;
  }
  if (!candidateForm.telefono.trim()) {
    errorMessage.value = 'Por favor ingresa tu número de teléfono o WhatsApp';
    return;
  }
  if (!candidateForm.cv_archivo_url) {
    errorMessage.value = 'Debes adjuntar tu hoja de vida en PDF o Word';
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      vacante_id: candidateForm.vacante_id === 'OTRO' ? null : candidateForm.vacante_id,
      nombre_completo: candidateForm.nombre_completo.trim(),
      identidad_dni: candidateForm.identidad_dni ? candidateForm.identidad_dni.trim() : null,
      telefono: candidateForm.telefono.trim(),
      email: candidateForm.email ? candidateForm.email.trim() : null,
      ciudad_direccion: candidateForm.ciudad_direccion ? candidateForm.ciudad_direccion.trim() : 'Tocoa, Colón',
      puesto_interes: candidateForm.vacante_id === 'OTRO' 
        ? candidateForm.puesto_interes 
        : (selectedVacancy.value ? selectedVacancy.value.titulo : 'General'),
      experiencia_previa: candidateForm.experiencia_previa ? candidateForm.experiencia_previa.trim() : null,
      cv_archivo_url: candidateForm.cv_archivo_url
    };

    const res = await $fetch(`${config.public.apiBase}/reclutamiento/postular`, {
      method: 'POST',
      body: payload
    });

    if (res && res.success) {
      applicationSubmitted.value = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      errorMessage.value = res?.message || 'Error al procesar la postulación';
    }
  } catch (err) {
    errorMessage.value = err?.data?.message || err?.message || 'No se pudo enviar la postulación. Intenta nuevamente.';
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  candidateForm.nombre_completo = '';
  candidateForm.identidad_dni = '';
  candidateForm.telefono = '';
  candidateForm.email = '';
  candidateForm.ciudad_direccion = 'Tocoa, Colón';
  candidateForm.puesto_interes = '';
  candidateForm.experiencia_previa = '';
  candidateForm.cv_archivo_url = '';
  uploadedFileName.value = '';
  errorMessage.value = '';
  applicationSubmitted.value = false;
};

const { companyConfig, getFullLogoUrl, fetchCompanyConfig } = useCompanyConfig();
const logoError = ref(false);

watch(() => companyConfig.value?.logo_url, () => {
  logoError.value = false;
});

onMounted(async () => {
  await fetchCompanyConfig();
  loadPublicVacancies();
});
</script>

