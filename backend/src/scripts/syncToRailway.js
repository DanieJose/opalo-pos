const localToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoiQWRtaW5pc3RyYWRvciDDk3BhbG8iLCJlbWFpbCI6ImFkbWluQG9wYWxvLmhuIiwicm9sX2lkIjoxLCJyb2xfbm9tYnJlIjoiQURNSU4iLCJtb2R1bG9zX3Blcm1pdGlkb3MiOlsicG9zIiwiaW52ZW50YXJpbyIsImV0aXF1ZXRhcyIsInZlbnRhcyIsImNsaWVudGVzIiwicHJvdmVlZG9yZXMiLCJmaW5hbnphcyIsInJlcG9ydGVzIiwicmVjbHV0YW1pZW50byIsInVzdWFyaW9zIiwibG9ncyIsImNvbmZpZ3VyYWNpb24iXSwiaWF0IjoxNzk1MjM4OTY5LCJleHAiOjE3OTUzMjUzNjl9.AIvS6W3TWkpSf-fgcsIb9T5PHZ2V35PTPJOBu5QzFR4';
const railwayToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoiQWRtaW5pc3RyYWRvciDDk3BhbG8iLCJlbWFpbCI6ImFkbWluQG9wYWxvLmhuIiwicm9sX2lkIjoxLCJyb2xfbm9tYnJlIjoiQURNSU4iLCJtb2R1bG9zX3Blcm1pdGlkb3MiOlsicG9zIiwiaW52ZW50YXJpbyIsImV0aXF1ZXRhcyIsInZlbnRhcyIsImNsaWVudGVzIiwicHJvdmVlZG9yZXMiLCJmaW5hbnphcyIsInJlcG9ydGVzIiwicmVjbHV0YW1pZW50byIsInVzdWFyaW9zIiwibG9ncyIsImNvbmZpZ3VyYWNpb24iXSwiaWF0IjoxNzk1MjM4OTcyLCJleHAiOjE3OTUzMjUzNzJ9.hL6zS_sTuLUxf5ceNGEp1EzPgEPiSnZBbz1Vb7NUjHA';

const LOCAL_BASE = 'http://localhost:4000/api/v1';
const RAILWAY_BASE = 'https://opalo-pos-production.up.railway.app/api/v1';

async function sync() {
  console.log('🔄 Sincronizando catálogo completo Local -> Railway...');

  // 1. Obtener datos locales
  const [localCats, localSups, localProds] = await Promise.all([
    fetch(`${LOCAL_BASE}/categorias?estado=ACTIVO`, { headers: { Authorization: `Bearer ${localToken}` } }).then(r => r.json()),
    fetch(`${LOCAL_BASE}/proveedores`, { headers: { Authorization: `Bearer ${localToken}` } }).then(r => r.json()),
    fetch(`${LOCAL_BASE}/productos?estado=ACTIVO`, { headers: { Authorization: `Bearer ${localToken}` } }).then(r => r.json())
  ]);

  // 2. Obtener datos de Railway
  const [railCats, railSups, railProds] = await Promise.all([
    fetch(`${RAILWAY_BASE}/categorias?estado=ACTIVO`, { headers: { Authorization: `Bearer ${railwayToken}` } }).then(r => r.json()),
    fetch(`${RAILWAY_BASE}/proveedores`, { headers: { Authorization: `Bearer ${railwayToken}` } }).then(r => r.json()),
    fetch(`${RAILWAY_BASE}/productos?estado=ACTIVO`, { headers: { Authorization: `Bearer ${railwayToken}` } }).then(r => r.json())
  ]);

  const railCatMap = new Map((railCats.data || []).map(c => [c.nombre.toLowerCase().trim(), c.id]));
  const railSupMap = new Map((railSups.data || []).map(s => [s.nombre_empresa.toLowerCase().trim(), s.id]));
  const railProdMap = new Map((railProds.data || []).map(p => [p.nombre.toLowerCase().trim(), p]));

  // Sincronizar Categorías faltantes
  for (const c of localCats.data || []) {
    const key = c.nombre.toLowerCase().trim();
    if (!railCatMap.has(key)) {
      console.log(`➕ Creando categoría en Railway: ${c.nombre}`);
      const res = await fetch(`${RAILWAY_BASE}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${railwayToken}` },
        body: JSON.stringify({ nombre: c.nombre, descripcion: c.descripcion || '' })
      }).then(r => r.json());
      if (res.data?.id) railCatMap.set(key, res.data.id);
    }
  }

  // Sincronizar Proveedores faltantes
  for (const s of localSups.data || []) {
    const key = s.nombre_empresa.toLowerCase().trim();
    if (!railSupMap.has(key)) {
      console.log(`➕ Creando proveedor en Railway: ${s.nombre_empresa}`);
      const res = await fetch(`${RAILWAY_BASE}/proveedores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${railwayToken}` },
        body: JSON.stringify({
          nombre_empresa: s.nombre_empresa,
          contacto_nombre: s.contacto_nombre,
          telefono: s.telefono,
          email: s.email,
          direccion: s.direccion
        })
      }).then(r => r.json());
      if (res.data?.id) railSupMap.set(key, res.data.id);
    }
  }

  // Sincronizar Productos faltantes
  for (const p of localProds.data || []) {
    const key = p.nombre.toLowerCase().trim();
    if (!railProdMap.has(key)) {
      console.log(`➕ Creando producto en Railway: ${p.nombre}`);
      const catId = railCatMap.get((p.categoria_nombre || '').toLowerCase().trim()) || 1;
      const supId = p.proveedor_nombre ? railSupMap.get(p.proveedor_nombre.toLowerCase().trim()) : null;

      const payload = {
        nombre: p.nombre,
        descripcion: p.descripcion,
        categoria_id: catId,
        proveedor_id: supId,
        precio_costo: parseFloat(p.precio_costo) || 0,
        precio_base: parseFloat(p.precio_base) || 0,
        tipo_impuesto: p.tipo_impuesto || 'ISV_15',
        precio_incluye_isv: p.precio_incluye_isv ? 1 : 0,
        imagen_url: p.imagen_url ? p.imagen_url.replace('http://localhost:4000', 'https://opalo-pos-production.up.railway.app') : null,
        variantes: (p.variantes || []).map(v => ({
          sku: v.sku,
          codigo_barras: v.codigo_barras,
          talla: v.talla,
          color: v.color,
          precio_costo: parseFloat(v.precio_costo) || 0,
          precio_venta: parseFloat(v.precio_venta) || 0,
          precio_incluye_isv: v.precio_incluye_isv ? 1 : 0,
          descuento_porcentaje: parseFloat(v.descuento_porcentaje) || 0,
          precio_con_descuento: v.precio_con_descuento ? parseFloat(v.precio_con_descuento) : null,
          stock: v.stock || 0,
          stock_minimo: v.stock_minimo || 2,
          imagen_url: v.imagen_url
        }))
      };

      const res = await fetch(`${RAILWAY_BASE}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${railwayToken}` },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      console.log(`Respuesta creación "${p.nombre}":`, res.success ? 'OK' : res.message);
    }
  }

  // Verificar recuento final en Railway
  const finalCheck = await fetch(`${RAILWAY_BASE}/productos?estado=ACTIVO`, {
    headers: { Authorization: `Bearer ${railwayToken}` }
  }).then(r => r.json());

  console.log(`✅ Railway ahora tiene ${finalCheck.data?.length} productos activos:`);
  console.log(finalCheck.data?.map(p => `${p.id}. ${p.nombre} (${p.total_stock} disp.)`));
}

sync().catch(console.error);
