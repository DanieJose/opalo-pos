const db = require('../config/db');
const { emitEvent } = require('../config/socket');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Listar clientes con paginación, métricas y búsqueda (nombre, teléfono, RTN/DNI)
 * GET /api/v1/clientes?page=1&limit=50&search=maria
 */
const getCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const { search, estado, nivel } = req.query;
    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push('(c.nombre LIKE ? OR c.rtn_dni LIKE ? OR c.telefono LIKE ? OR c.email LIKE ? OR c.codigo_qr_lealtad = ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, search.trim());
    }

    if (estado) {
      whereClauses.push('c.estado = ?');
      params.push(estado);
    }

    if (nivel) {
      if (nivel === 'BRONCE') whereClauses.push('c.puntos_lealtad < 50');
      else if (nivel === 'PLATA') whereClauses.push('c.puntos_lealtad >= 50 AND c.puntos_lealtad < 150');
      else if (nivel === 'ORO') whereClauses.push('c.puntos_lealtad >= 150 AND c.puntos_lealtad < 300');
      else if (nivel === 'DIAMANTE') whereClauses.push('c.puntos_lealtad >= 300');
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM clientes c ${whereSQL}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    const sql = `
      SELECT c.id, c.nombre, c.rtn_dni, c.telefono, c.email, c.direccion, 
             c.codigo_qr_lealtad, c.puntos_lealtad, c.estado, c.created_at,
             COUNT(DISTINCT CASE WHEN v.estado = 'COMPLETADA' THEN v.id END) AS total_compras,
             COALESCE(SUM(CASE WHEN v.estado = 'COMPLETADA' THEN v.total ELSE 0 END), 0) AS total_gastado,
             MAX(CASE WHEN v.estado = 'COMPLETADA' THEN v.created_at END) AS ultima_compra
      FROM clientes c
      LEFT JOIN ventas v ON c.id = v.cliente_id
      ${whereSQL}
      GROUP BY c.id
      ORDER BY c.puntos_lealtad DESC, c.id DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(sql, [...params, limit, offset]);

    // Métricas globales del programa de lealtad
    const [summaryRows] = await db.query(`
      SELECT 
        COUNT(*) AS total_clientes,
        COALESCE(SUM(puntos_lealtad), 0) AS total_puntos,
        COUNT(CASE WHEN puntos_lealtad >= 50 THEN 1 END) AS clientes_vip,
        COUNT(CASE WHEN puntos_lealtad > 0 THEN 1 END) AS clientes_con_puntos
      FROM clientes
    `);

    const [salesSummary] = await db.query(`
      SELECT COALESCE(SUM(total), 0) AS ventas_fidelizadas
      FROM ventas
      WHERE cliente_id IS NOT NULL AND estado = 'COMPLETADA'
    `);

    return successResponse(res, {
      message: 'Clientes obtenidos correctamente',
      data: rows,
      resumen: {
        total_clientes: summaryRows[0]?.total_clientes || 0,
        total_puntos: summaryRows[0]?.total_puntos || 0,
        clientes_vip: summaryRows[0]?.clientes_vip || 0,
        clientes_con_puntos: summaryRows[0]?.clientes_con_puntos || 0,
        ventas_fidelizadas: parseFloat(salesSummary[0]?.ventas_fidelizadas || 0)
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar cliente por código QR de lealtad (utilizado en el escáner del POS)
 * GET /api/v1/clientes/buscar/qr/:codigo
 */
const findCustomerByQR = async (req, res, next) => {
  try {
    const { codigo } = req.params;

    const sql = `
      SELECT id, nombre, rtn_dni, telefono, email, direccion, 
             codigo_qr_lealtad, puntos_lealtad, estado
      FROM clientes
      WHERE codigo_qr_lealtad = ? AND estado = 'ACTIVO'
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [codigo.trim()]);

    if (rows.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: `No se encontró ningún cliente activo con el código QR: ${codigo}`
      });
    }

    return successResponse(res, {
      message: 'Cliente encontrado por código QR de lealtad',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener detalle de cliente e historial completo de compras
 * GET /api/v1/clientes/:id
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [customerRows] = await db.query(
      `SELECT c.id, c.nombre, c.rtn_dni, c.telefono, c.email, c.direccion, 
              c.codigo_qr_lealtad, c.puntos_lealtad, c.estado, c.created_at,
              COUNT(DISTINCT CASE WHEN v.estado = 'COMPLETADA' THEN v.id END) AS total_compras,
              COALESCE(SUM(CASE WHEN v.estado = 'COMPLETADA' THEN v.total ELSE 0 END), 0) AS total_gastado,
              MAX(CASE WHEN v.estado = 'COMPLETADA' THEN v.created_at END) AS ultima_compra
       FROM clientes c
       LEFT JOIN ventas v ON c.id = v.cliente_id
       WHERE c.id = ?
       GROUP BY c.id
       LIMIT 1`,
      [id]
    );

    if (customerRows.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Cliente no encontrado' });
    }

    const customer = customerRows[0];

    // Obtener historial de compras detallado
    const [recentPurchases] = await db.query(
      `SELECT v.id, v.numero_factura, v.total, v.metodo_pago, v.created_at,
              u.nombre AS cajero_nombre,
              (SELECT COUNT(*) FROM detalle_ventas dv WHERE dv.venta_id = v.id) AS total_articulos
       FROM ventas v
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.cliente_id = ? AND v.estado = 'COMPLETADA'
       ORDER BY v.id DESC LIMIT 20`,
      [id]
    );

    customer.ultimas_compras = recentPurchases;

    return successResponse(res, {
      message: 'Detalle de cliente obtenido correctamente',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear cliente con generación automática de código QR de lealtad
 * POST /api/v1/clientes
 */
const createCustomer = async (req, res, next) => {
  try {
    const { nombre, rtn_dni, telefono, email, direccion, codigo_qr_lealtad } = req.body;

    if (!nombre || !nombre.trim()) {
      return errorResponse(res, { statusCode: 400, message: 'El nombre del cliente es obligatorio' });
    }

    const cleanRtn = rtn_dni && rtn_dni.trim() ? rtn_dni.trim() : null;

    // Si se proporcionó RTN, verificar si ya existe un cliente con este documento
    if (cleanRtn) {
      const [existing] = await db.query(
        `SELECT id, nombre, rtn_dni, telefono, email, direccion, codigo_qr_lealtad, puntos_lealtad, estado
         FROM clientes WHERE rtn_dni = ? LIMIT 1`,
        [cleanRtn]
      );

      if (existing.length > 0) {
        const found = existing[0];
        await db.query(
          `UPDATE clientes 
           SET nombre = ?, 
               telefono = COALESCE(?, telefono),
               direccion = COALESCE(?, direccion),
               email = COALESCE(?, email)
           WHERE id = ?`,
          [
            nombre.trim(),
            telefono && telefono.trim() ? telefono.trim() : null,
            direccion && direccion.trim() ? direccion.trim() : null,
            email && email.trim() ? email.trim().toLowerCase() : null,
            found.id
          ]
        );

        const [updatedRows] = await db.query(
          `SELECT id, nombre, rtn_dni, telefono, email, direccion, codigo_qr_lealtad, puntos_lealtad, estado
           FROM clientes WHERE id = ?`,
          [found.id]
        );

        return successResponse(res, {
          statusCode: 200,
          message: 'Cliente encontrado y actualizado por RTN',
          data: updatedRows[0]
        });
      }
    }

    // Generar código QR único si no se suministra uno preimpreso
    const qrCode = codigo_qr_lealtad || `OPALO-LOYAL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const [result] = await db.query(
      `INSERT INTO clientes (nombre, rtn_dni, telefono, email, direccion, codigo_qr_lealtad, puntos_lealtad, estado)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'ACTIVO')`,
      [
        nombre.trim(),
        cleanRtn,
        telefono && telefono.trim() ? telefono.trim() : null,
        email && email.trim() ? email.trim().toLowerCase() : null,
        direccion && direccion.trim() ? direccion.trim() : null,
        qrCode
      ]
    );

    const customerData = {
      id: result.insertId,
      nombre: nombre.trim(),
      rtn_dni: cleanRtn,
      telefono: telefono && telefono.trim() ? telefono.trim() : null,
      email: email && email.trim() ? email.trim().toLowerCase() : null,
      direccion: direccion && direccion.trim() ? direccion.trim() : null,
      codigo_qr_lealtad: qrCode,
      puntos_lealtad: 0,
      estado: 'ACTIVO'
    };

    emitEvent('pos:customer_created', customerData);

    return successResponse(res, {
      statusCode: 201,
      message: 'Cliente registrado exitosamente en el programa de lealtad',
      data: customerData
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, { statusCode: 409, message: 'Ya existe un cliente con ese código QR o documento' });
    }
    next(error);
  }
};

/**
 * Actualizar datos del cliente
 * PUT /api/v1/clientes/:id
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, rtn_dni, telefono, email, direccion, estado, codigo_qr_lealtad } = req.body;

    const fields = [];
    const values = [];

    if (nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(nombre.trim());
    }
    if (rtn_dni !== undefined) {
      fields.push('rtn_dni = ?');
      values.push(rtn_dni && rtn_dni.trim() ? rtn_dni.trim() : null);
    }
    if (telefono !== undefined) {
      fields.push('telefono = ?');
      values.push(telefono && telefono.trim() ? telefono.trim() : null);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email && email.trim() ? email.trim().toLowerCase() : null);
    }
    if (direccion !== undefined) {
      fields.push('direccion = ?');
      values.push(direccion && direccion.trim() ? direccion.trim() : null);
    }
    if (codigo_qr_lealtad !== undefined) {
      fields.push('codigo_qr_lealtad = ?');
      values.push(codigo_qr_lealtad && codigo_qr_lealtad.trim() ? codigo_qr_lealtad.trim() : null);
    }
    if (estado !== undefined) {
      fields.push('estado = ?');
      values.push(estado);
    }

    if (fields.length === 0) {
      return errorResponse(res, { statusCode: 400, message: 'No hay campos para actualizar' });
    }

    values.push(id);
    await db.query(`UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
    emitEvent('pos:customer_updated', updated[0]);

    return successResponse(res, {
      message: 'Cliente actualizado correctamente',
      data: updated[0]
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, { statusCode: 409, message: 'Ya existe un cliente con ese código QR o documento' });
    }
    next(error);
  }
};

/**
 * Ajustar o Canjear Puntos de Lealtad manualmente
 * POST /api/v1/clientes/:id/ajustar-puntos
 */
const adjustPoints = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { puntos, tipo, motivo } = req.body;

    const numPuntos = parseInt(puntos, 10);
    if (isNaN(numPuntos) || numPuntos <= 0) {
      return errorResponse(res, { statusCode: 400, message: 'La cantidad de puntos debe ser un número entero mayor a cero' });
    }

    const [rows] = await db.query('SELECT id, nombre, puntos_lealtad FROM clientes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Cliente no encontrado' });
    }

    const cliente = rows[0];
    let nuevosPuntos = cliente.puntos_lealtad;

    if (tipo === 'CANJEAR') {
      if (cliente.puntos_lealtad < numPuntos) {
        return errorResponse(res, {
          statusCode: 400,
          message: `El cliente solo tiene ${cliente.puntos_lealtad} puntos disponibles para canjear`
        });
      }
      nuevosPuntos = Math.max(0, cliente.puntos_lealtad - numPuntos);
    } else {
      // SUMAR
      nuevosPuntos = cliente.puntos_lealtad + numPuntos;
    }

    await db.query('UPDATE clientes SET puntos_lealtad = ? WHERE id = ?', [nuevosPuntos, id]);

    // Emitir evento en tiempo real
    emitEvent('pos:customer_updated', {
      id: parseInt(id, 10),
      puntos_lealtad: nuevosPuntos
    });

    return successResponse(res, {
      message: `Puntos ${tipo === 'CANJEAR' ? 'canjeados' : 'acreditados'} exitosamente`,
      data: {
        id: cliente.id,
        nombre: cliente.nombre,
        puntos_anteriores: cliente.puntos_lealtad,
        puntos_nuevos: nuevosPuntos,
        diferencia: numPuntos,
        tipo,
        motivo: motivo || 'Ajuste manual de lealtad'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activar o desactivar cliente
 * PATCH /api/v1/clientes/:id/toggle-estado
 */
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id, nombre, estado FROM clientes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return errorResponse(res, { statusCode: 404, message: 'Cliente no encontrado' });
    }

    const nuevoEstado = rows[0].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    await db.query('UPDATE clientes SET estado = ? WHERE id = ?', [nuevoEstado, id]);

    emitEvent('pos:customer_updated', { id: parseInt(id, 10), estado: nuevoEstado });

    return successResponse(res, {
      message: `Cliente ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente`,
      data: { id: parseInt(id, 10), estado: nuevoEstado }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  findCustomerByQR,
  createCustomer,
  updateCustomer,
  adjustPoints,
  toggleCustomerStatus
};
