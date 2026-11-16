const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../utils/logger.service');
const { emitEvent } = require('../config/socket');
const { getLocalDateString } = require('../utils/date');

/**
 * ============================================================================
 * CONTROLADOR DE FINANZAS, FLUJO DE CAJA, GASTOS Y ESTADO DE RESULTADOS (P&L)
 * ============================================================================
 */

// Helper para obtener rango de fechas
const resolveDateRange = (periodo, fecha_inicio, fecha_fin) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (periodo) {
    case 'hoy':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'semana':
      const day = now.getDay() || 7; // 1 = Lunes
      start = new Date(now.setDate(now.getDate() - day + 1));
      end = new Date();
      break;
    case 'anio':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    case 'personalizado':
      if (fecha_inicio && fecha_fin) {
        return { startDate: fecha_inicio, endDate: fecha_fin };
      }
      break;
    case 'mes':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
  }

  const format = (d) => d.toISOString().split('T')[0];
  return { startDate: format(start), endDate: format(end) };
};

// 1. Resumen Financiero Completo (KPIs, P&L, Flujo de Caja y Desglose de Gastos)
const getFinanceSummary = async (req, res, next) => {
  try {
    const { periodo = 'mes', fecha_inicio, fecha_fin } = req.query;
    const { startDate, endDate } = resolveDateRange(periodo, fecha_inicio, fecha_fin);

    // 1.1 Total Ventas Facturadas
    const [salesRows] = await db.query(
      `SELECT 
          COUNT(*) AS total_ventas,
          COALESCE(SUM(subtotal), 0) AS subtotal_ventas,
          COALESCE(SUM(isv_15), 0) AS isv_ventas,
          COALESCE(SUM(total), 0) AS total_facturado
       FROM ventas
       WHERE DATE(created_at) BETWEEN ? AND ? AND estado != 'ANULADA'`,
      [startDate, endDate]
    );

    // 1.2 Total Devoluciones
    const [returnsRows] = await db.query(
      `SELECT 
          COUNT(*) AS total_devoluciones,
          COALESCE(SUM(monto_subtotal), 0) AS subtotal_devuelto,
          COALESCE(SUM(monto_total), 0) AS total_devuelto
       FROM devoluciones
       WHERE DATE(created_at) BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // 1.3 Costo de Mercancía Vendida (COGS)
    const [cogsRows] = await db.query(
      `SELECT COALESCE(SUM(dv.cantidad * vp.precio_costo), 0) AS costo_bruto
       FROM detalle_ventas dv
       INNER JOIN ventas v ON dv.venta_id = v.id
       INNER JOIN variantes_producto vp ON dv.variante_id = vp.id
       WHERE DATE(v.created_at) BETWEEN ? AND ? AND v.estado != 'ANULADA'`,
      [startDate, endDate]
    );

    // 1.4 Costo de Mercancía Reintegrada en Devoluciones
    const [cogsReturnsRows] = await db.query(
      `SELECT COALESCE(SUM(dd.cantidad * vp.precio_costo), 0) AS costo_devuelto
       FROM detalle_devoluciones dd
       INNER JOIN devoluciones d ON dd.devolucion_id = d.id
       INNER JOIN variantes_producto vp ON dd.variante_id = vp.id
       WHERE DATE(d.created_at) BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // 1.5 Gastos Operativos del período
    const [expensesRows] = await db.query(
      `SELECT 
          COUNT(*) AS total_gastos_cantidad,
          COALESCE(SUM(monto), 0) AS total_gastos
       FROM gastos_financieros
       WHERE fecha_gasto BETWEEN ? AND ? AND estado = 'PAGADO'`,
      [startDate, endDate]
    );

    // 1.6 Gastos agrupados por Categoría
    const [expensesByCategory] = await db.query(
      `SELECT categoria, COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS total
       FROM gastos_financieros
       WHERE fecha_gasto BETWEEN ? AND ? AND estado = 'PAGADO'
       GROUP BY categoria
       ORDER BY total DESC`,
      [startDate, endDate]
    );

    // 1.7 Resumen Global de Cuentas por Pagar
    const [cxpRows] = await db.query(
      `SELECT 
          COUNT(*) AS total_cuentas,
          COALESCE(SUM(monto_total), 0) AS total_deuda,
          COALESCE(SUM(monto_pagado), 0) AS total_pagado,
          COALESCE(SUM(saldo_pendiente), 0) AS saldo_pendiente_total,
          COALESCE(SUM(CASE WHEN fecha_vencimiento < CURDATE() AND estado != 'PAGADO' THEN saldo_pendiente ELSE 0 END), 0) AS saldo_vencido
       FROM cuentas_por_pagar`
    );

    // 1.8 Margen promedio histórico del catálogo (como salvaguarda si no hay ventas en el período)
    const [catalogMarginRows] = await db.query(
      `SELECT COALESCE(AVG(CASE WHEN precio_venta > 0 THEN ((precio_venta - precio_costo) / precio_venta) * 100 ELSE NULL END), 35.0) AS margen_promedio
       FROM variantes_producto
       WHERE precio_venta > 0`
    );
    const catalogAvgMargin = parseFloat(catalogMarginRows[0]?.margen_promedio || 35.0);

    // Cálculos Financieros Consolidados
    const totalFacturado = parseFloat(salesRows[0].total_facturado);
    const totalDevuelto = parseFloat(returnsRows[0].total_devuelto);
    const ingresosNetos = parseFloat((totalFacturado - totalDevuelto).toFixed(2));

    const subtotalVentasNeto = parseFloat((parseFloat(salesRows[0].subtotal_ventas) - parseFloat(returnsRows[0].subtotal_devuelto)).toFixed(2));
    const costoVentasNeto = parseFloat((parseFloat(cogsRows[0].costo_bruto) - parseFloat(cogsReturnsRows[0].costo_devuelto)).toFixed(2));

    // Utilidad Bruta = Subtotal Ventas Netas - Costo de Adquisición
    const utilidadBruta = parseFloat((subtotalVentasNeto - costoVentasNeto).toFixed(2));
    const margenBrutoPct = subtotalVentasNeto > 0 ? parseFloat(((utilidadBruta / subtotalVentasNeto) * 100).toFixed(2)) : 0;

    const totalGastos = parseFloat(expensesRows[0].total_gastos);

    // Utilidad Neta = Utilidad Bruta - Gastos Operativos
    const utilidadNeta = parseFloat((utilidadBruta - totalGastos).toFixed(2));
    const margenNetoPct = ingresosNetos > 0 ? parseFloat(((utilidadNeta / ingresosNetos) * 100).toFixed(2)) : 0;

    // Flujo de Caja = Ingresos Netos - Egresos
    const flujoCajaNeto = parseFloat((ingresosNetos - totalGastos).toFixed(2));

    // 1.9 Métricas de Proyección de Utilidad y Meta de Ventas (Punto de Equilibrio)
    const metaUtilidadDeseada = parseFloat(req.query.meta_utilidad) || 20000;
    const margenUsadoPct = margenBrutoPct > 0 ? margenBrutoPct : catalogAvgMargin;
    const margenRatio = Math.max(0.01, margenUsadoPct / 100);

    // Días del período seleccionado
    const dStart = new Date(startDate + 'T00:00:00');
    const dEnd = new Date(endDate + 'T23:59:59');
    const diasPeriodo = Math.max(1, Math.round((dEnd - dStart) / (1000 * 60 * 60 * 24)));

    // Punto de Equilibrio en Lempiras: Ventas necesarias para que Utilidad Neta = 0 (cubrir todos los gastos operativos)
    const puntoEquilibrioVentas = parseFloat((totalGastos / margenRatio).toFixed(2));
    const puntoEquilibrioDiario = parseFloat((puntoEquilibrioVentas / diasPeriodo).toFixed(2));

    // Meta de Ventas Requerida para generar la Ganancia/Utilidad Proyectada Deseada
    const metaVentasRequerida = parseFloat(((totalGastos + metaUtilidadDeseada) / margenRatio).toFixed(2));
    const metaVentasDiaria = parseFloat((metaVentasRequerida / diasPeriodo).toFixed(2));

    // Progreso y Faltantes
    const ventasActuales = ingresosNetos;
    const puntoEquilibrioAlcanzado = ventasActuales >= puntoEquilibrioVentas;
    const metaAlcanzada = ventasActuales >= metaVentasRequerida;

    const ventasFaltantesEquilibrio = parseFloat(Math.max(0, puntoEquilibrioVentas - ventasActuales).toFixed(2));
    const ventasFaltantesMeta = parseFloat(Math.max(0, metaVentasRequerida - ventasActuales).toFixed(2));

    const progresoEquilibrioPct = puntoEquilibrioVentas > 0
      ? parseFloat(Math.min(100, (ventasActuales / puntoEquilibrioVentas) * 100).toFixed(1))
      : (ventasActuales > 0 ? 100 : 0);

    const progresoMetaPct = metaVentasRequerida > 0
      ? parseFloat(Math.min(100, (ventasActuales / metaVentasRequerida) * 100).toFixed(1))
      : 0;

    const proyeccionMetas = {
      meta_utilidad_deseada: metaUtilidadDeseada,
      margen_contribucion_pct: parseFloat(margenUsadoPct.toFixed(2)),
      es_margen_estimado: margenBrutoPct <= 0,
      dias_periodo: diasPeriodo,
      ventas_actuales: ventasActuales,
      gastos_operativos: totalGastos,
      utilidad_actual: utilidadNeta,
      punto_equilibrio_ventas: puntoEquilibrioVentas,
      punto_equilibrio_diario: puntoEquilibrioDiario,
      punto_equilibrio_alcanzado: puntoEquilibrioAlcanzado,
      ventas_faltantes_equilibrio: ventasFaltantesEquilibrio,
      progreso_equilibrio_pct: progresoEquilibrioPct,
      meta_ventas_requerida: metaVentasRequerida,
      meta_ventas_diaria: metaVentasDiaria,
      meta_alcanzada: metaAlcanzada,
      ventas_faltantes_meta: ventasFaltantesMeta,
      progreso_meta_pct: progresoMetaPct
    };

    return successResponse(res, {
      message: 'Resumen financiero obtenido exitosamente',
      data: {
        periodo: {
          tipo: periodo,
          fecha_inicio: startDate,
          fecha_fin: endDate
        },
        proyeccion_metas: proyeccionMetas,
        kpis: {
          ingresos_brutos: totalFacturado,
          total_devoluciones: totalDevuelto,
          ingresos_netos: ingresosNetos,
          costo_ventas: costoVentasNeto,
          utilidad_bruta: utilidadBruta,
          margen_bruto_pct: margenBrutoPct,
          gastos_operativos: totalGastos,
          utilidad_neta: utilidadNeta,
          margen_neto_pct: margenNetoPct,
          flujo_caja_neto: flujoCajaNeto
        },
        estado_resultados: {
          ingresos_netos: subtotalVentasNeto,
          costo_mercancia_vendida: costoVentasNeto,
          utilidad_bruta: utilidadBruta,
          margen_bruto_porcentaje: margenBrutoPct,
          gastos_operativos: totalGastos,
          utilidad_neta: utilidadNeta,
          margen_neto_porcentaje: margenNetoPct
        },
        gastos_por_categoria: expensesByCategory.map(cat => ({
          categoria: cat.categoria,
          cantidad: cat.cantidad,
          total: parseFloat(cat.total),
          porcentaje: totalGastos > 0 ? parseFloat(((parseFloat(cat.total) / totalGastos) * 100).toFixed(1)) : 0
        })),
        cuentas_por_pagar_resumen: {
          total_cuentas: cxpRows[0].total_cuentas,
          total_deuda: parseFloat(cxpRows[0].total_deuda),
          total_pagado: parseFloat(cxpRows[0].total_pagado),
          saldo_pendiente: parseFloat(cxpRows[0].saldo_pendiente_total),
          saldo_vencido: parseFloat(cxpRows[0].saldo_vencido)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Listar Gastos Financieros con Filtros y Paginación
const getExpenses = async (req, res, next) => {
  try {
    const { categoria, fecha_inicio, fecha_fin, search, limit = 50, page = 1 } = req.query;
    const whereClauses = [];
    const params = [];

    if (categoria) {
      whereClauses.push('g.categoria = ?');
      params.push(categoria);
    }

    if (fecha_inicio && fecha_fin) {
      whereClauses.push('g.fecha_gasto BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    }

    if (search) {
      whereClauses.push('(g.descripcion LIKE ? OR g.numero_comprobante LIKE ? OR p.nombre_empresa LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parsedLimit;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(g.monto), 0) AS gran_total
       FROM gastos_financieros g
       LEFT JOIN proveedores p ON g.proveedor_id = p.id
       ${whereSQL}`,
      params
    );

    const sql = `
      SELECT g.*,
             p.nombre_empresa AS proveedor_nombre,
             u.nombre AS usuario_nombre
      FROM gastos_financieros g
      LEFT JOIN proveedores p ON g.proveedor_id = p.id
      INNER JOIN usuarios u ON g.usuario_id = u.id
      ${whereSQL}
      ORDER BY g.fecha_gasto DESC, g.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, parsedLimit, offset]);

    return successResponse(res, {
      message: 'Gastos financieros obtenidos exitosamente',
      data: rows,
      meta: {
        total: countRows[0].total,
        monto_acumulado: parseFloat(countRows[0].gran_total),
        page: parseInt(page, 10),
        limit: parsedLimit,
        totalPages: Math.ceil(countRows[0].total / parsedLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Registrar Nuevo Gasto / Egreso
const createExpense = async (req, res, next) => {
  try {
    const {
      categoria,
      proveedor_id,
      descripcion,
      monto,
      metodo_pago,
      banco_origen,
      numero_comprobante,
      comprobante_url,
      fecha_gasto,
      estado,
      notas
    } = req.body;

    if (!descripcion || !descripcion.trim()) {
      return errorResponse(res, { statusCode: 400, message: 'La descripción del gasto es obligatoria' });
    }

    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      return errorResponse(res, { statusCode: 400, message: 'El monto del gasto debe ser un número mayor a 0' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const finalDate = fecha_gasto || todayStr;

    const sql = `
      INSERT INTO gastos_financieros (
        categoria, proveedor_id, usuario_id, descripcion, monto,
        metodo_pago, banco_origen, numero_comprobante, comprobante_url,
        fecha_gasto, estado, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      categoria || 'OTROS',
      proveedor_id ? parseInt(proveedor_id, 10) : null,
      req.user?.id || 1,
      descripcion.trim(),
      parsedMonto,
      metodo_pago || 'EFECTIVO',
      banco_origen ? banco_origen.trim() : null,
      numero_comprobante ? numero_comprobante.trim() : null,
      comprobante_url ? comprobante_url.trim() : null,
      finalDate,
      estado || 'PAGADO',
      notas ? notas.trim() : null
    ];

    const [result] = await db.query(sql, params);

    // Auditoría
    await logActivity({
      req,
      modulo: 'FINANZAS',
      accion: 'REGISTRAR_GASTO',
      descripcion: `Gasto registrado: "${descripcion.trim()}" por L. ${parsedMonto.toFixed(2)} (${categoria || 'OTROS'})`,
      detalles: { gasto_id: result.insertId, monto: parsedMonto, categoria }
    });

    emitEvent('finanzas:gasto_creado', {
      id: result.insertId,
      descripcion,
      monto: parsedMonto,
      categoria
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Gasto financiero registrado exitosamente',
      data: {
        id: result.insertId,
        descripcion,
        monto: parsedMonto,
        categoria: categoria || 'OTROS',
        fecha_gasto: finalDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Modificar Gasto Financiero
const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      categoria,
      proveedor_id,
      descripcion,
      monto,
      metodo_pago,
      banco_origen,
      numero_comprobante,
      fecha_gasto,
      estado,
      notas
    } = req.body;

    const [exists] = await db.query('SELECT id FROM gastos_financieros WHERE id = ?', [id]);
    if (exists.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Gasto financiero no encontrado' });
    }

    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      return errorResponse(res, { statusCode: 400, message: 'Monto inválido' });
    }

    const sql = `
      UPDATE gastos_financieros SET
        categoria = ?,
        proveedor_id = ?,
        descripcion = ?,
        monto = ?,
        metodo_pago = ?,
        banco_origen = ?,
        numero_comprobante = ?,
        fecha_gasto = ?,
        estado = ?,
        notas = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      categoria,
      proveedor_id ? parseInt(proveedor_id, 10) : null,
      descripcion.trim(),
      parsedMonto,
      metodo_pago,
      banco_origen,
      numero_comprobante,
      fecha_gasto,
      estado,
      notas,
      id
    ]);

    await logActivity({
      req,
      modulo: 'FINANZAS',
      accion: 'ACTUALIZAR_GASTO',
      descripcion: `Gasto ID ${id} actualizado: L. ${parsedMonto.toFixed(2)}`,
      detalles: { gasto_id: id }
    });

    return successResponse(res, {
      message: 'Gasto financiero actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// 5. Eliminar Gasto Financiero
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [exists] = await db.query('SELECT * FROM gastos_financieros WHERE id = ?', [id]);
    if (exists.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Gasto financiero no encontrado' });
    }

    await db.query('DELETE FROM gastos_financieros WHERE id = ?', [id]);

    await logActivity({
      req,
      modulo: 'FINANZAS',
      accion: 'ELIMINAR_GASTO',
      descripcion: `Gasto ID ${id} eliminado: "${exists[0].descripcion}" por L. ${parseFloat(exists[0].monto).toFixed(2)}`,
      detalles: { gasto_id: id }
    });

    return successResponse(res, {
      message: 'Gasto financiero eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// 6. Listar Cuentas por Pagar (Proveedores)
const getAccountsPayable = async (req, res, next) => {
  try {
    const { estado, proveedor_id } = req.query;
    const whereClauses = [];
    const params = [];

    if (estado) {
      whereClauses.push('cxp.estado = ?');
      params.push(estado);
    }

    if (proveedor_id) {
      whereClauses.push('cxp.proveedor_id = ?');
      params.push(proveedor_id);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT cxp.*,
             p.nombre_empresa AS proveedor_nombre,
             p.contacto_nombre AS proveedor_contacto,
             p.telefono AS proveedor_telefono,
             p.banco AS proveedor_banco,
             p.cuenta_bancaria AS proveedor_cuenta
      FROM cuentas_por_pagar cxp
      INNER JOIN proveedores p ON cxp.proveedor_id = p.id
      ${whereSQL}
      ORDER BY cxp.fecha_vencimiento ASC
    `;

    const [rows] = await db.query(sql, params);

    return successResponse(res, {
      message: 'Cuentas por pagar obtenidas exitosamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// 7. Crear Nueva Cuenta por Pagar
const createAccountPayable = async (req, res, next) => {
  try {
    const {
      proveedor_id,
      numero_factura_proveedor,
      descripcion,
      monto_total,
      fecha_emision,
      fecha_vencimiento,
      notas
    } = req.body;

    if (!proveedor_id || !numero_factura_proveedor || !monto_total || !fecha_vencimiento) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Proveedor, N° de factura, monto total y fecha de vencimiento son obligatorios'
      });
    }

    const parsedMonto = parseFloat(monto_total);
    const todayStr = new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO cuentas_por_pagar (
        proveedor_id, numero_factura_proveedor, descripcion,
        monto_total, monto_pagado, saldo_pendiente,
        fecha_emision, fecha_vencimiento, estado, notas
      ) VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, 'PENDIENTE', ?)
    `;

    const params = [
      parseInt(proveedor_id, 10),
      numero_factura_proveedor.trim(),
      descripcion ? descripcion.trim() : 'Compra de mercadería a crédito',
      parsedMonto,
      parsedMonto,
      fecha_emision || todayStr,
      fecha_vencimiento,
      notas ? notas.trim() : null
    ];

    const [result] = await db.query(sql, params);

    await logActivity({
      req,
      modulo: 'FINANZAS',
      accion: 'CREAR_CXP',
      descripcion: `Cuenta por pagar registrada: Factura ${numero_factura_proveedor} por L. ${parsedMonto.toFixed(2)}`,
      detalles: { cxp_id: result.insertId, monto: parsedMonto }
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Cuenta por pagar registrada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Abonar Pago a Cuenta por Pagar
const addPaymentToAccountPayable = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { monto_abono, metodo_pago, banco_origen, numero_comprobante, fecha_pago, notas } = req.body;

    const parsedAbono = parseFloat(monto_abono);
    if (isNaN(parsedAbono) || parsedAbono <= 0) {
      return errorResponse(res, { statusCode: 400, message: 'El monto de abono debe ser mayor a 0' });
    }

    await connection.beginTransaction();

    const [cxpRows] = await connection.query(
      `SELECT cxp.*, p.nombre_empresa AS proveedor_nombre 
       FROM cuentas_por_pagar cxp
       INNER JOIN proveedores p ON cxp.proveedor_id = p.id
       WHERE cxp.id = ? FOR UPDATE`,
      [id]
    );

    if (cxpRows.length === 0) {
      await connection.rollback();
      return errorResponse(res, { statusCode: 404, message: 'Cuenta por pagar no encontrada' });
    }

    const cxp = cxpRows[0];
    const saldoActual = parseFloat(cxp.saldo_pendiente);

    if (parsedAbono > saldoActual) {
      await connection.rollback();
      return errorResponse(res, {
        statusCode: 400,
        message: `El abono de L. ${parsedAbono.toFixed(2)} excede el saldo pendiente actual de L. ${saldoActual.toFixed(2)}`
      });
    }

    const nuevoMontoPagado = parseFloat((parseFloat(cxp.monto_pagado) + parsedAbono).toFixed(2));
    const nuevoSaldo = parseFloat((saldoActual - parsedAbono).toFixed(2));
    const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO' : 'PAGADO_PARCIAL';

    await connection.query(
      'UPDATE cuentas_por_pagar SET monto_pagado = ?, saldo_pendiente = ?, estado = ? WHERE id = ?',
      [nuevoMontoPagado, nuevoSaldo, nuevoEstado, id]
    );

    // Registrar automáticamente el egreso en gastos_financieros
    const todayStr = getLocalDateString();
    const isLiquidacion = nuevoSaldo <= 0;
    const descGasto = isLiquidacion
      ? `Liquidación Total Factura ${cxp.numero_factura_proveedor} - ${cxp.proveedor_nombre}`
      : `Abono a Factura ${cxp.numero_factura_proveedor} - ${cxp.proveedor_nombre}`;

    const [gastoResult] = await connection.query(
      `INSERT INTO gastos_financieros (
        categoria, proveedor_id, cuenta_por_pagar_id, usuario_id, descripcion, monto,
        metodo_pago, banco_origen, numero_comprobante, fecha_gasto, estado, notas
      ) VALUES ('PAGO_PROVEEDORES', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAGADO', ?)`,
      [
        cxp.proveedor_id,
        id,
        req.user?.id || 1,
        descGasto,
        parsedAbono,
        metodo_pago || 'TRANSFERENCIA',
        banco_origen || null,
        numero_comprobante || null,
        fecha_pago || todayStr,
        notas ? `${descGasto}. ${notas}` : descGasto
      ]
    );

    await connection.commit();

    await logActivity({
      req,
      modulo: 'FINANZAS',
      accion: 'ABONO_CXP',
      descripcion: `Abono de L. ${parsedAbono.toFixed(2)} a Factura ${cxp.numero_factura_proveedor} (${cxp.proveedor_nombre}). Saldo restante: L. ${nuevoSaldo.toFixed(2)}`,
      detalles: { cxp_id: id, abono: parsedAbono, nuevo_saldo: nuevoSaldo }
    });

    return successResponse(res, {
      message: `${isLiquidacion ? 'Liquidación total' : 'Abono'} de L. ${parsedAbono.toFixed(2)} procesado exitosamente. Saldo restante: L. ${nuevoSaldo.toFixed(2)}`,
      data: {
        cxp_id: id,
        pago_id: gastoResult.insertId,
        monto_abonado: parsedAbono,
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldo,
        estado: nuevoEstado,
        es_liquidacion: isLiquidacion,
        fecha_pago: fecha_pago || todayStr,
        metodo_pago: metodo_pago || 'TRANSFERENCIA',
        banco_origen: banco_origen || null,
        numero_comprobante: numero_comprobante || null
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getFinanceSummary,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getAccountsPayable,
  createAccountPayable,
  addPaymentToAccountPayable
};

