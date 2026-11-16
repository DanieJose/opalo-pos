export interface CompanyConfig {
  id: number;
  nombre_empresa: string;
  nombre_comercial?: string;
  rtn: string;
  logo_url?: string | null;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  moneda_simbolo: string;
  moneda_codigo: string;
  isv_porcentaje: number | string;
  isv_18_porcentaje: number | string;
  cai_sar?: string;
  rango_autorizado_sar?: string;
  fecha_limite_emision?: string;
  mensaje_ticket_pie?: string;
  updated_at?: string;
}

export const useCompanyConfig = () => {
  const { apiFetch } = useApi();
  const { onEvent } = useSocket();
  const config = useRuntimeConfig();

  const backendBaseUrl = (config.public.apiBase as string).replace(/\/api\/v1\/?$/, '');

  const companyConfig = useState<CompanyConfig>('company_config', () => ({
    id: 1,
    nombre_empresa: 'Ópalo Accesorios',
    nombre_comercial: 'Ópalo',
    rtn: '02091995001230',
    logo_url: null,
    telefono: '+504 9876-5432',
    email: 'contacto@opalo.hn',
    direccion: 'Barrio El Centro, Calle Principal, Tocoa, Colón',
    ciudad: 'Tocoa, Colón',
    pais: 'Honduras',
    moneda_simbolo: 'L.',
    moneda_codigo: 'HNL',
    isv_porcentaje: 15,
    isv_18_porcentaje: 18,
    cai_sar: 'E54D7A-B981F2-9942B5-17C3D8-72AE10-94',
    rango_autorizado_sar: '000-001-01-00000001 a 000-001-01-00050000',
    fecha_limite_emision: '2026-12-31',
    mensaje_ticket_pie: '¡Gracias por su compra en Ópalo Accesorios!\nPrendas y accesorios con estilo único.\nNo se aceptan devoluciones sin este recibo.'
  }));

  const isLoading = useState<boolean>('company_config_loading', () => false);
  const logoTimestamp = useState<number>('company_logo_timestamp', () => Date.now());

  const getFullLogoUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    // Usar ruta relativa para que pase directamente por el proxy de Nuxt (/uploads/** -> backend:4000)
    // Esto garantiza:
    // 1. Mismo origen exacto (cero bloqueos de CORS o CORP en navegadores modernos).
    // 2. Soporte perfecto tanto en localhost como en 127.0.0.1 y desde móviles/tablets en la red local.
    // 3. Cero discrepancias (hydration mismatch) entre SSR y el renderizado del cliente.
    const hasQuery = cleanPath.includes('?');
    return `${cleanPath}${hasQuery ? '&' : '?'}v=${logoTimestamp.value}`;
  };

  const fetchCompanyConfig = async () => {
    isLoading.value = true;
    try {
      const response = await apiFetch<any>('/configuracion');
      if (response && response.success && response.data) {
        companyConfig.value = response.data;
        logoTimestamp.value = Date.now();
      }
    } catch (err) {
      console.warn('[useCompanyConfig] No se pudo cargar configuración del backend, usando caché local:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const saveCompanyConfig = async (updatedData: Partial<CompanyConfig>) => {
    const response = await apiFetch<any>('/configuracion', {
      method: 'PUT',
      body: updatedData
    });
    if (response && response.success && response.data) {
      companyConfig.value = response.data;
      logoTimestamp.value = Date.now();
    }
    return response;
  };

  const uploadLogoFile = async (file: File) => {
    const tokenCookie = useCookie<string | null>('opalo_token');
    const formData = new FormData();
    formData.append('logo', file);

    const fullUrl = `${config.public.apiBase}/configuracion/logo`;
    const response = await $fetch<any>(fullUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`
      },
      body: formData
    });

    if (response && response.success && response.data) {
      logoTimestamp.value = Date.now();
      companyConfig.value.logo_url = response.data.url;
    }
    return response;
  };

  const removeLogo = async () => {
    const response = await apiFetch<any>('/configuracion/logo', {
      method: 'DELETE'
    });
    logoTimestamp.value = Date.now();
    companyConfig.value.logo_url = null;
    return response;
  };

  // Inicializar listeners en tiempo real para cambios de logo o datos
  if (process.client) {
    onEvent('configuracion:actualizada', (data: CompanyConfig) => {
      companyConfig.value = { ...companyConfig.value, ...data };
      logoTimestamp.value = Date.now();
    });

    onEvent('configuracion:logo_actualizado', (payload: { logo_url: string | null }) => {
      companyConfig.value.logo_url = payload.logo_url;
      logoTimestamp.value = Date.now();
    });
  }

  return {
    companyConfig,
    isLoading,
    logoTimestamp,
    getFullLogoUrl,
    fetchCompanyConfig,
    saveCompanyConfig,
    uploadLogoFile,
    removeLogo
  };
};

