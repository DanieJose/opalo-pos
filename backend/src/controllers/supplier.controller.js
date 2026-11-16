const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../utils/logger.service');
const { getIO } = require('../config/socket');
const { getLocalDateString } = require('../utils/date');

/**
 * Listar proveedores con filtros, búsqueda, productos y métricas de cuentas por pagar
 * GET /api/v1/proveedores
 */
const getSuppliers = async (req, res, next) => {
  try {
    const { search, estado, categoria, con_deuda, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT pr.*, 
             COUNT(DISTINCT p.id) AS total_productos,
             COALESCE(cxp.total_facturas, 0) AS total_facturas,
             COALESCE(cxp.facturas_pendientes, 0) AS facturas_pendientes,
             COALESCE(cxp.total_facturado, 0) AS total_facturado,
             COALESCE(cxp.total_pagado, 0) AS total_pagado,
             COALESCE(cxp.saldo_pendiente, 0) AS saldo_pendiente
      FROM proveedores pr
      LEFT JOIN productos p ON pr.id = p.proveedor_id
      LEFT JOIN (
        SELECT proveedor_id,
               COUNT(*) AS total_facturas,
               SUM(CASE WHEN saldo_pendiente > 0 THEN 1 ELSE 0 END) AS facturas_pendientes,
               COALESCE(SUM(monto_total), 0) AS total_facturado,
               COALESCE(SUM(monto_pagado), 0) AS total_pagado,
               COALESCE(SUM(saldo_pendiente), 0) AS saldo_pendiente
        FROM cuentas_por_pagar
        GROUP BY proveedor_id
      ) cxp ON pr.id = cxp.proveedor_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (pr.nombre_empresa LIKE ? OR pr.contacto_nombre LIKE ? OR pr.rtn LIKE ? OR pr.telefono LIKE ? OR pr.ciudad LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    if (estado && estado.trim() !== '') {
      query += ` AND pr.estado = ?`;
      params.push(estado.trim());
    }

    if (categoria && categoria.trim() !== '') {
      query += ` AND pr.categoria_suministro LIKE ?`;
      params.push(`%${categoria.trim()}%`);
    }

    if (con_deuda === 'true' || con_deuda === '1') {
      query += ` AND COALESCE(cxp.saldo_pendiente, 0) > 0`;
    }

    query += ` GROUP BY pr.id ORDER BY pr.nombre_empresa ASC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const [rows] = await db.query(query, params);

    // Conteo total para paginación
    let countQuery = `
      SELECT COUNT(DISTINCT pr.id) AS total 
      FROM proveedores pr
      LEFT JOIN (
        SELECT proveedor_id, COALESCE(SUM(saldo_pendiente), 0) AS saldo_pendiente
        FROM cuentas_por_pagar
        GROUP BY proveedor_id
      ) cxp ON pr.id = cxp.proveedor_id
      WHERE 1=1
    `;
    const countParams = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      countQuery += ` AND (pr.nombre_empresa LIKE ? OR pr.contacto_nombre LIKE ? OR pr.rtn LIKE ? OR pr.telefono LIKE ? OR pr.ciudad LIKE ?)`;
      countParams.push(term, term, term, term, term);
    }
    if (estado && estado.trim() !== '') {
      countQuery += ` AND pr.estado = ?`;
      countParams.push(estado.trim());
    }
    if (categoria && categoria.trim() !== '') {
      countQuery += ` AND pr.categoria_suministro LIKE ?`;
      countParams.push(`%${categoria.trim()}%`);
    }
    if (con_deuda === 'true' || con_deuda === '1') {
      countQuery += ` AND COALESCE(cxp.saldo_pendiente, 0) > 0`;
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // Resumen de estadísticas globales y financieras
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) AS total_proveedores,
        SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) AS activos,
        COUNT(DISTINCT categoria_suministro) AS total_categorias,
        (SELECT COALESCE(SUM(saldo_pendiente), 0) FROM cuentas_por_pagar) AS total_deuda_proveedores,
        (SELECT COUNT(DISTINCT proveedor_id) FROM cuentas_por_pagar WHERE saldo_pendiente > 0) AS proveedores_con_deuda,
        (SELECT COALESCE(SUM(monto), 0) FROM gastos_financieros WHERE categoria = 'PAGO_PROVEEDORES') AS total_pagos_historicos
      FROM proveedores
    `);

    return successResponse(res, {
      message: 'Proveedores obtenidos exitosamente',
      data: rows,
      stats: stats[0],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un proveedor por ID con sus productos asociados
 * GET /api/v1/proveedores/:id
 */
const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [suppliers] = await db.query(
      `SELECT * FROM proveedores WHERE id = ?`,
      [id]
    );

    if (suppliers.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Proveedor no encontrado'
      });
    }

    const supplier = suppliers[0];

    // Obtener productos asociados a este proveedor
    const [products] = await db.query(
      `SELECT p.id, p.nombre, p.precio_base, c.nombre AS categoria_nombre,
              COALESCE(SUM(v.stock), 0) AS stock_total
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       LEFT JOIN variantes_producto v ON p.id = v.producto_id
       WHERE p.proveedor_id = ?
       GROUP BY p.id`,
      [id]
    );

    return successResponse(res, {
      message: 'Detalle de proveedor obtenido',
      data: {
        ...supplier,
        productos: products
      }
    });
  } catch (error) {
    next(error);
  }
};

const formatCategoriasSuministro = (val) => {
  if (Array.isArray(val)) {
    return val.map(c => typeof c === 'string' ? c.trim() : '').filter(Boolean).join(', ');
  }
  return typeof val === 'string' && val.trim() !== '' ? val.trim() : null;
};

/**
 * Crear un nuevo proveedor
 * POST /api/v1/proveedores
 */
const createSupplier = async (req, res, next) => {
  try {
    const {
      nombre_empresa,
      contacto_nombre,
      rtn,
      telefono,
      telefono_secundario,
      email,
      direccion,
      ciudad = 'Tocoa',
      categoria_suministro,
      dias_credito = 0,
      banco,
      cuenta_bancaria,
      notas
    } = req.body;

    if (!nombre_empresa || nombre_empresa.trim() === '') {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El nombre de la empresa o distribuidor es obligatorio'
      });
    }

    if (!telefono || telefono.trim() === '') {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El teléfono principal del proveedor es obligatorio'
      });
    }

    // Verificar si el RTN ya existe si se proporcionó
    if (rtn && rtn.trim() !== '') {
      const [existingRtn] = await db.query(
        `SELECT id FROM proveedores WHERE rtn = ? LIMIT 1`,
        [rtn.trim()]
      );
      if (existingRtn.length > 0) {
        return errorResponse(res, {
          statusCode: 409,
          message: `Ya existe un proveedor registrado con el RTN: ${rtn.trim()}`
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO proveedores (
        nombre_empresa, contacto_nombre, rtn, telefono, telefono_secundario,
        email, direccion, ciudad, categoria_suministro, dias_credito,
        banco, cuenta_bancaria, notas, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
      [
        nombre_empresa.trim(),
        contacto_nombre ? contacto_nombre.trim() : null,
        rtn ? rtn.trim() : null,
        telefono.trim(),
        telefono_secundario ? telefono_secundario.trim() : null,
        email ? email.trim().toLowerCase() : null,
        direccion ? direccion.trim() : null,
        ciudad ? ciudad.trim() : 'Tocoa',
        formatCategoriasSuministro(categoria_suministro),
        parseInt(dias_credito, 10) || 0,
        banco ? banco.trim() : null,
        cuenta_bancaria ? cuenta_bancaria.trim() : null,
        notas ? notas.trim() : null
      ]
    );

    const nuevoId = result.insertId;
    const [nuevo] = await db.query(`SELECT * FROM proveedores WHERE id = ?`, [nuevoId]);

    // Auditoría
    await logActivity({
      req,
      modulo: 'PROVEEDORES',
      accion: 'CREAR_PROVEEDOR',
      descripcion: `Nuevo proveedor creado: "${nombre_empresa}" (ID: ${nuevoId})`,
      detalles: nuevo[0]
    });

    // Notificación en tiempo real
    try {
      const io = getIO();
      if (io) {
        io.emit('pos:proveedor_created', nuevo[0]);
      }
    } catch (e) {
      console.warn('Socket warning:', e.message);
    }

    return successResponse(res, {
      statusCode: 201,
      message: 'Proveedor registrado exitosamente en Ópalo Accesorios',
      data: nuevo[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar proveedor existente
 * PUT /api/v1/proveedores/:id
 */
const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombre_empresa,
      contacto_nombre,
      rtn,
      telefono,
      telefono_secundario,
      email,
      direccion,
      ciudad,
      categoria_suministro,
      dias_credito,
      banco,
      cuenta_bancaria,
      notas,
      estado
    } = req.body;

    const [existing] = await db.query(`SELECT * FROM proveedores WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar si el nuevo RTN colisiona con otro proveedor
    if (rtn && rtn.trim() !== '') {
      const [rtnDup] = await db.query(
        `SELECT id FROM proveedores WHERE rtn = ? AND id != ? LIMIT 1`,
        [rtn.trim(), id]
      );
      if (rtnDup.length > 0) {
        return errorResponse(res, {
          statusCode: 409,
          message: `El RTN ${rtn.trim()} ya pertenece a otro proveedor`
        });
      }
    }

    await db.query(
      `UPDATE proveedores SET
        nombre_empresa = COALESCE(?, nombre_empresa),
        contacto_nombre = ?,
        rtn = ?,
        telefono = COALESCE(?, telefono),
        telefono_secundario = ?,
        email = ?,
        direccion = ?,
        ciudad = COALESCE(?, ciudad),
        categoria_suministro = ?,
        dias_credito = COALESCE(?, dias_credito),
        banco = ?,
        cuenta_bancaria = ?,
        notas = ?,
        estado = COALESCE(?, estado)
       WHERE id = ?`,
      [
        nombre_empresa ? nombre_empresa.trim() : null,
        contacto_nombre ? contacto_nombre.trim() : null,
        rtn ? rtn.trim() : null,
        telefono ? telefono.trim() : null,
        telefono_secundario ? telefono_secundario.trim() : null,
        email ? email.trim().toLowerCase() : null,
        direccion ? direccion.trim() : null,
        ciudad ? ciudad.trim() : null,
        formatCategoriasSuministro(categoria_suministro),
        dias_credito !== undefined ? parseInt(dias_credito, 10) : null,
        banco ? banco.trim() : null,
        cuenta_bancaria ? cuenta_bancaria.trim() : null,
        notas ? notas.trim() : null,
        estado || null,
        id
      ]
    );

    const [updated] = await db.query(`SELECT * FROM proveedores WHERE id = ?`, [id]);

    await logActivity({
      req,
      modulo: 'PROVEEDORES',
      accion: 'ACTUALIZAR_PROVEEDOR',
      descripcion: `Proveedor actualizado: "${updated[0].nombre_empresa}" (ID: ${id})`,
      detalles: updated[0]
    });

    try {
      const io = getIO();
      if (io) {
        io.emit('pos:proveedor_updated', updated[0]);
      }
    } catch (e) {
      console.warn('Socket warning:', e.message);
    }

    return successResponse(res, {
      message: 'Proveedor actualizado exitosamente',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar estado de proveedor (Activo / Inactivo)
 * PATCH /api/v1/proveedores/:id/estado
 */
const toggleSupplierStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(`SELECT id, nombre_empresa, estado FROM proveedores WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Proveedor no encontrado'
      });
    }

    const nuevoEstado = existing[0].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    await db.query(`UPDATE proveedores SET estado = ? WHERE id = ?`, [nuevoEstado, id]);

    await logActivity({
      req,
      modulo: 'PROVEEDORES',
      accion: 'CAMBIO_ESTADO',
      descripcion: `Estado de proveedor "${existing[0].nombre_empresa}" cambiado a ${nuevoEstado}`,
      detalles: { proveedor_id: id, estado_anterior: existing[0].estado, nuevo_estado: nuevoEstado }
    });

    try {
      const io = getIO();
      if (io) {
        io.emit('pos:proveedor_updated', { id, estado: nuevoEstado });
      }
    } catch (e) {
      console.warn('Socket warning:', e.message);
    }

    return successResponse(res, {
      message: `Proveedor ahora está ${nuevoEstado.toLowerCase()}`,
      data: { id, estado: nuevoEstado }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar proveedor
 * DELETE /api/v1/proveedores/:id
 */
const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(`SELECT id, nombre_empresa FROM proveedores WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar si tiene productos asociados
    const [prods] = await db.query(`SELECT COUNT(*) AS count FROM productos WHERE proveedor_id = ?`, [id]);
    if (prods[0].count > 0) {
      // Inactivar en lugar de borrar para proteger integridad
      await db.query(`UPDATE proveedores SET estado = 'INACTIVO' WHERE id = ?`, [id]);
      return successResponse(res, {
        message: `El proveedor tiene ${prods[0].count} productos asociados, por lo que se ha marcado como INACTIVO en lugar de eliminarse.`,
        data: { id, estado: 'INACTIVO' }
      });
    }

    await db.query(`DELETE FROM proveedores WHERE id = ?`, [id]);

    await logActivity({
      req,
      modulo: 'PROVEEDORES',
      accion: 'ELIMINAR_PROVEEDOR',
      descripcion: `Proveedor eliminado: "${existing[0].nombre_empresa}" (ID: ${id})`
    });

    return successResponse(res, {
      message: 'Proveedor eliminado del sistema'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener Estado de Cuenta Completo, Facturas e Historial de Pagos de un Proveedor
 * GET /api/v1/proveedores/:id/estado-cuenta
 */
const getSupplierAccountStatement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [suppliers] = await db.query(
      `SELECT * FROM proveedores WHERE id = ?`,
      [id]
    );

    if (suppliers.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Proveedor no encontrado'
      });
    }

    const supplier = suppliers[0];

    // Cuentas por pagar / facturas del proveedor
    const [invoices] = await db.query(
      `SELECT cxp.*,
              DATEDIFF(cxp.fecha_vencimiento, CURDATE()) AS dias_para_vencer
       FROM cuentas_por_pagar cxp
       WHERE cxp.proveedor_id = ?
       ORDER BY (cxp.saldo_pendiente > 0) DESC, cxp.fecha_vencimiento ASC`,
      [id]
    );

    // Historial de pagos y abonos realizados a este proveedor
    const [payments] = await db.query(
      `SELECT g.*, 
              u.nombre AS usuario_nombre,
              cxp.numero_factura_proveedor
       FROM gastos_financieros g
       LEFT JOIN usuarios u ON g.usuario_id = u.id
       LEFT JOIN cuentas_por_pagar cxp ON g.cuenta_por_pagar_id = cxp.id
       WHERE g.proveedor_id = ? AND g.categoria = 'PAGO_PROVEEDORES'
       ORDER BY g.fecha_gasto DESC, g.id DESC`,
      [id]
    );

    // Resumen financiero
    const totalFacturado = invoices.reduce((acc, it) => acc + parseFloat(it.monto_total || 0), 0);
    const totalPagado = invoices.reduce((acc, it) => acc + parseFloat(it.monto_pagado || 0), 0);
    const saldoPendiente = invoices.reduce((acc, it) => acc + parseFloat(it.saldo_pendiente || 0), 0);
    const facturasPendientes = invoices.filter(it => parseFloat(it.saldo_pendiente) > 0).length;

    return successResponse(res, {
      message: 'Estado de cuenta del proveedor obtenido exitosamente',
      data: {
        proveedor: supplier,
        resumen: {
          total_facturado: parseFloat(totalFacturado.toFixed(2)),
          total_pagado: parseFloat(totalPagado.toFixed(2)),
          saldo_pendiente: parseFloat(saldoPendiente.toFixed(2)),
          facturas_totales: invoices.length,
          facturas_pendientes: facturasPendientes
        },
        facturas: invoices,
        historial_pagos: payments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar una nueva factura de compra a crédito para un proveedor
 * POST /api/v1/proveedores/:id/facturas
 */
const createSupplierInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { numero_factura_proveedor, descripcion, monto_total, fecha_emision, fecha_vencimiento, notas } = req.body;

    if (!numero_factura_proveedor || !monto_total) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debe ingresar el número de factura y el monto total de la compra'
      });
    }

    const [suppliers] = await db.query('SELECT * FROM proveedores WHERE id = ?', [id]);
    if (suppliers.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Proveedor no encontrado' });
    }

    const sup = suppliers[0];
    const parsedMonto = parseFloat(monto_total);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      return errorResponse(res, { statusCode: 400, message: 'El monto total debe ser mayor a 0' });
    }

    // Calcular fecha de vencimiento si no se provee
    let dueDate = fecha_vencimiento;
    if (!dueDate) {
      const emisionDate = fecha_emision ? new Date(fecha_emision) : new Date();
      const diasCredito = sup.dias_credito || 30;
      emisionDate.setDate(emisionDate.getDate() + diasCredito);
      dueDate = getLocalDateString(emisionDate);
    }

    const emisionDateStr = fecha_emision || getLocalDateString();

    const [result] = await db.query(
      `INSERT INTO cuentas_por_pagar (
         proveedor_id, numero_factura_proveedor, descripcion,
         monto_total, monto_pagado, saldo_pendiente,
         fecha_emision, fecha_vencimiento, estado, notas
       ) VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, 'PENDIENTE', ?)`,
      [
        id,
        numero_factura_proveedor.trim(),
        descripcion ? descripcion.trim() : `Compra de mercadería - ${sup.nombre_empresa}`,
        parsedMonto,
        parsedMonto,
        emisionDateStr,
        dueDate,
        notas ? notas.trim() : null
      ]
    );

    const newId = result.insertId;

    await logActivity({
      req,
      modulo: 'PROVEEDORES',
      accion: 'NUEVA_FACTURA_PROVEEDOR',
      descripcion: `Factura ${numero_factura_proveedor} registrada para "${sup.nombre_empresa}" por L. ${parsedMonto.toFixed(2)}`,
      detalles: { cxp_id: newId, proveedor_id: id, monto: parsedMonto }
    });

    return successResponse(res, {
      statusCode: 201,
      message: `Factura ${numero_factura_proveedor} registrada exitosamente para ${sup.nombre_empresa}`,
      data: {
        id: newId,
        proveedor_id: id,
        numero_factura_proveedor,
        monto_total: parsedMonto,
        saldo_pendiente: parsedMonto,
        fecha_emision: emisionDateStr,
        fecha_vencimiento: dueDate,
        estado: 'PENDIENTE'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resumen consolidado de Pagos a Proveedores para el módulo de control
 * GET /api/v1/proveedores/control-pagos/resumen
 */
const getSuppliersPaymentsOverview = async (req, res, next) => {
  try {
    const { estado, proveedor_id } = req.query;

    let whereClause = '1=1';
    const params = [];

    if (estado && estado !== 'TODOS') {
      whereClause += ' AND cxp.estado = ?';
      params.push(estado);
    }
    if (proveedor_id) {
      whereClause += ' AND cxp.proveedor_id = ?';
      params.push(proveedor_id);
    }

    const [invoices] = await db.query(
      `SELECT cxp.*,
              p.nombre_empresa AS proveedor_nombre,
              p.contacto_nombre AS proveedor_contacto,
              p.telefono AS proveedor_telefono,
              p.banco AS proveedor_banco,
              p.cuenta_bancaria AS proveedor_cuenta,
              p.dias_credito AS proveedor_dias_credito,
              DATEDIFF(cxp.fecha_vencimiento, CURDATE()) AS dias_para_vencer
       FROM cuentas_por_pagar cxp
       INNER JOIN proveedores p ON cxp.proveedor_id = p.id
       WHERE ${whereClause}
       ORDER BY (cxp.saldo_pendiente > 0) DESC, cxp.fecha_vencimiento ASC`,
      params
    );

    const [stats] = await db.query(`
      SELECT 
        COALESCE(SUM(saldo_pendiente), 0) AS total_saldo_pendiente,
        COALESCE(SUM(monto_total), 0) AS total_facturado,
        COALESCE(SUM(monto_pagado), 0) AS total_abonado,
        COUNT(CASE WHEN estado IN ('PENDIENTE', 'PAGADO_PARCIAL') THEN 1 END) AS facturas_pendientes_count,
        COUNT(CASE WHEN estado = 'VENCIDO' OR (saldo_pendiente > 0 AND fecha_vencimiento < CURDATE()) THEN 1 END) AS facturas_vencidas_count,
        COUNT(CASE WHEN estado = 'PAGADO' THEN 1 END) AS facturas_liquidadas_count,
        (SELECT COALESCE(SUM(monto), 0) FROM gastos_financieros WHERE categoria = 'PAGO_PROVEEDORES') AS total_pagos_realizados
      FROM cuentas_por_pagar
    `);

    // Últimos abonos y liquidaciones realizados
    const [recentPayments] = await db.query(
      `SELECT g.*, 
              p.nombre_empresa AS proveedor_nombre,
              cxp.numero_factura_proveedor,
              u.nombre AS usuario_nombre
       FROM gastos_financieros g
       LEFT JOIN proveedores p ON g.proveedor_id = p.id
       LEFT JOIN cuentas_por_pagar cxp ON g.cuenta_por_pagar_id = cxp.id
       LEFT JOIN usuarios u ON g.usuario_id = u.id
       WHERE g.categoria = 'PAGO_PROVEEDORES'
       ORDER BY g.fecha_gasto DESC, g.id DESC
       LIMIT 30`
    );

    return successResponse(res, {
      message: 'Resumen de control de pagos a proveedores obtenido exitosamente',
      data: {
        stats: stats[0],
        facturas: invoices,
        ultimos_pagos: recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  toggleSupplierStatus,
  deleteSupplier,
  getSupplierAccountStatement,
  createSupplierInvoice,
  getSuppliersPaymentsOverview
};

