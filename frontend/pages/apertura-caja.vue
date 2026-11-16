<template>
  <div class="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-pink-100 flex items-center justify-center p-3 sm:p-6">
    <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-rose-200/50 border border-rose-100 p-5 sm:p-8 md:p-10">
      
      <!-- Cabecera de Marca -->
      <div class="text-center mb-6">
        <div class="mb-3 flex justify-center">
          <img 
            v-if="companyConfig?.logo_url && !logoError" 
            :src="getFullLogoUrl(companyConfig.logo_url)" 
            :alt="companyConfig?.nombre_empresa || 'Logo Empresa'" 
            class="h-16 max-w-[180px] object-contain rounded-2xl p-1 bg-white border border-rose-100 shadow-md shadow-rose-200/50"
            @error="logoError = true"
          />
          <div 
            v-else 
            class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-opalo-600 to-rose-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-opalo-400/30"
          >
            💵
          </div>
        </div>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-opalo-700 border border-rose-200 mb-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Apertura de Turno POS • {{ companyConfig?.nombre_comercial || 'Ópalo' }}
        </span>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Fondo Inicial de Cambio</h1>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          ¿Con cuánto efectivo inicia su caja hoy para atender a los clientes de {{ companyConfig?.nombre_empresa || 'Ópalo Accesorios' }}?
        </p>
      </div>

      <!-- Información del Cajero -->
      <div class="mb-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-opalo-100 text-opalo-700 flex items-center justify-center font-bold text-sm">
            {{ user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'C' }}
          </div>
          <div>
            <p class="text-xs font-bold text-slate-900">{{ user?.nombre || 'Cajero(a)' }}</p>
            <p class="text-[11px] text-slate-400">{{ user?.email || 'caja@opalo.hn' }} • {{ user?.rol?.nombre || 'CAJERO' }}</p>
          </div>
        </div>
        <span class="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          📍 Tocoa, Colón
        </span>
      </div>

      <!-- Alerta de Error -->
      <div v-if="errorMessage" class="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
        <span>⚠️</span>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Formulario de Fondo de Caja -->
      <form @submit.prevent="handleAbrirCaja" class="space-y-6">
        
        <!-- Input Principal de Monto -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 text-center">
            Monto de Cambio en Gaveta (Lempiras)
          </label>
          <div class="relative max-w-xs mx-auto">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-opalo-600">
              L.
            </span>
            <input 
              v-model.number="montoInicial"
              type="number" 
              step="1"
              :min="isAdmin ? 0 : 1"
              required
              autofocus
              class="w-full pl-12 pr-4 py-4 text-center text-3xl font-black text-slate-900 rounded-2xl border-2 border-opalo-200 focus:outline-none focus:border-opalo-600 focus:ring-4 focus:ring-opalo-100 transition shadow-inner bg-slate-50/50"
              placeholder="1,000"
            />
          </div>
        </div>

        <!-- Sugerencias Rápidas de Fondo Habitual -->
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
            Montos sugeridos habituales
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="preset in [500, 1000, 1500, 2000]"
              :key="preset"
              type="button"
              @click="montoInicial = preset"
              class="py-2.5 px-2 rounded-xl text-xs font-black transition border cursor-pointer text-center"
              :class="montoInicial === preset 
                ? 'bg-opalo-600 text-white border-opalo-600 shadow-md shadow-opalo-500/20' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'"
            >
              L. {{ preset.toLocaleString('es-HN') }}
            </button>
          </div>
        </div>

        <!-- Sumadores de Billetes Típicos Hondureños -->
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
            Contador rápido de billetes
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              @click="sumar(100)"
              class="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              + L. 100
            </button>
            <button
              type="button"
              @click="sumar(200)"
              class="py-2 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              + L. 200
            </button>
            <button
              type="button"
              @click="sumar(500)"
              class="py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              + L. 500
            </button>
            <button
              type="button"
              @click="montoInicial = 0"
              class="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Reiniciar
            </button>
          </div>
        </div>

        <!-- Notas u Observaciones Opcionales -->
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1">
            Observaciones o desglose de billetes (opcional)
          </label>
          <input 
            v-model="notas"
            type="text" 
            placeholder="Ej: 2 billetes de 500 y 5 billetes de 100"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 text-xs transition bg-slate-50/50"
          />
        </div>

        <!-- Botón de Confirmación Principal -->
        <button 
          type="submit" 
          :disabled="isSubmitting"
          class="w-full py-4 px-4 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white font-extrabold rounded-2xl shadow-xl shadow-opalo-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer text-sm"
        >
          <span v-if="isSubmitting" class="animate-spin text-lg">⏳</span>
          <span>{{ isSubmitting ? 'Registrando Apertura...' : 'Abrir Caja y Comenzar a Vender' }}</span>
          <span v-if="!isSubmitting">→</span>
        </button>

        <!-- Botón Secundario (Omitir o Iniciar en Cero) - Solo para Administradores -->
        <div v-if="isAdmin" class="text-center pt-2 space-y-2">
          <div>
            <button
              type="button"
              @click="abrirConCero"
              class="text-xs text-slate-400 hover:text-slate-600 font-semibold underline underline-offset-4 cursor-pointer transition"
            >
              Iniciar turno sin fondo inicial (L. 0.00)
            </button>
          </div>
          <div>
            <NuxtLink
              to="/"
              class="text-xs text-opalo-600 hover:text-opalo-700 font-bold cursor-pointer transition inline-flex items-center gap-1"
            >
              <span>Ir directamente a Caja POS</span>
              <span>→</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Mensaje informativo para Cajero(a) -->
        <div v-else class="text-center pt-2">
          <p class="text-[11px] text-slate-400 font-medium">
            🔒 El registro del fondo inicial de cambio es obligatorio para cajeros antes de comenzar a vender.
          </p>
        </div>

      </form>

    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const { user, isAdmin, isCashier, fetchProfile } = useAuth();
const { companyConfig, getFullLogoUrl, fetchCompanyConfig } = useCompanyConfig();
const { apiFetch } = useApi();
const logoError = ref(false);

watch(() => companyConfig.value?.logo_url, () => {
  logoError.value = false;
});

const montoInicial = ref(1000);
const notas = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

const sumar = (valor) => {
  montoInicial.value = (Number(montoInicial.value) || 0) + valor;
};

const handleAbrirCaja = async () => {
  errorMessage.value = '';

  const montoNum = Number(montoInicial.value);
  if (!isAdmin.value && (isNaN(montoNum) || montoNum <= 0)) {
    errorMessage.value = 'Como cajero(a), debes registrar un monto de fondo inicial mayor a L. 0.00 para comenzar el turno.';
    return;
  }

  isSubmitting.value = true;

  try {
    const res = await apiFetch('/caja/abrir', {
      method: 'POST',
      body: {
        monto_inicial: montoNum || 0,
        notas: notas.value
      }
    });

    if (res && res.success) {
      // Guardar monto inicial en sessionStorage para acceso rápido en la sesión
      if (process.client) {
        sessionStorage.setItem('opalo_caja_inicial', (montoNum || 0).toString());
      }
      await navigateTo('/');
    } else {
      errorMessage.value = res?.message || 'Error al registrar la apertura de caja';
    }
  } catch (err) {
    // Si ya tiene una caja abierta, continuar al POS
    if (err?.data?.statusCode === 409 || err?.statusCode === 409) {
      await navigateTo('/');
    } else {
      errorMessage.value = err?.data?.message || err?.message || 'Error de conexión con el servidor POS';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const abrirConCero = () => {
  montoInicial.value = 0;
  notas.value = 'Iniciado sin cambio previo';
  handleAbrirCaja();
};

onMounted(async () => {
  if (!user.value) {
    await fetchProfile();
  }
  await fetchCompanyConfig();
});
</script>

