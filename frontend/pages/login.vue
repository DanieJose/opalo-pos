<template>
  <div class="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-pink-100 flex items-center justify-center p-3 sm:p-6">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-100 p-6 sm:p-10">
      
      <!-- Cabecera de Marca Dinámica con Logotipo de la Empresa -->
      <div class="text-center mb-8">
        <div class="mb-4 flex justify-center">
          <img 
            v-if="companyConfig?.logo_url && !logoError" 
            :src="getFullLogoUrl(companyConfig.logo_url)" 
            :alt="companyConfig?.nombre_empresa || 'Logo Empresa'" 
            class="h-20 max-w-[200px] object-contain rounded-2xl p-1 bg-white border border-rose-100 shadow-md shadow-rose-200/50"
            @error="logoError = true"
          />
          <div 
            v-else 
            class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-opalo-600 to-rose-400 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-opalo-300/40"
          >
            {{ (companyConfig?.nombre_empresa || 'Ó')[0].toUpperCase() }}
          </div>
        </div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight uppercase">
          {{ companyConfig?.nombre_empresa || 'ÓPALO ACCESORIOS' }}
        </h1>
        <p class="text-xs uppercase tracking-widest text-opalo-700 font-bold mt-0.5">
          {{ companyConfig?.nombre_comercial || 'Punto de Venta • POS' }}
        </p>
        <p class="text-xs text-slate-400 mt-1">
          {{ companyConfig?.ciudad || 'Tocoa, Colón' }} • {{ companyConfig?.pais || 'Honduras' }}
        </p>
      </div>

      <!-- Alerta de Error -->
      <div v-if="errorMessage" class="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
        <span class="text-base">⚠️</span>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Formulario de Acceso -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Correo Electrónico
          </label>
          <input 
            v-model="email" 
            type="email" 
            required 
            placeholder="admin@opalo.hn"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 focus:border-transparent text-sm transition"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Contraseña
          </label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opalo-500 focus:border-transparent text-sm transition"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-opalo-600 to-rose-600 hover:from-opalo-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-opalo-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
        >
          <span v-if="isLoading" class="animate-spin text-lg">⏳</span>
          <span>{{ isLoading ? 'Ingresando a Caja...' : 'Iniciar Turno en POS' }}</span>
        </button>
      </form>

      <!-- Credenciales de Prueba -->
      <div class="mt-8 pt-6 border-t border-slate-100 text-center">
        <p class="text-xs text-slate-400 font-medium">Credenciales del sistema:</p>
        <div class="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-around">
          <div><strong class="text-slate-700">Admin:</strong> admin@opalo.hn</div>
          <div><strong class="text-slate-700">Clave:</strong> Admin123!</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const { login, isLoading } = useAuth();
const { companyConfig, getFullLogoUrl, fetchCompanyConfig } = useCompanyConfig();

const email = ref('admin@opalo.hn');
const password = ref('Admin123!');
const errorMessage = ref('');
const logoError = ref(false);

watch(() => companyConfig.value?.logo_url, () => {
  logoError.value = false;
});

const handleLogin = async () => {
  if (isLoading.value) return;
  errorMessage.value = '';
  
  const result = await login(email.value, password.value);
  if (result.success) {
    // Redirigir de inmediato a la pantalla para indicar con cuánto inicia de cambio
    await navigateTo('/apertura-caja');
  } else {
    errorMessage.value = result.message || 'Credenciales inválidas';
  }
};

onMounted(async () => {
  await fetchCompanyConfig();
});
</script>

