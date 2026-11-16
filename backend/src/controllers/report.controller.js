const db = require('../config/db');
const { successResponse } = require('../utils/response');
const { getLocalDateString } = require('../utils/date');

/**
 * Resumen de métricas para el Dashboard y Cierre de Caja
 * GET /api/v1/reportes/dashboard?fecha=2026-11-09
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const today = req.query.fecha || getLocalDateString();

    // 1. Resumen de ventas del día
    const [salesSummary] = await db.query(
      `SELECT 
          COUNT(*) AS total_ventas,
          COALESCE(SUM(subtotal), 0) AS total_subtotal,
          COALESCE(SUM(isv_15), 0) AS total_isv_15,
          COALESCE(SUM(isv_18), 0) AS total_isv_18,
          COALESCE(SUM(isv_15 + isv_18), 0) AS total_isv,
          COALESCE(SUM(total), 0) AS gran_total
       FROM ventas
       WHERE DATE(created_at) = ? AND estado != 'ANULADA'`,
      [today]
    );

    // 2. Resumen de devoluciones del día
    const [returnsSummary] = await db.query(
      `SELECT 
          COUNT(*) AS total_devoluciones,
          COALESCE(SUM(monto_subtotal), 0) AS total_subtotal_devuelto,
          COALESCE(SUM(monto_total), 0) AS total_devuelto
       FROM devoluciones
       WHERE DATE(created_at) = ?`,
      [today]
    );

    // 3. Ventas desglosadas por método de pago (Arqueo de caja)
    const [paymentSummary] = await db.query(
      `SELECT metodo_pago, COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total
       FROM ventas
       WHERE DATE(created_at) = ? AND estado != 'ANULADA'
       GROUP BY metodo_pago`,
      [today]
    );

    // Totales reales por medio de pago incluyendo porciones de ventas MIXTO
    const [breakdownTotals] = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN total WHEN metodo_pago = 'MIXTO' THEN monto_efectivo ELSE 0 END), 0) AS sum_efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'TARJETA' THEN total WHEN metodo_pago = 'MIXTO' THEN monto_tarjeta ELSE 0 END), 0) AS sum_tarjeta,
         COALESCE(SUM(CASE WHEN metodo_pago = 'TRANSFERENCIA' THEN total WHEN metodo_pago = 'MIXTO' THEN monto_transferencia ELSE 0 END), 0) AS sum_transferencia,
         COALESCE(SUM(CASE WHEN metodo_pago = 'MIXTO' THEN total ELSE 0 END), 0) AS sum_mixto
       FROM ventas
       WHERE DATE(created_at) = ? AND estado != 'ANULADA'`,
      [today]
    );

    // Fondo inicial de cambio registrado en turnos de caja
    const [turnosHoy] = await db.query(
      `SELECT COALESCE(SUM(monto_inicial), 0) AS total_fondo_inicial
       FROM turnos_caja
       WHERE DATE(fecha_apertura) = ?`,
      [today]
    );

    // Egresos / Salidas de dinero en efectivo de la caja del día
    const [salidasHoy] = await db.query(
      `SELECT 
         COUNT(*) AS cantidad_salidas,
         COALESCE(SUM(monto), 0) AS total_salidas
       FROM gastos_financieros
       WHERE (DATE(fecha_gasto) = ? OR DATE(created_at) = ?)
         AND metodo_pago = 'EFECTIVO'
         AND estado = 'PAGADO'`,
      [today, today]
    );

    // Devoluciones en efectivo realizadas hoy
    const [devEfectivoHoy] = await db.query(
      `SELECT 
         COUNT(*) AS cantidad_dev_efectivo,
         COALESCE(SUM(monto_total), 0) AS total_dev_efectivo
       FROM devoluciones
       WHERE DATE(created_at) = ? AND metodo_reembolso = 'EFECTIVO'`,
      [today]
    );

    // Información del turno de caja del día (abierto o más reciente)
    let [turnosInfo] = await db.query(
      `SELECT t.*, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM turnos_caja t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       WHERE DATE(t.fecha_apertura) = ?
       ORDER BY t.id DESC
       LIMIT 1`,
      [today]
    );

    // Si no hay turno con fecha exacta de hoy pero hay un turno abierto actualmente en el sistema
    if (turnosInfo.length === 0) {
      const [turnosAbiertos] = await db.query(
        `SELECT t.*, u.nombre AS usuario_nombre, u.email AS usuario_email
         FROM turnos_caja t
         INNER JOIN usuarios u ON t.usuario_id = u.id
         WHERE t.estado = 'ABIERTA'
         ORDER BY t.id DESC
         LIMIT 1`
      );
      if (turnosAbiertos.length > 0) {
        turnosInfo = turnosAbiertos;
      }
    }

    // Cálculo de montos reales por métodos de pago (incluye partes de MIXTO)
    const ventasEfectivo = parseFloat(breakdownTotals[0]?.sum_efectivo || 0);
    const ventasTarjeta = parseFloat(breakdownTotals[0]?.sum_tarjeta || 0);
    const ventasTransferencia = parseFloat(breakdownTotals[0]?.sum_transferencia || 0);
    const ventasMixto = parseFloat(breakdownTotals[0]?.sum_mixto || 0);
    
    const totalTurnosHoy = parseFloat(turnosHoy[0]?.total_fondo_inicial || 0);
    const fondoInicial = totalTurnosHoy > 0 
      ? totalTurnosHoy 
      : (turnosInfo.length > 0 ? parseFloat(turnosInfo[0].monto_inicial || 0) : 0);

    const salidasEfectivo = parseFloat(salidasHoy[0]?.total_salidas || 0);
    const devolucionesEfectivo = parseFloat(devEfectivoHoy[0]?.total_dev_efectivo || 0);

    // Dinero Físico en Efectivo que debe haber exactamente en la gaveta
    const efectivoEsperadoGaveta = parseFloat((fondoInicial + ventasEfectivo - salidasEfectivo - devolucionesEfectivo).toFixed(2));

    // 4. Cantidad de variantes con stock crítico / agotado
    const [lowStockCount] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM variantes_producto 
       WHERE stock <= stock_minimo AND estado = 'ACTIVO'`
    );

    // 5. Totales generales de catálogo
    const [catalogCount] = await db.query(
      `SELECT 
          (SELECT COUNT(*) FROM productos WHERE estado = 'ACTIVO') AS total_productos,
          (SELECT COUNT(*) FROM clientes WHERE estado = 'ACTIVO') AS total_clientes,
          (SELECT COALESCE(SUM(stock), 0) FROM variantes_producto WHERE estado = 'ACTIVO') AS stock_total_unidades`
    );

    return successResponse(res, {
      message: `Resumen de operaciones del día (${today}) obtenido correctamente`,
      data: {
        fecha: today,
        cierre_caja: {
          ventas_realizadas: salesSummary[0].total_ventas,
          subtotal: parseFloat(salesSummary[0].total_subtotal),
          isv_15: parseFloat(salesSummary[0].total_isv_15),
          isv_18: parseFloat(salesSummary[0].total_isv_18),
          total_isv: parseFloat(salesSummary[0].total_isv),
          total_ingresos: parseFloat(salesSummary[0].gran_total),
          total_devoluciones_cantidad: returnsSummary[0].total_devoluciones,
          total_devoluciones_monto: parseFloat(returnsSummary[0].total_devuelto),
          total_neto_ingresos: parseFloat((parseFloat(salesSummary[0].gran_total) - parseFloat(returnsSummary[0].total_devuelto)).toFixed(2)),
          fondo_inicial_caja: fondoInicial,
          ventas_efectivo: ventasEfectivo,
          ventas_tarjeta: ventasTarjeta,
          ventas_transferencia: ventasTransferencia,
          ventas_mixto: ventasMixto,
          salidas_efectivo_total: salidasEfectivo,
          salidas_efectivo_cantidad: salidasHoy[0].cantidad_salidas,
          devoluciones_efectivo_total: devolucionesEfectivo,
          devoluciones_efectivo_cantidad: devEfectivoHoy[0].cantidad_dev_efectivo,
          efectivo_esperado_gaveta: efectivoEsperadoGaveta,
          desglose_pagos: paymentSummary,
          turno_activo: turnosInfo.length > 0 ? turnosInfo[0] : null
        },
        inventario: {
          total_productos: catalogCount[0].total_productos,
          total_clientes: catalogCount[0].total_clientes,
          stock_total_unidades: catalogCount[0].stock_total_unidades,
          variantes_stock_bajo: lowStockCount[0].count
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista de variantes con alerta de stock mínimo
 * GET /api/v1/reportes/stock-bajo
 */
const getLowStockAlerts = async (req, res, next) => {
  try {
    const sql = `
      SELECT v.id AS variante_id, v.sku, v.codigo_barras, v.talla, v.color, 
             v.stock, v.stock_minimo, v.precio_venta,
             p.id AS producto_id, p.nombre AS producto_nombre,
             c.nombre AS categoria_nombre
      FROM variantes_producto v
      INNER JOIN productos p ON v.producto_id = p.id
      INNER JOIN categorias c ON p.categoria_id = c.id
      WHERE v.stock <= v.stock_minimo AND v.estado = 'ACTIVO' AND p.estado = 'ACTIVO'
      ORDER BY v.stock ASC
    `;

    const [rows] = await db.query(sql);

    return successResponse(res, {
      message: 'Alertas de stock mínimo obtenidas exitosamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Top de productos más vendidos
 * GET /api/v1/reportes/top-vendidos?limite=15&fecha_inicio=...&fecha_fin=...&categoria_id=...
 */
const getTopSelling = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, categoria_id, limite = 15 } = req.query;
    const limit = Math.max(1, Math.min(100, parseInt(limite, 10)));

    const whereClauses = ["s.estado = 'COMPLETADA'"];
    const params = [];

    if (fecha_inicio && fecha_fin) {
      whereClauses.push('DATE(s.created_at) BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    }

    if (categoria_id) {
      whereClauses.push('p.categoria_id = ?');
      params.push(categoria_id);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    const sql = `
      SELECT p.id AS producto_id, 
             p.nombre AS producto_nombre, 
             c.nombre AS categoria_nombre,
             v.talla, 
             v.color, 
             v.sku,
             v.precio_venta,
             SUM(dv.cantidad) AS unidades_vendidas,
             SUM(dv.subtotal) AS ingreso_generado
      FROM detalle_ventas dv
      INNER JOIN ventas s ON dv.venta_id = s.id
      INNER JOIN variantes_producto v ON dv.variante_id = v.id
      INNER JOIN productos p ON v.producto_id = p.id
      INNER JOIN categorias c ON p.categoria_id = c.id
      ${whereSQL}
      GROUP BY dv.variante_id
      ORDER BY unidades_vendidas DESC, ingreso_generado DESC
      LIMIT ?
    `;

    const [rows] = await db.query(sql, [...params, limit]);

    return successResponse(res, {
      message: 'Top productos más vendidos obtenido correctamente',
      data: rows.map(r => ({
        ...r,
        precio_venta: parseFloat(r.precio_venta),
        unidades_vendidas: parseInt(r.unidades_vendidas, 10),
        ingreso_generado: parseFloat(r.ingreso_generado)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reporte detallado de Ventas y Facturación
 * GET /api/v1/reportes/ventas?periodo=mes&fecha_inicio=...&fecha_fin=...&usuario_id=...&metodo_pago=...
 */
const getSalesReport = async (req, res, next) => {
  try {
    const { 
      fecha_inicio, 
      fecha_fin, 
      periodo = 'mes', 
      usuario_id, 
      metodo_pago 
    } = req.query;

    const today = getLocalDateString();
    let startDate = fecha_inicio;
    let endDate = fecha_fin;

    if (!startDate || !endDate) {
      const now = new Date();
      switch (periodo) {
        case 'hoy':
          startDate = today;
          endDate = today;
          break;
        case 'semana':
          const day = now.getDay() || 7;
          const s = new Date(now);
          s.setDate(s.getDate() - day + 1);
          startDate = getLocalDateString(s);
          endDate = today;
          break;
        case 'mes_anterior':
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = getLocalDateString(prevMonth);
          endDate = getLocalDateString(endPrevMonth);
          break;
        case 'anio':
          startDate = `${now.getFullYear()}-01-01`;
          endDate = `${now.getFullYear()}-12-31`;
          break;
        case 'mes':
        default:
          startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          break;
      }
    }

    const whereClauses = ["DATE(v.created_at) BETWEEN ? AND ?", "v.estado != 'ANULADA'"];
    const params = [startDate, endDate];

    if (usuario_id) {
      whereClauses.push('v.usuario_id = ?');
      params.push(usuario_id);
    }

    if (metodo_pago) {
      whereClauses.push('v.metodo_pago = ?');
      params.push(metodo_pago);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    // 1. Resumen Global de Ventas
    const [salesSummary] = await db.query(
      `SELECT 
         COUNT(*) AS total_ventas,
         COALESCE(SUM(v.subtotal), 0) AS total_subtotal,
         COALESCE(SUM(v.isv_15), 0) AS total_isv_15,
         COALESCE(SUM(v.isv_18), 0) AS total_isv_18,
         COALESCE(SUM(v.isv_15 + v.isv_18), 0) AS total_isv,
         COALESCE(SUM(v.total), 0) AS gran_total
       FROM ventas v
       ${whereSQL}`,
      params
    );

    // 2. Resumen de Devoluciones en el rango
    const [returnsSummary] = await db.query(
      `SELECT 
         COUNT(*) AS total_devoluciones,
         COALESCE(SUM(monto_subtotal), 0) AS total_subtotal_devuelto,
         COALESCE(SUM(monto_total), 0) AS total_devuelto
       FROM devoluciones
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // 3. Ventas por Día (Evolución cronológica)
    const [dailySales] = await db.query(
      `SELECT 
         DATE(v.created_at) AS fecha,
         COUNT(*) AS total_ventas,
         COALESCE(SUM(v.subtotal), 0) AS subtotal,
         COALESCE(SUM(v.isv_15 + v.isv_18), 0) AS isv,
         COALESCE(SUM(v.total), 0) AS total
       FROM ventas v
       ${whereSQL}
       GROUP BY DATE(v.created_at)
       ORDER BY fecha ASC`,
      params
    );

    // 4. Desglose por Método de Pago
    const [paymentBreakdown] = await db.query(
      `SELECT 
         v.metodo_pago,
         COUNT(*) AS cantidad,
         COALESCE(SUM(v.total), 0) AS total
       FROM ventas v
       ${whereSQL}
       GROUP BY v.metodo_pago
       ORDER BY total DESC`,
      params
    );

    // Totales reales considerando partes de ventas MIXTO
    const [mixtoParts] = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN v.metodo_pago = 'EFECTIVO' THEN v.total WHEN v.metodo_pago = 'MIXTO' THEN v.monto_efectivo ELSE 0 END), 0) AS efectivo_real,
         COALESCE(SUM(CASE WHEN v.metodo_pago = 'TARJETA' THEN v.total WHEN v.metodo_pago = 'MIXTO' THEN v.monto_tarjeta ELSE 0 END), 0) AS tarjeta_real,
         COALESCE(SUM(CASE WHEN v.metodo_pago = 'TRANSFERENCIA' THEN v.total WHEN v.metodo_pago = 'MIXTO' THEN v.monto_transferencia ELSE 0 END), 0) AS transferencia_real
       FROM ventas v
       ${whereSQL}`,
      params
    );

    // 5. Desglose por Cajero / Vendedor
    const [sellerBreakdown] = await db.query(
      `SELECT 
         u.id AS usuario_id,
         u.nombre AS cajero_nombre,
         u.email AS cajero_email,
         COUNT(v.id) AS total_ventas,
         COALESCE(SUM(v.total), 0) AS total_vendido
       FROM ventas v
       INNER JOIN usuarios u ON v.usuario_id = u.id
       ${whereSQL}
       GROUP BY u.id
       ORDER BY total_vendido DESC`,
      params
    );

    const totalFacturado = parseFloat(salesSummary[0]?.gran_total || 0);
    const totalDevuelto = parseFloat(returnsSummary[0]?.total_devuelto || 0);
    const ventasNetas = parseFloat((totalFacturado - totalDevuelto).toFixed(2));
    const cantidadVentas = parseInt(salesSummary[0]?.total_ventas || 0, 10);
    const ticketPromedio = cantidadVentas > 0 ? parseFloat((totalFacturado / cantidadVentas).toFixed(2)) : 0;

    return successResponse(res, {
      message: 'Reporte de ventas obtenido correctamente',
      data: {
        rango: {
          periodo,
          fecha_inicio: startDate,
          fecha_fin: endDate
        },
        kpis: {
          total_ventas: cantidadVentas,
          total_subtotal: parseFloat(salesSummary[0]?.total_subtotal || 0),
          total_isv_15: parseFloat(salesSummary[0]?.total_isv_15 || 0),
          total_isv_18: parseFloat(salesSummary[0]?.total_isv_18 || 0),
          total_isv: parseFloat(salesSummary[0]?.total_isv || 0),
          total_facturado: totalFacturado,
          total_devoluciones_cantidad: parseInt(returnsSummary[0]?.total_devoluciones || 0, 10),
          total_devuelto: totalDevuelto,
          ventas_netas: ventasNetas,
          ticket_promedio: ticketPromedio
        },
        ventas_por_dia: dailySales.map(d => ({
          fecha: d.fecha instanceof Date ? getLocalDateString(d.fecha) : String(d.fecha).split('T')[0],
          total_ventas: d.total_ventas,
          subtotal: parseFloat(d.subtotal),
          isv: parseFloat(d.isv),
          total: parseFloat(d.total)
        })),
        desglose_pagos: paymentBreakdown.map(p => ({
          metodo_pago: p.metodo_pago,
          cantidad: p.cantidad,
          total: parseFloat(p.total),
          porcentaje: totalFacturado > 0 ? parseFloat(((parseFloat(p.total) / totalFacturado) * 100).toFixed(1)) : 0
        })),
        totales_por_medio_reales: {
          efectivo: parseFloat(mixtoParts[0]?.efectivo_real || 0),
          tarjeta: parseFloat(mixtoParts[0]?.tarjeta_real || 0),
          transferencia: parseFloat(mixtoParts[0]?.transferencia_real || 0)
        },
        desglose_cajeros: sellerBreakdown.map(c => ({
          usuario_id: c.usuario_id,
          cajero_nombre: c.cajero_nombre,
          cajero_email: c.cajero_email,
          total_ventas: c.total_ventas,
          total_vendido: parseFloat(c.total_vendido),
          porcentaje: totalFacturado > 0 ? parseFloat(((parseFloat(c.total_vendido) / totalFacturado) * 100).toFixed(1)) : 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reporte de Existencias y Valorización del Inventario
 * GET /api/v1/reportes/inventario
 */
const getInventoryReport = async (req, res, next) => {
  try {
    // 1. Métricas Globales de Valorización
    const [valuationRows] = await db.query(
      `SELECT 
         COUNT(DISTINCT p.id) AS total_productos,
         COUNT(v.id) AS total_variantes,
         COALESCE(SUM(v.stock), 0) AS stock_total_unidades,
         COALESCE(SUM(v.stock * v.precio_costo), 0) AS valor_total_costo,
         COALESCE(SUM(v.stock * v.precio_venta), 0) AS valor_total_venta,
         COUNT(CASE WHEN v.stock <= v.stock_minimo AND v.stock > 0 THEN 1 END) AS variantes_stock_bajo,
         COUNT(CASE WHEN v.stock = 0 THEN 1 END) AS variantes_agotadas
       FROM variantes_producto v
       INNER JOIN productos p ON v.producto_id = p.id
       WHERE v.estado = 'ACTIVO' AND p.estado = 'ACTIVO'`
    );

    const valorCosto = parseFloat(valuationRows[0]?.valor_total_costo || 0);
    const valorVenta = parseFloat(valuationRows[0]?.valor_total_venta || 0);
    const gananciaPotencial = parseFloat((valorVenta - valorCosto).toFixed(2));
    const margenPotencialPct = valorVenta > 0 ? parseFloat(((gananciaPotencial / valorVenta) * 100).toFixed(1)) : 0;

    // 2. Valorización y existencias por Categoría
    const [byCategory] = await db.query(
      `SELECT 
         c.id AS categoria_id,
         c.nombre AS categoria_nombre,
         COUNT(DISTINCT p.id) AS total_productos,
         COUNT(v.id) AS total_variantes,
         COALESCE(SUM(v.stock), 0) AS stock_unidades,
         COALESCE(SUM(v.stock * v.precio_costo), 0) AS valor_costo,
         COALESCE(SUM(v.stock * v.precio_venta), 0) AS valor_venta
       FROM categorias c
       LEFT JOIN productos p ON c.id = p.categoria_id AND p.estado = 'ACTIVO'
       LEFT JOIN variantes_producto v ON p.id = v.producto_id AND v.estado = 'ACTIVO'
       WHERE c.estado = 'ACTIVO'
       GROUP BY c.id
       ORDER BY valor_venta DESC`
    );

    // 3. Variantes en riesgo (Agotadas o Stock Crítico)
    const [criticalStock] = await db.query(
      `SELECT 
         v.id AS variante_id,
         v.sku,
         v.codigo_barras,
         v.talla,
         v.color,
         v.stock,
         v.stock_minimo,
         v.precio_costo,
         v.precio_venta,
         p.nombre AS producto_nombre,
         c.nombre AS categoria_nombre,
         (v.stock * v.precio_venta) AS valor_inventario_actual
       FROM variantes_producto v
       INNER JOIN productos p ON v.producto_id = p.id
       INNER JOIN categorias c ON p.categoria_id = c.id
       WHERE v.stock <= v.stock_minimo AND v.estado = 'ACTIVO' AND p.estado = 'ACTIVO'
       ORDER BY v.stock ASC, p.nombre ASC
       LIMIT 50`
    );

    return successResponse(res, {
      message: 'Reporte de inventario y existencias obtenido correctamente',
      data: {
        resumen_valorizacion: {
          total_productos: valuationRows[0]?.total_productos || 0,
          total_variantes: valuationRows[0]?.total_variantes || 0,
          stock_total_unidades: valuationRows[0]?.stock_total_unidades || 0,
          valor_total_costo: valorCosto,
          valor_total_venta: valorVenta,
          ganancia_potencial: gananciaPotencial,
          margen_potencial_pct: margenPotencialPct,
          variantes_stock_bajo: valuationRows[0]?.variantes_stock_bajo || 0,
          variantes_agotadas: valuationRows[0]?.variantes_agotadas || 0
        },
        inventario_por_categoria: byCategory.map(cat => ({
          categoria_id: cat.categoria_id,
          categoria_nombre: cat.categoria_nombre,
          total_productos: cat.total_productos,
          total_variantes: cat.total_variantes,
          stock_unidades: cat.stock_unidades || 0,
          valor_costo: parseFloat(cat.valor_costo || 0),
          valor_venta: parseFloat(cat.valor_venta || 0),
          ganancia_potencial: parseFloat(((parseFloat(cat.valor_venta || 0)) - (parseFloat(cat.valor_costo || 0))).toFixed(2)),
          porcentaje_stock: valuationRows[0]?.stock_total_unidades > 0
            ? parseFloat(((cat.stock_unidades / valuationRows[0].stock_total_unidades) * 100).toFixed(1))
            : 0
        })),
        alertas_stock_critico: criticalStock.map(cs => ({
          ...cs,
          precio_costo: parseFloat(cs.precio_costo),
          precio_venta: parseFloat(cs.precio_venta),
          valor_inventario_actual: parseFloat(cs.valor_inventario_actual)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reporte de Mejores Clientes y Fidelidad
 * GET /api/v1/reportes/clientes?limite=20&fecha_inicio=...&fecha_fin=...
 */
const getTopCustomersReport = async (req, res, next) => {
  try {
    const { limite = 20, fecha_inicio, fecha_fin } = req.query;
    const limit = Math.max(1, Math.min(100, parseInt(limite, 10)));

    const whereClauses = ["v.estado != 'ANULADA'", "v.cliente_id IS NOT NULL"];
    const params = [];

    if (fecha_inicio && fecha_fin) {
      whereClauses.push('DATE(v.created_at) BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    const sql = `
      SELECT c.id AS cliente_id,
             c.nombre,
             c.rtn_dni,
             c.telefono,
             c.email,
             c.puntos_lealtad,
             COUNT(v.id) AS total_compras,
             COALESCE(SUM(v.total), 0) AS total_gastado,
             COALESCE(AVG(v.total), 0) AS ticket_promedio,
             MAX(v.created_at) AS ultima_compra
      FROM clientes c
      INNER JOIN ventas v ON c.id = v.cliente_id
      ${whereSQL}
      GROUP BY c.id
      ORDER BY total_gastado DESC
      LIMIT ?
    `;

    const [rows] = await db.query(sql, [...params, limit]);

    return successResponse(res, {
      message: 'Reporte de mejores clientes obtenido exitosamente',
      data: rows.map(r => ({
        ...r,
        total_compras: parseInt(r.total_compras, 10),
        total_gastado: parseFloat(r.total_gastado),
        ticket_promedio: parseFloat(parseFloat(r.ticket_promedio).toFixed(2)),
        ultima_compra: r.ultima_compra ? (r.ultima_compra instanceof Date ? getLocalDateString(r.ultima_compra) : String(r.ultima_compra).split('T')[0]) : null
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reporte de Ventas por Categoría de Producto
 * GET /api/v1/reportes/categorias?fecha_inicio=...&fecha_fin=...
 */
const getCategoriesReport = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const whereClauses = ["v.estado = 'COMPLETADA'"];
    const params = [];

    if (fecha_inicio && fecha_fin) {
      whereClauses.push('DATE(v.created_at) BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    }

    const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

    const sql = `
      SELECT c.id AS categoria_id,
             c.nombre AS categoria_nombre,
             COUNT(DISTINCT v.id) AS transacciones_con_categoria,
             COALESCE(SUM(dv.cantidad), 0) AS unidades_vendidas,
             COALESCE(SUM(dv.subtotal), 0) AS ingreso_subtotal,
             COALESCE(SUM(dv.cantidad * vp.precio_costo), 0) AS costo_mercancia,
             COALESCE(SUM(dv.subtotal - (dv.cantidad * vp.precio_costo)), 0) AS margen_bruto
      FROM categorias c
      INNER JOIN productos p ON c.id = p.categoria_id
      INNER JOIN variantes_producto vp ON p.id = vp.producto_id
      INNER JOIN detalle_ventas dv ON vp.id = dv.variante_id
      INNER JOIN ventas v ON dv.venta_id = v.id
      ${whereSQL}
      GROUP BY c.id
      ORDER BY ingreso_subtotal DESC
    `;

    const [rows] = await db.query(sql, params);

    const totalIngresos = rows.reduce((acc, curr) => acc + parseFloat(curr.ingreso_subtotal), 0);

    return successResponse(res, {
      message: 'Reporte de ventas por categoría obtenido exitosamente',
      data: rows.map(r => {
        const sub = parseFloat(r.ingreso_subtotal);
        const costo = parseFloat(r.costo_mercancia);
        const margen = parseFloat(r.margen_bruto);
        return {
          categoria_id: r.categoria_id,
          categoria_nombre: r.categoria_nombre,
          unidades_vendidas: parseInt(r.unidades_vendidas, 10),
          transacciones: parseInt(r.transacciones_con_categoria, 10),
          ingreso_subtotal: sub,
          costo_mercancia: costo,
          margen_bruto: margen,
          margen_porcentaje: sub > 0 ? parseFloat(((margen / sub) * 100).toFixed(1)) : 0,
          participacion_ventas_pct: totalIngresos > 0 ? parseFloat(((sub / totalIngresos) * 100).toFixed(1)) : 0
        };
      })
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getLowStockAlerts,
  getTopSelling,
  getSalesReport,
  getInventoryReport,
  getTopCustomersReport,
  getCategoriesReport
};

