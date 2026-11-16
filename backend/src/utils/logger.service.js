const db = require('../config/db');
const { emitEvent } = require('../config/socket');

/**
 * Servicio Centralizado de Auditoría y Logs del Sistema
 * 
 * @param {Object} params
 * @param {Object} [params.req] - Objeto Request de Express (para extraer IP y usuario autenticado)
 * @param {number} [params.usuario_id] - ID del usuario responsable
 * @param {string} [params.usuario_nombre] - Nombre del usuario
 * @param {string} params.modulo - Módulo afectado (AUTH, VENTAS, INVENTARIO, CLIENTES, USUARIOS, SISTEMA)
 * @param {string} params.accion - Acción realizada (LOGIN, LOGOUT, CREAR_VENTA, ANULAR_VENTA, AJUSTE_STOCK, etc.)
 * @param {string} params.descripcion - Mensaje legible para auditoría
 * @param {Object} [params.detalles] - Información técnica adicional en formato JSON
 */
const logActivity = async ({
  req = null,
  usuario_id = null,
  usuario_nombre = null,
  modulo,
  accion,
  descripcion,
  detalles = null
}) => {
  try {
    let finalUserId = usuario_id;
    let finalUserName = usuario_nombre;
    let clientIp = '127.0.0.1';

    if (req) {
      if (!finalUserId && req.user) {
        finalUserId = req.user.id;
        finalUserName = req.user.nombre || req.user.email;
      }
      clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
      if (clientIp.includes('::ffff:')) {
        clientIp = clientIp.replace('::ffff:', '');
      }
    }

    const jsonDetalles = detalles ? JSON.stringify(detalles) : null;

    const sql = `
      INSERT INTO logs_sistema (usuario_id, usuario_nombre, modulo, accion, descripcion, ip, detalles)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      finalUserId,
      finalUserName,
      modulo,
      accion,
      descripcion,
      clientIp,
      jsonDetalles
    ]);

    const logEntry = {
      id: result.insertId,
      usuario_id: finalUserId,
      usuario_nombre: finalUserName,
      modulo,
      accion,
      descripcion,
      ip: clientIp,
      detalles,
      created_at: new Date().toISOString()
    };

    // Emitir por WebSockets para que el panel de administración lo vea en vivo
    emitEvent('pos:log_created', logEntry);

    return logEntry;
  } catch (err) {
    console.error('[Error Logger Service]:', err.message);
  }
};

module.exports = {
  logActivity
};

