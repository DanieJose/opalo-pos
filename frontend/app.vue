<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
const { fetchCompanyConfig } = useCompanyConfig();

// Cargar la configuración institucional de la empresa (logo, datos fiscales, SAR) en SSR e hidratación
await callOnce(async () => {
  await fetchCompanyConfig();
});
</script>

