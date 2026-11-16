const db = require('../config/db');
const config = require('../config/config');
const { emitEvent } = require('../config/socket');
const { logActivity } = require('../utils/logger.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Registrar una Venta en Caja (POS Checkout)
 * POST /api/v1/ventas
 * 
 * Proceso transaccional crítico:
 * 1. Bloqueo pesimista (FOR UPDATE) para evitar sobreventa concurrente en caja.
 * 2. Validación de stock disponible por cada variante (Talla/Color).
 * 3. Deducción automática de inventario.
 * 4. Cálculo de Subtotal, ISV (15% Honduras) y Total.
 * 5. Generación de correlativo de factura de Ópalo.
 * 6. Asignación de puntos al programa de lealtad del cliente.
 */
const createSale = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const usuarioId = req.user.id;
    const {
      cliente_id,
      metodo_pago = 'EFECTIVO',
      monto_efectivo = 0,
      monto_tarjeta = 0,
      monto_transferencia = 0,
      banco_transferencia,
      monto_recibido = 0,
      notas,
      items
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'La venta debe contener al menos un producto'
      });
    }

    // Iniciar transacción MySQL
    await connection.beginTransaction();

    let subtotalVenta = 0;
    let isv15Total = 0;
    let isv18Total = 0;
    const itemsProcesados = [];

    // Validar y bloquear cada variante en la base de datos
    for (const item of items) {
      const varianteId = parseInt(item.variante_id, 10);
      const cantidad = parseInt(item.cantidad, 10);
      const descuento = parseFloat(item.descuento || 0);

      if (!varianteId || cantidad <= 0) {
        await connection.rollback();
        return errorResponse(res, {
          statusCode: 400,
          message: 'Los ítems deben contener un variante_id válido y una cantidad mayor a 0'
        });
      }

      // Consulta con FOR UPDATE para asegurar integridad de stock ante ventas simultáneas
      const [rows] = await connection.query(
        `SELECT v.id, v.sku, v.talla, v.color, v.precio_venta, v.stock, v.estado,
                COALESCE(v.precio_incluye_isv, p.precio_incluye_isv, 0) AS precio_incluye_isv,
                p.nombre AS producto_nombre,
                COALESCE(p.tipo_impuesto, 'ISV_15') AS tipo_impuesto
         FROM variantes_producto v
         INNER JOIN productos p ON v.producto_id = p.id
         WHERE v.id = ? FOR UPDATE`,
        [varianteId]
      );

      if (rows.length === 0 || rows[0].estado !== 'ACTIVO') {
        await connection.rollback();
        return errorResponse(res, {
          statusCode: 404,
          message: `La variante con ID ${varianteId} no existe o no está activa`
        });
      }

      const variante = rows[0];

      // Verificación de existencias
      if (variante.stock < cantidad) {
        await connection.rollback();
        return errorResponse(res, {
          statusCode: 400,
          message: `Stock insuficiente para "${variante.producto_nombre}" (Talla: ${variante.talla}, Color: ${variante.color}). Disponibles: ${variante.stock}, Solicitados: ${cantidad}`
        });
      }

      const precioUnitario = parseFloat(variante.precio_venta);
      const isvRate = (config.business.isvPercentage || 15) / 100;
      const precioYaIncluyeIsv = Boolean(variante.precio_incluye_isv);

      let itemSubtotal = 0;
      let itemImpuesto = 0;

      if (variante.tipo_impuesto === 'EXENTO') {
        itemSubtotal = (precioUnitario * cantidad) - descuento;
        itemImpuesto = 0.00;
      } else if (precioYaIncluyeIsv) {
        // El precio ya contiene el ISV (15%): Total línea = (precio * cant) - desc, Base = Total / 1.15
        const totalLineaCobrada = (precioUnitario * cantidad) - descuento;
        itemSubtotal = parseFloat((totalLineaCobrada / (1 + isvRate)).toFixed(2));
        itemImpuesto = parseFloat((totalLineaCobrada - itemSubtotal).toFixed(2));
      } else {
        // El precio NO contiene el ISV: Base = (precio * cant) - desc, ISV = Base * 15%
        itemSubtotal = parseFloat(((precioUnitario * cantidad) - descuento).toFixed(2));
        itemImpuesto = parseFloat((itemSubtotal * isvRate).toFixed(2));
      }

      subtotalVenta += itemSubtotal;
      isv15Total += itemImpuesto;

      // Descontar inventario de la variante
      await connection.query(
        'UPDATE variantes_producto SET stock = stock - ? WHERE id = ?',
        [cantidad, varianteId]
      );

      itemsProcesados.push({
        variante_id: varianteId,
        nombre: `${variante.producto_nombre} (${variante.talla} / ${variante.color})`,
        cantidad,
        precio_unitario: precioUnitario,
        descuento,
        subtotal: itemSubtotal,
        tipo_impuesto: variante.tipo_impuesto || 'ISV_15',
        precio_incluye_isv: precioYaIncluyeIsv ? 1 : 0,
        impuesto_monto: itemImpuesto
      });
    }

    // Totales fiscales: ISV 15% aplicado, ISV 18% siempre fijado en 0.00 por requerimiento SAR
    const isv15 = parseFloat(isv15Total.toFixed(2));
    const isv18 = 0.00;
    const total = parseFloat((subtotalVenta + isv15).toFixed(2));

    let finalMontoEfectivo = 0.00;
    let finalMontoTarjeta = 0.00;
    let finalMontoTransferencia = 0.00;
    let recibido = 0.00;
    let cambio = 0.00;

    if (metodo_pago === 'MIXTO') {
      finalMontoEfectivo = Math.max(0, parseFloat(monto_efectivo) || 0);
      finalMontoTarjeta = Math.max(0, parseFloat(monto_tarjeta) || 0);
      finalMontoTransferencia = Math.max(0, parseFloat(monto_transferencia) || 0);

      const sumaMixta = parseFloat((finalMontoEfectivo + finalMontoTarjeta + finalMontoTransferencia).toFixed(2));
      // Tolerancia de hasta 5 centavos por redondeos de ISV
      if (Math.abs(sumaMixta - total) > 0.05) {
        await connection.rollback();
        return errorResponse(res, {
          statusCode: 400,
          message: `La suma de los métodos mixtos (L. ${sumaMixta.toFixed(2)}) debe coincidir con el total a pagar (L. ${total.toFixed(2)})`
        });
      }

      if (finalMontoEfectivo > 0) {
        recibido = parseFloat(monto_recibido) || finalMontoEfectivo;
        cambio = recibido >= finalMontoEfectivo ? parseFloat((recibido - finalMontoEfectivo).toFixed(2)) : 0.00;
      } else {
        recibido = total;
        cambio = 0.00;
      }
    } else if (metodo_pago === 'EFECTIVO') {
      finalMontoEfectivo = total;
      recibido = parseFloat(monto_recibido) || total;
      cambio = recibido >= total ? parseFloat((recibido - total).toFixed(2)) : 0.00;
    } else if (metodo_pago === 'TARJETA') {
      finalMontoTarjeta = total;
      recibido = total;
      cambio = 0.00;
    } else if (metodo_pago === 'TRANSFERENCIA') {
      finalMontoTransferencia = total;
      recibido = total;
      cambio = 0.00;
    }

    // Generar correlativo de factura único (Ej: OP-2026-000001)
    const [lastSale] = await connection.query('SELECT id FROM ventas ORDER BY id DESC LIMIT 1');
    const nextNumber = lastSale.length > 0 ? lastSale[0].id + 1 : 1;
    const year = new Date().getFullYear();
    const numeroFactura = `OP-${year}-${String(nextNumber).padStart(6, '0')}`;

    // Registrar cabecera de venta con desglose de ISV 15% e ISV 18% y montos por método
    const [saleResult] = await connection.query(
      `INSERT INTO ventas 
       (numero_factura, usuario_id, cliente_id, subtotal, isv_15, isv_18, total, metodo_pago, monto_efectivo, monto_tarjeta, monto_transferencia, banco_transferencia, monto_recibido, cambio, notas, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETADA')`,
      [
        numeroFactura,
        usuarioId,
        cliente_id || null,
        subtotalVenta,
        isv15,
        isv18,
        total,
        metodo_pago,
        finalMontoEfectivo,
        finalMontoTarjeta,
        finalMontoTransferencia,
        metodo_pago === 'TRANSFERENCIA' || (metodo_pago === 'MIXTO' && finalMontoTransferencia > 0) ? banco_transferencia || null : null,
        recibido,
        cambio,
        notas || null
      ]
    );

    const ventaId = saleResult.insertId;

    // Registrar detalles de venta
    for (const item of itemsProcesados) {
      await connection.query(
        `INSERT INTO detalle_ventas (venta_id, variante_id, cantidad, precio_unitario, descuento, subtotal, tipo_impuesto, precio_incluye_isv, impuesto_monto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ventaId, item.variante_id, item.cantidad, item.precio_unitario, item.descuento, item.subtotal, item.tipo_impuesto, item.precio_incluye_isv ? 1 : 0, item.impuesto_monto]
      );
    }

    // Asignar puntos de lealtad si se asoció un cliente (1 punto por cada L. 50 gastados)
    let puntosGanados = 0;
    if (cliente_id) {
      puntosGanados = Math.floor(total / 50);
      if (puntosGanados > 0) {
        await connection.query(
          'UPDATE clientes SET puntos_lealtad = puntos_lealtad + ? WHERE id = ?',
          [puntosGanados, cliente_id]
        );
      }
    }

    // Confirmar transacción
    await connection.commit();

    const totalDescuento = itemsProcesados.reduce((acc, it) => acc + (parseFloat(it.descuento) || 0), 0);

    let clienteNombre = null;
    let clienteRtn = null;
    if (cliente_id) {
      const [cRows] = await connection.query('SELECT nombre, rtn_dni FROM clientes WHERE id = ?', [cliente_id]);
      if (cRows.length > 0) {
        clienteNombre = cRows[0].nombre;
        clienteRtn = cRows[0].rtn_dni;
      }
    }

    const responseData = {
      id: ventaId,
      numero_factura: numeroFactura,
      fecha: new Date().toISOString(),
      cajero_id: usuarioId,
      cliente_id: cliente_id || null,
      cliente_nombre: clienteNombre,
      cliente_rtn: clienteRtn,
      subtotal: subtotalVenta,
      total_descuento: parseFloat(totalDescuento.toFixed(2)),
      isv_15: isv15,
      isv_18: isv18,
      total,
      moneda: config.business.currencySymbol,
      metodo_pago,
      monto_efectivo: finalMontoEfectivo,
      monto_tarjeta: finalMontoTarjeta,
      monto_transferencia: finalMontoTransferencia,
      banco_transferencia: banco_transferencia || null,
      monto_recibido: recibido,
      cambio,
      puntos_lealtad_ganados: puntosGanados,
      items: itemsProcesados
    };

    // Emitir en tiempo real a Web y Móvil
    emitEvent('pos:sale_created', responseData);

    // Auditoría automática en logs
    logActivity({
      req,
      modulo: 'VENTAS',
      accion: 'CREAR_VENTA',
      descripcion: `Cobro en caja de ${numeroFactura} por L. ${total} (${metodo_pago})`,
      detalles: { factura: numeroFactura, total, metodo_pago, total_items: itemsProcesados.length }
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Venta procesada exitosamente',
      data: responseData
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Listar ventas con filtros (fecha, método de pago, cajero, cliente)
 * GET /api/v1/ventas?fecha_inicio=2026-11-01&fecha_fin=2026-11-09&metodo_pago=EFECTIVO
 */
const getSales = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '15', 10)));
    const offset = (page - 1) * limit;

    const { fecha_inicio, fecha_fin, metodo_pago, usuario_id, cliente_id, estado } = req.query;
    const whereClauses = [];
    const params = [];

    if (fecha_inicio) {
      whereClauses.push('DATE(v.created_at) >= ?');
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      whereClauses.push('DATE(v.created_at) <= ?');
      params.push(fecha_fin);
    }
    if (metodo_pago) {
      whereClauses.push('v.metodo_pago = ?');
      params.push(metodo_pago);
    }
    if (usuario_id) {
      whereClauses.push('v.usuario_id = ?');
      params.push(usuario_id);
    }
    if (cliente_id) {
      whereClauses.push('v.cliente_id = ?');
      params.push(cliente_id);
    }
    if (estado) {
      whereClauses.push('v.estado = ?');
      params.push(estado);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total, SUM(total) AS gran_total FROM ventas v ${whereSQL}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;
    const granTotal = countRows[0].gran_total || 0;

    const sql = `
      SELECT v.id, v.numero_factura, v.subtotal, v.isv_15, v.isv_18, v.total, 
             v.metodo_pago, v.monto_efectivo, v.monto_tarjeta, v.monto_transferencia, v.banco_transferencia, v.monto_recibido, v.cambio, 
             v.estado, v.created_at,
             u.nombre AS cajero_nombre,
             c.nombre AS cliente_nombre, c.rtn_dni AS cliente_rtn,
             COALESCE((SELECT SUM(dv.descuento) FROM detalle_ventas dv WHERE dv.venta_id = v.id), 0) AS total_descuento
      FROM ventas v
      INNER JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ${whereSQL}
      ORDER BY v.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, limit, offset]);

    return successResponse(res, {
      message: 'Historial de ventas obtenido correctamente',
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        monto_acumulado: parseFloat(granTotal)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener detalle completo de una venta y su recibo
 * GET /api/v1/ventas/:id
 */
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [saleRows] = await db.query(
      `SELECT v.*, u.nombre AS cajero_nombre, u.email AS cajero_email,
              c.nombre AS cliente_nombre, c.rtn_dni AS cliente_rtn, c.telefono AS cliente_telefono
       FROM ventas v
       INNER JOIN usuarios u ON v.usuario_id = u.id
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = ? OR v.numero_factura = ?
       LIMIT 1`,
      [id, id]
    );

    if (saleRows.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Venta no encontrada' });
    }

    const venta = saleRows[0];

    // Obtener los detalles de los productos vendidos
    const [items] = await db.query(
      `SELECT dv.id, dv.venta_id, dv.variante_id, dv.cantidad, dv.precio_unitario, dv.descuento, dv.subtotal,
              dv.tipo_impuesto, dv.precio_incluye_isv, dv.impuesto_monto,
              vp.sku, vp.talla, vp.color,
              p.nombre AS producto_nombre
       FROM detalle_ventas dv
       INNER JOIN variantes_producto vp ON dv.variante_id = vp.id
       INNER JOIN productos p ON vp.producto_id = p.id
       WHERE dv.venta_id = ?`,
      [venta.id]
    );

    // Obtener devoluciones previas registradas para esta factura
    const [returns] = await db.query(
      `SELECT d.id, d.numero_devolucion, d.monto_total, d.monto_subtotal, d.motivo, d.metodo_reembolso, d.observaciones, d.created_at,
              u.nombre AS cajero_nombre
       FROM devoluciones d
       INNER JOIN usuarios u ON d.usuario_id = u.id
       WHERE d.venta_id = ?
       ORDER BY d.id DESC`,
      [venta.id]
    );

    const [alreadyReturned] = await db.query(
      `SELECT dd.detalle_venta_id, dd.variante_id, COALESCE(SUM(dd.cantidad), 0) AS total_devuelto
       FROM detalle_devoluciones dd
       INNER JOIN devoluciones d ON dd.devolucion_id = d.id
       WHERE d.venta_id = ?
       GROUP BY dd.detalle_venta_id, dd.variante_id`,
      [venta.id]
    );

    const returnedMap = {};
    for (const r of alreadyReturned) {
      if (r.detalle_venta_id) returnedMap[r.detalle_venta_id] = parseInt(r.total_devuelto, 10);
      returnedMap[`var_${r.variante_id}`] = parseInt(r.total_devuelto, 10);
    }

    for (const it of items) {
      const devuelto = returnedMap[it.id] || returnedMap[`var_${it.variante_id}`] || 0;
      it.cantidad_devuelta = devuelto;
      it.cantidad_disponible = Math.max(0, it.cantidad - devuelto);
    }

    const totalDescuento = items.reduce((acc, it) => acc + (parseFloat(it.descuento) || 0), 0);
    venta.total_descuento = parseFloat(totalDescuento.toFixed(2));
    venta.items = items;
    venta.devoluciones = returns;
    venta.puede_devolver = venta.estado !== 'ANULADA' && venta.estado !== 'DEVUELTA' && items.some(it => it.cantidad_disponible > 0);

    return successResponse(res, {
      message: 'Detalle de la venta obtenido correctamente',
      data: venta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Anular una Venta (Restablece el inventario de las variantes)
 * PUT /api/v1/ventas/:id/anular
 */
const cancelSale = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [saleRows] = await connection.query(
      'SELECT id, cliente_id, total, estado FROM ventas WHERE id = ? FOR UPDATE',
      [id]
    );

    if (saleRows.length === 0) {
      await connection.rollback();
      return errorResponse(res, { statusCode: 404, message: 'Venta no encontrada' });
    }

    const venta = saleRows[0];
    if (venta.estado === 'ANULADA') {
      await connection.rollback();
      return errorResponse(res, { statusCode: 400, message: 'Esta venta ya se encuentra anulada' });
    }

    // Obtener los ítems para devolver stock
    const [items] = await connection.query(
      'SELECT variante_id, cantidad FROM detalle_ventas WHERE venta_id = ?',
      [id]
    );

    for (const item of items) {
      await connection.query(
        'UPDATE variantes_producto SET stock = stock + ? WHERE id = ?',
        [item.cantidad, item.variante_id]
      );
    }

    // Revertir puntos de lealtad si aplica
    if (venta.cliente_id) {
      const puntosARestar = Math.floor(venta.total / 50);
      if (puntosARestar > 0) {
        await connection.query(
          'UPDATE clientes SET puntos_lealtad = GREATEST(0, puntos_lealtad - ?) WHERE id = ?',
          [puntosARestar, venta.cliente_id]
        );
      }
    }

    // Marcar venta como anulada
    await connection.query('UPDATE ventas SET estado = "ANULADA" WHERE id = ?', [id]);

    await connection.commit();

    // Notificar anulación en tiempo real a Web y Móvil
    emitEvent('pos:sale_cancelled', { saleId: id });

    // Auditoría de anulación
    logActivity({
      req,
      modulo: 'VENTAS',
      accion: 'ANULAR_VENTA',
      descripcion: `Factura ID ${id} anulada y stock devuelto al inventario`,
      detalles: { venta_id: id }
    });

    return successResponse(res, {
      message: 'Venta anulada exitosamente y stock restaurado en el inventario'
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Registrar una Devolución de Producto(s)
 * POST /api/v1/ventas/:id/devolucion
 */
const createReturn = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { items, motivo, metodo_reembolso, observaciones } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debes seleccionar al menos un artículo para procesar la devolución'
      });
    }

    await connection.beginTransaction();

    // 1. Obtener la venta
    const [saleRows] = await connection.query(
      'SELECT * FROM ventas WHERE id = ? OR numero_factura = ? FOR UPDATE',
      [id, id]
    );

    if (saleRows.length === 0) {
      await connection.rollback();
      return errorResponse(res, { statusCode: 404, message: 'Factura de venta no encontrada' });
    }

    const venta = saleRows[0];

    if (venta.estado === 'ANULADA') {
      await connection.rollback();
      return errorResponse(res, { statusCode: 400, message: 'No se pueden realizar devoluciones sobre una factura anulada' });
    }

    if (venta.estado === 'DEVUELTA') {
      await connection.rollback();
      return errorResponse(res, { statusCode: 400, message: 'Todos los artículos de esta factura ya han sido devueltos' });
    }

    // 2. Obtener los detalles originales de la venta
    const [saleDetails] = await connection.query(
      `SELECT dv.*, vp.sku, vp.talla, vp.color, p.nombre AS producto_nombre
       FROM detalle_ventas dv
       INNER JOIN variantes_producto vp ON dv.variante_id = vp.id
       INNER JOIN productos p ON vp.producto_id = p.id
       WHERE dv.venta_id = ?`,
      [venta.id]
    );

    // 3. Obtener cantidades ya devueltas previamente
    const [alreadyReturned] = await connection.query(
      `SELECT dd.detalle_venta_id, dd.variante_id, COALESCE(SUM(dd.cantidad), 0) AS total_devuelto
       FROM detalle_devoluciones dd
       INNER JOIN devoluciones d ON dd.devolucion_id = d.id
       WHERE d.venta_id = ?
       GROUP BY dd.detalle_venta_id, dd.variante_id`,
      [venta.id]
    );

    const returnedMap = {};
    for (const r of alreadyReturned) {
      if (r.detalle_venta_id) returnedMap[r.detalle_venta_id] = parseInt(r.total_devuelto, 10);
      returnedMap[`var_${r.variante_id}`] = parseInt(r.total_devuelto, 10);
    }

    let subtotalDevuelto = 0;
    let isv15Devuelto = 0;
    let totalReembolsoCalculado = 0;
    const itemsParaDevolver = [];

    for (const reqItem of items) {
      const cantidadADevolver = parseInt(reqItem.cantidad, 10);
      if (!cantidadADevolver || cantidadADevolver <= 0) continue;

      // Buscar en los detalles de la venta
      const detail = saleDetails.find(d => 
        (reqItem.detalle_venta_id && d.id === reqItem.detalle_venta_id) || 
        d.variante_id === reqItem.variante_id
      );

      if (!detail) {
        await connection.rollback();
        return errorResponse(res, {
          statusCode: 400,
          message: `El artículo con variante ID ${reqItem.variante_id} no pertenece a esta venta`
        });
      }

      const prevReturned = (detail.id && returnedMap[detail.id] !== undefined)
        ? returnedMap[detail.id] 
        : (returnedMap[`var_${detail.variante_id}`] || 0);
      const disponible = detail.cantidad - prevReturned;

      if (cantidadADevolver > disponible) {
        await connection.rollback();
        return errorResponse(res, {
          statusCode: 400,
          message: `No se pueden devolver ${cantidadADevolver} unidades de "${detail.producto_nombre}". Solo quedan ${disponible} disponibles.`
        });
      }

      const precioUnit = parseFloat(detail.precio_unitario);
      const descUnit = detail.cantidad > 0 ? parseFloat(detail.descuento) / detail.cantidad : 0;
      const totalLineaReembolso = parseFloat(((precioUnit - descUnit) * cantidadADevolver).toFixed(2));
      const precioYaIncluyeIsv = Boolean(detail.precio_incluye_isv);
      const isvRate = (config.business.isvPercentage || 15) / 100;

      let itemSubtotalDevuelto = 0;
      let itemImpuestoDevuelto = 0;

      if (detail.tipo_impuesto === 'EXENTO') {
        itemSubtotalDevuelto = totalLineaReembolso;
        itemImpuestoDevuelto = 0.00;
      } else if (precioYaIncluyeIsv) {
        itemSubtotalDevuelto = parseFloat((totalLineaReembolso / (1 + isvRate)).toFixed(2));
        itemImpuestoDevuelto = parseFloat((totalLineaReembolso - itemSubtotalDevuelto).toFixed(2));
      } else {
        itemSubtotalDevuelto = totalLineaReembolso;
        itemImpuestoDevuelto = parseFloat((totalLineaReembolso * isvRate).toFixed(2));
      }

      subtotalDevuelto += itemSubtotalDevuelto;
      isv15Devuelto += itemImpuestoDevuelto;
      totalReembolsoCalculado += (precioYaIncluyeIsv ? totalLineaReembolso : parseFloat((itemSubtotalDevuelto + itemImpuestoDevuelto).toFixed(2)));

      itemsParaDevolver.push({
        detalle_venta_id: detail.id,
        variante_id: detail.variante_id,
        producto_nombre: detail.producto_nombre,
        talla: detail.talla,
        color: detail.color,
        cantidad: cantidadADevolver,
        precio_unitario: precioUnit,
        descuento: parseFloat((descUnit * cantidadADevolver).toFixed(2)),
        subtotal: itemSubtotalDevuelto,
        impuesto_monto: itemImpuestoDevuelto,
        total_linea: totalLineaReembolso
      });
    }

    if (itemsParaDevolver.length === 0) {
      await connection.rollback();
      return errorResponse(res, {
        statusCode: 400,
        message: 'No se especificó ninguna cantidad válida mayor a 0 para devolver'
      });
    }

    // Totales fiscales proporcionales consolidados
    const finalSubtotalDevuelto = parseFloat(subtotalDevuelto.toFixed(2));
    const finalIsv15Devuelto = parseFloat(isv15Devuelto.toFixed(2));
    const totalReembolso = parseFloat(totalReembolsoCalculado.toFixed(2));

    // Generar correlativo único de devolución (DEV-2026-000001)
    const [lastDev] = await connection.query('SELECT id FROM devoluciones ORDER BY id DESC LIMIT 1');
    const nextDevId = lastDev.length > 0 ? lastDev[0].id + 1 : 1;
    const year = new Date().getFullYear();
    const numeroDevolucion = `DEV-${year}-${String(nextDevId).padStart(6, '0')}`;

    // 4. Insertar cabecera de devolución
    const [devResult] = await connection.query(
      `INSERT INTO devoluciones (
        venta_id, numero_devolucion, usuario_id, cliente_id,
        monto_subtotal, monto_isv_15, monto_isv_18, monto_total,
        motivo, metodo_reembolso, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        venta.id,
        numeroDevolucion,
        req.user?.id || 1,
        venta.cliente_id || null,
        finalSubtotalDevuelto,
        finalIsv15Devuelto,
        0.00,
        totalReembolso,
        motivo || 'Cambio de prenda',
        metodo_reembolso || 'EFECTIVO',
        observaciones || null
      ]
    );

    const devolucionId = devResult.insertId;

    // 5. Insertar detalle de devolución y reincorporar al inventario
    for (const item of itemsParaDevolver) {
      await connection.query(
        `INSERT INTO detalle_devoluciones (
          devolucion_id, detalle_venta_id, variante_id, cantidad, precio_unitario, descuento, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [devolucionId, item.detalle_venta_id, item.variante_id, item.cantidad, item.precio_unitario, item.descuento, item.total_linea]
      );

      // Reingresar stock al inventario
      await connection.query(
        'UPDATE variantes_producto SET stock = stock + ? WHERE id = ?',
        [item.cantidad, item.variante_id]
      );
    }

    // 6. Verificar si la venta quedó completamente devuelta o parcialmente devuelta
    const [allReturnedNow] = await connection.query(
      `SELECT dd.detalle_venta_id, SUM(dd.cantidad) AS total_devuelto
       FROM detalle_devoluciones dd
       INNER JOIN devoluciones d ON dd.devolucion_id = d.id
       WHERE d.venta_id = ?
       GROUP BY dd.detalle_venta_id`,
      [venta.id]
    );

    const totalComprado = saleDetails.reduce((acc, d) => acc + d.cantidad, 0);
    const totalDevueltoSum = allReturnedNow.reduce((acc, r) => acc + parseInt(r.total_devuelto, 10), 0);

    const nuevoEstadoVenta = totalDevueltoSum >= totalComprado ? 'DEVUELTA' : 'DEVOLUCION_PARCIAL';
    await connection.query('UPDATE ventas SET estado = ? WHERE id = ?', [nuevoEstadoVenta, venta.id]);

    // 7. Ajustar puntos de lealtad si la compra original otorgó puntos
    if (venta.cliente_id) {
      const puntosARestar = Math.floor(totalReembolso / 50);
      if (puntosARestar > 0) {
        await connection.query(
          'UPDATE clientes SET puntos_lealtad = GREATEST(0, puntos_lealtad - ?) WHERE id = ?',
          [puntosARestar, venta.cliente_id]
        );
      }
    }

    await connection.commit();

    // 8. Auditoría
    logActivity({
      req,
      modulo: 'VENTAS',
      accion: 'DEVOLUCION_VENTA',
      descripcion: `Devolución ${numeroDevolucion} procesada para Factura ${venta.numero_factura}. Monto: L. ${totalReembolso.toFixed(2)}. Motivo: ${motivo}`,
      detalles: { devolucion_id: devolucionId, venta_id: venta.id, monto_total: totalReembolso, items: itemsParaDevolver }
    });

    // 9. Evento WebSocket
    emitEvent('pos:devolucion_created', {
      devolucionId,
      numeroDevolucion,
      ventaId: venta.id,
      numeroFactura: venta.numero_factura,
      montoTotal: totalReembolso,
      estadoVenta: nuevoEstadoVenta
    });

    return successResponse(res, {
      statusCode: 201,
      message: `Devolución ${numeroDevolucion} procesada exitosamente. Se reintegraron los artículos al stock.`,
      data: {
        id: devolucionId,
        numero_devolucion: numeroDevolucion,
        venta_id: venta.id,
        numero_factura: venta.numero_factura,
        nuevo_estado_venta: nuevoEstadoVenta,
        monto_subtotal: finalSubtotalDevuelto,
        monto_isv_15: finalIsv15Devuelto,
        monto_isv_18: 0.00,
        monto_total: totalReembolso,
        motivo: motivo || 'Cambio de prenda',
        metodo_reembolso: metodo_reembolso || 'EFECTIVO',
        observaciones,
        created_at: new Date().toISOString(),
        items: itemsParaDevolver
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Listar Historial de Devoluciones
 * GET /api/v1/ventas/devoluciones
 */
const getReturns = async (req, res, next) => {
  try {
    const { fecha, fecha_inicio, fecha_fin, search } = req.query;
    const whereClauses = [];
    const params = [];

    if (fecha) {
      whereClauses.push('DATE(d.created_at) = ?');
      params.push(fecha);
    } else if (fecha_inicio && fecha_fin) {
      whereClauses.push('DATE(d.created_at) BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    }

    if (search) {
      whereClauses.push('(d.numero_devolucion LIKE ? OR v.numero_factura LIKE ? OR c.nombre LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT d.*,
             v.numero_factura,
             u.nombre AS cajero_nombre,
             c.nombre AS cliente_nombre,
             (SELECT COUNT(*) FROM detalle_devoluciones dd WHERE dd.devolucion_id = d.id) AS total_items_devueltos
      FROM devoluciones d
      INNER JOIN ventas v ON d.venta_id = v.id
      INNER JOIN usuarios u ON d.usuario_id = u.id
      LEFT JOIN clientes c ON d.cliente_id = c.id
      ${whereSQL}
      ORDER BY d.id DESC
    `;

    const [rows] = await db.query(sql, params);

    // Obtener detalles de productos para cada devolución
    if (rows.length > 0) {
      const devIds = rows.map(r => r.id);
      const [items] = await db.query(
        `SELECT dd.*, vp.sku, vp.talla, vp.color, p.nombre AS producto_nombre
         FROM detalle_devoluciones dd
         INNER JOIN variantes_producto vp ON dd.variante_id = vp.id
         INNER JOIN productos p ON vp.producto_id = p.id
         WHERE dd.devolucion_id IN (?)`,
        [devIds]
      );

      const itemsByDev = {};
      for (const it of items) {
        if (!itemsByDev[it.devolucion_id]) itemsByDev[it.devolucion_id] = [];
        itemsByDev[it.devolucion_id].push(it);
      }

      for (const r of rows) {
        r.items = itemsByDev[r.id] || [];
      }
    }

    return successResponse(res, {
      message: 'Historial de devoluciones obtenido exitosamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
  createReturn,
  getReturns
};

