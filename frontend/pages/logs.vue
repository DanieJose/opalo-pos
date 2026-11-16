<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
    
    <!-- Cabecera de Página -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Logs y Auditoría del Sistema</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            En Vivo (WebSockets)
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">Trazabilidad completa de cobros, inventario, accesos y cambios en Ópalo Accesorios</p>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="exportToCSV"
          :disabled="logs.length === 0"
          class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>📥</span>
          <span>Exportar CSV</span>
        </button>

        <button 
          @click="loadAllData"
          class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>🔄</span>
          <span>Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Tarjetas de Métricas -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Total Eventos Registrados</p>
          <p class="text-2xl font-black text-slate-900 mt-0.5">{{ stats?.resumen?.total_logs || 0 }}</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">📜</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Actividades de Hoy</p>
          <p class="text-2xl font-black text-emerald-600 mt-0.5">{{ stats?.resumen?.logs_hoy || 0 }}</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">⚡</span>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-[10px] font-extrabold uppercase text-slate-400">Acciones Críticas / Auditoría</p>
          <p class="text-2xl font-black text-rose-600 mt-0.5">{{ stats?.resumen?.acciones_criticas || 0 }}</p>
          <p class="text-[10px] text-slate-400">Anulaciones, ajustes y logins fallidos</p>
        </div>
        <span class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">🛡️</span>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
      <div class="flex flex-col md:flex-row items-center gap-3">
        <!-- Buscador de texto libre -->
        <div class="relative flex-1 w-full">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">🔍</span>
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="Buscar por descripción, usuario o IP..."
            @input="debounceLoadLogs"
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-opalo-500 font-medium"
          />
        </div>

        <!-- Rango de Fechas -->
        <div class="flex items-center gap-2 w-full md:w-auto">
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span class="text-slate-400 font-bold">Desde:</span>
            <input v-model="filters.fecha_inicio" type="date" @change="loadLogs" class="bg-transparent font-medium text-slate-700 focus:outline-none" />
          </div>
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span class="text-slate-400 font-bold">Hasta:</span>
            <input v-model="filters.fecha_fin" type="date" @change="loadLogs" class="bg-transparent font-medium text-slate-700 focus:outline-none" />
          </div>
          <button 
            v-if="hasActiveFilters" 
            @click="clearFilters"
            class="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 cursor-pointer"
          >
            Limpiar
          </button>
        </div>
      </div>

      <!-- Filtro de Módulos -->
      <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <button 
          v-for="mod in moduleOptions" 
          :key="mod.id"
          @click="selectModule(mod.id)"
          :class="filters.modulo === mod.id ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          class="px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer flex items-center space-x-1"
        >
          <span>{{ mod.icon }}</span>
          <span>{{ mod.label }}</span>
        </button>
      </div>
    </div>

    <!-- Tabla de Logs -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <th class="py-3 px-4">Fecha y Hora</th>
              <th class="py-3 px-4">Usuario</th>
              <th class="py-3 px-4">Módulo</th>
              <th class="py-3 px-4">Acción</th>
              <th class="py-3 px-4">Descripción del Evento</th>
              <th class="py-3 px-4">IP</th>
              <th class="py-3 px-4 text-right">Detalles</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLoading" class="text-center py-8">
              <td colspan="7" class="py-8 text-slate-400 font-semibold">Cargando registros de auditoría...</td>
            </tr>
            <tr v-else-if="logs.length === 0" class="text-center py-8">
              <td colspan="7" class="py-8 text-slate-400 font-semibold">No se encontraron eventos con los filtros seleccionados</td>
            </tr>
            <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-50/60 transition">
              <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                {{ formatDateTime(log.created_at) }}
              </td>

              <td class="py-3 px-4 font-bold text-slate-900">
                <div class="flex items-center space-x-2">
                  <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-700">
                    {{ (log.usuario_nombre || 'S').charAt(0).toUpperCase() }}
                  </div>
                  <span class="truncate max-w-[130px]">{{ log.usuario_nombre || 'Sistema POS' }}</span>
                </div>
              </td>

              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-md font-bold text-[10px]" :class="getModuleBadgeClass(log.modulo)">
                  {{ log.modulo }}
                </span>
              </td>

              <td class="py-3 px-4 font-mono font-bold text-[11px] text-slate-800">
                <span :class="getActionTextColor(log.accion)">{{ log.accion }}</span>
              </td>

              <td class="py-3 px-4 text-slate-700 font-medium">
                {{ log.descripcion }}
              </td>

              <td class="py-3 px-4 font-mono text-[10px] text-slate-400">
                {{ log.ip || '127.0.0.1' }}
              </td>

              <td class="py-3 px-4 text-right">
                <button 
                  v-if="log.detalles" 
                  @click="openDetailsModal(log)"
                  class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                >
                  Ver Datos
                </button>
                <span v-else class="text-slate-300 text-[10px]">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="meta.totalPages > 1" class="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
        <span class="text-slate-500">
          Mostrando página <strong>{{ meta.page }}</strong> de <strong>{{ meta.totalPages }}</strong> ({{ meta.total }} eventos)
        </span>
        <div class="flex items-center space-x-1.5">
          <button 
            @click="changePage(meta.page - 1)" 
            :disabled="meta.page <= 1"
            class="px-3 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
          >
            Anterior
          </button>
          <button 
            @click="changePage(meta.page + 1)" 
            :disabled="meta.page >= meta.totalPages"
            class="px-3 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- MODAL: DETALLES JSON DEL EVENTO DE AUDITORÍA                          -->
    <!-- ===================================================================== -->
    <div v-if="isDetailsModalOpen" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        <!-- Encabezado Modal -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
          <div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="getModuleBadgeClass(activeLog?.modulo)">
                {{ activeLog?.modulo }}
              </span>
              <h3 class="text-sm font-black text-slate-900 font-mono">{{ activeLog?.accion }}</h3>
            </div>
            <p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span>📅 {{ formatDateTime(activeLog?.created_at) }}</span>
              <span>•</span>
              <span class="font-semibold text-slate-600">👤 {{ activeLog?.usuario_nombre || 'Sistema' }}</span>
              <span v-if="activeLog?.ip" class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono">
                IP: {{ activeLog?.ip }}
              </span>
            </p>
          </div>
          <button @click="isDetailsModalOpen = false" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">✕</button>
        </div>

        <!-- Contenido Desplazable -->
        <div class="space-y-4 overflow-y-auto pr-1 flex-1">
          <!-- Tarjeta de Descripción -->
          <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            <span class="font-bold text-slate-900">Descripción:</span> {{ activeLog?.descripcion }}
          </div>

          <!-- Vista Estructurada de Clave - Valor (si es un objeto) -->
          <div v-if="parsedDetails && typeof parsedDetails === 'object' && !Array.isArray(parsedDetails)" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div class="bg-slate-100/70 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600">📊 Resumen de Parámetros</span>
              <span class="text-[10px] text-slate-400">{{ Object.keys(parsedDetails).length }} campos</span>
            </div>
            <div class="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              <div 
                v-for="(val, key) in parsedDetails" 
                :key="key"
                class="px-3.5 py-1.5 flex items-center justify-between text-xs hover:bg-slate-50/60"
              >
                <span class="font-medium text-slate-500 font-mono text-[11px]">{{ formatKeyLabel(key) }}</span>
                <span 
                  class="font-semibold font-mono text-slate-800 text-[11px]"
                  :class="{
                    'text-emerald-600 font-bold': key.includes('diferencia') && val === 0,
                    'text-rose-600 font-bold': key.includes('diferencia') && val !== 0,
                    'text-indigo-600': key === 'estado'
                  }"
                >
                  {{ formatValueDisplay(val, key) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Carga Técnica JSON -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                💻 Carga Técnica (Detalles JSON):
              </label>
              <button 
                type="button"
                @click="copyDetailsJson"
                class="px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{{ copiedJson ? '✓ Copiado' : '📋 Copiar JSON' }}</span>
              </button>
            </div>
            <pre class="bg-slate-900 text-emerald-400 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800 shadow-inner select-all">{{ prettyDetailsString }}</pre>
          </div>
        </div>

        <!-- Pie de Modal -->
        <div class="mt-4 pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button 
            @click="isDetailsModalOpen = false" 
            class="px-5 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-xs text-slate-700 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
const { apiFetch } = useApi();
const { onEvent } = useSocket();

const logs = ref([]);
const stats = ref(null);
const isLoading = ref(false);

const meta = ref({
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 1
});

const filters = ref({
  search: '',
  modulo: null,
  fecha_inicio: '',
  fecha_fin: ''
});

const isDetailsModalOpen = ref(false);
const activeLog = ref(null);

const moduleOptions = [
  { id: null, label: 'Todos los Módulos', icon: '✨' },
  { id: 'VENTAS', label: 'Ventas y Caja', icon: '💵' },
  { id: 'INVENTARIO', label: 'Inventario / Stock', icon: '👗' },
  { id: 'AUTH', label: 'Seguridad / Login', icon: '🔐' },
  { id: 'USUARIOS', label: 'Usuarios y Roles', icon: '👥' },
  { id: 'CLIENTES', label: 'Clientes y Lealtad', icon: '💎' },
];

const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.modulo || filters.value.fecha_inicio || filters.value.fecha_fin;
});

const loadStats = async () => {
  try {
    const res = await apiFetch('/logs/stats');
    if (res.success) {
      stats.value = res.data;
    }
  } catch (err) {
    console.error('Error cargando estadísticas de logs:', err);
  }
};

const loadLogs = async () => {
  isLoading.value = true;
  try {
    let url = `/logs?page=${meta.value.page}&limit=${meta.value.limit}&`;
    if (filters.value.modulo) url += `modulo=${filters.value.modulo}&`;
    if (filters.value.search) url += `search=${encodeURIComponent(filters.value.search)}&`;
    if (filters.value.fecha_inicio) url += `fecha_inicio=${filters.value.fecha_inicio}&`;
    if (filters.value.fecha_fin) url += `fecha_fin=${filters.value.fecha_fin}&`;

    const res = await apiFetch(url);
    if (res.success) {
      logs.value = res.data;
      meta.value = res.meta;
    }
  } catch (err) {
    console.error('Error cargando logs:', err);
  } finally {
    isLoading.value = false;
  }
};

let debounceTimeout = null;
const debounceLoadLogs = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    meta.value.page = 1;
    loadLogs();
  }, 350);
};

const selectModule = (moduleId) => {
  filters.value.modulo = moduleId;
  meta.value.page = 1;
  loadLogs();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    modulo: null,
    fecha_inicio: '',
    fecha_fin: ''
  };
  meta.value.page = 1;
  loadLogs();
};

const changePage = (newPage) => {
  meta.value.page = newPage;
  loadLogs();
};

const loadAllData = () => {
  loadStats();
  loadLogs();
};

const openDetailsModal = (log) => {
  activeLog.value = log;
  copiedJson.value = false;
  isDetailsModalOpen.value = true;
};

const copiedJson = ref(false);

const parsedDetails = computed(() => {
  if (!activeLog.value || !activeLog.value.detalles) return null;
  let val = activeLog.value.detalles;
  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {
      return { raw: val };
    }
  }
  // En caso de que haya estado doblemente serializado en la base de datos
  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {}
  }
  return val;
});

const prettyDetailsString = computed(() => {
  if (!parsedDetails.value) return '{}';
  return JSON.stringify(parsedDetails.value, null, 2);
});

const copyDetailsJson = async () => {
  try {
    await navigator.clipboard.writeText(prettyDetailsString.value);
    copiedJson.value = true;
    setTimeout(() => {
      copiedJson.value = false;
    }, 2000);
  } catch (e) {
    console.error('Error al copiar JSON:', e);
  }
};

const formatKeyLabel = (key) => {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const formatValueDisplay = (val, key) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (typeof val === 'number') {
    const k = String(key).toLowerCase();
    if (k.includes('monto') || k.includes('venta') || k.includes('salida') || k.includes('total') || k.includes('diferencia') || k.includes('devolucion') || k.includes('esperado') || k.includes('real')) {
      return `L. ${val.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return val.toString();
  }
  if (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val))) {
    return formatDateTime(val);
  }
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getModuleBadgeClass = (mod) => {
  switch (mod) {
    case 'VENTAS':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'INVENTARIO':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'AUTH':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'USUARIOS':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'CLIENTES':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getActionTextColor = (act) => {
  if (act.includes('ANULAR') || act.includes('FALLIDO') || act.includes('ELIMINAR')) {
    return 'text-rose-600';
  }
  if (act.includes('STOCK')) {
    return 'text-blue-600';
  }
  if (act.includes('LOGIN') || act.includes('VENTA')) {
    return 'text-emerald-600';
  }
  return 'text-slate-800';
};

const exportToCSV = () => {
  if (logs.value.length === 0) return;

  const headers = ['ID', 'Fecha', 'Usuario', 'Modulo', 'Accion', 'Descripcion', 'IP'];
  const rows = logs.value.map(l => [
    l.id,
    `"${l.created_at}"`,
    `"${l.usuario_nombre || 'Sistema'}"`,
    `"${l.modulo}"`,
    `"${l.accion}"`,
    `"${(l.descripcion || '').replace(/"/g, '""')}"`,
    `"${l.ip || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `auditoria_opalo_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  loadAllData();

  // Escuchar logs en tiempo real vía WebSockets
  onEvent('pos:log_created', (newLog) => {
    // Insertar el nuevo log al inicio de la lista
    logs.value.unshift(newLog);
    if (stats.value && stats.value.resumen) {
      stats.value.resumen.total_logs++;
      stats.value.resumen.logs_hoy++;
    }
  });
});
</script>

