const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Listar logs y eventos de auditoría del sistema (ADMIN)
 * GET /api/v1/logs?page=1&limit=25&modulo=VENTAS&fecha_inicio=2026-11-01
 */
const getLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '25', 10)));
    const offset = (page - 1) * limit;

    const { modulo, accion, usuario_id, fecha_inicio, fecha_fin, search } = req.query;

    const whereClauses = [];
    const params = [];

    if (modulo) {
      whereClauses.push('modulo = ?');
      params.push(modulo);
    }

    if (accion) {
      whereClauses.push('accion = ?');
      params.push(accion);
    }

    if (usuario_id) {
      whereClauses.push('usuario_id = ?');
      params.push(usuario_id);
    }

    if (fecha_inicio) {
      whereClauses.push('DATE(created_at) >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereClauses.push('DATE(created_at) <= ?');
      params.push(fecha_fin);
    }

    if (search) {
      whereClauses.push('(descripcion LIKE ? OR usuario_nombre LIKE ? OR ip LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Contar total
    const countSql = `SELECT COUNT(*) AS total FROM logs_sistema ${whereSQL}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    // Obtener registros
    const sql = `
      SELECT id, usuario_id, usuario_nombre, modulo, accion, descripcion, ip, detalles, created_at
      FROM logs_sistema
      ${whereSQL}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [...params, limit, offset]);

    // Parsear detalles JSON si vienen como string
    const formattedRows = rows.map(r => {
      let parsed = r.detalles;
      if (typeof r.detalles === 'string') {
        try {
          parsed = JSON.parse(r.detalles);
        } catch (e) {
          parsed = r.detalles;
        }
      }
      return { ...r, detalles: parsed };
    });

    return successResponse(res, {
      message: 'Logs del sistema obtenidos correctamente',
      data: formattedRows,
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
 * Obtener estadísticas de auditoría (ADMIN)
 * GET /api/v1/logs/stats
 */
const getLogStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total de logs y logs de hoy
    const [countRows] = await db.query(`
      SELECT 
        COUNT(*) AS total_logs,
        COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) AS logs_hoy,
        COUNT(CASE WHEN accion IN ('ANULAR_VENTA', 'AJUSTE_STOCK', 'CAMBIO_ESTADO_USUARIO', 'LOGIN_FALLIDO') THEN 1 END) AS acciones_criticas
      FROM logs_sistema
    `, [today]);

    // Desglose por módulo
    const [moduleRows] = await db.query(`
      SELECT modulo, COUNT(*) AS cantidad
      FROM logs_sistema
      GROUP BY modulo
      ORDER BY cantidad DESC
    `);

    // Top usuarios activos en logs
    const [userRows] = await db.query(`
      SELECT usuario_nombre, COUNT(*) AS total_acciones
      FROM logs_sistema
      WHERE usuario_nombre IS NOT NULL
      GROUP BY usuario_nombre
      ORDER BY total_acciones DESC
      LIMIT 5
    `);

    return successResponse(res, {
      message: 'Estadísticas de auditoría obtenidas correctamente',
      data: {
        resumen: countRows[0],
        desglose_modulos: moduleRows,
        top_usuarios: userRows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Depuración de logs antiguos (ADMIN)
 * DELETE /api/v1/logs/purge?dias=90
 */
const purgeOldLogs = async (req, res, next) => {
  try {
    const dias = parseInt(req.query.dias || '90', 10);

    const [result] = await db.query(
      'DELETE FROM logs_sistema WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [dias]
    );

    return successResponse(res, {
      message: `Se han depurado ${result.affectedRows} registros de auditoría anteriores a ${dias} días.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogs,
  getLogStats,
  purgeOldLogs
};

