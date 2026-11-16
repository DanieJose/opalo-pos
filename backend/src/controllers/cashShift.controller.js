const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../utils/logger.service');
const { getIO } = require('../config/socket');
const { getLocalDateString } = require('../utils/date');

/**
 * Obtener el estado actual de la caja para el usuario autenticado
 * GET /api/v1/caja/estado
 */
const getEstadoCaja = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;

    const [turnos] = await db.query(
      `SELECT t.*, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM turnos_caja t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.usuario_id = ? AND t.estado = 'ABIERTA'
       ORDER BY t.id DESC
       LIMIT 1`,
      [usuarioId]
    );

    if (turnos.length === 0) {
      return successResponse(res, {
        message: 'No hay turno de caja abierto actualmente',
        data: {
          tiene_caja_abierta: false,
          turno: null
        }
      });
    }

    const turno = turnos[0];

    // Calcular ventas en efectivo generadas durante este turno (incluyendo porción en efectivo de pagos mixtos)
    const [ventasEfectivo] = await db.query(
      `SELECT 
         COUNT(*) AS cantidad_ventas_efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN total WHEN metodo_pago = 'MIXTO' THEN monto_efectivo ELSE 0 END), 0) AS total_ventas_efectivo
       FROM ventas
       WHERE usuario_id = ? 
         AND metodo_pago IN ('EFECTIVO', 'MIXTO')
         AND estado != 'ANULADA' 
         AND created_at >= ?`,
      [usuarioId, turno.fecha_apertura]
    );

    // Calcular salidas / retiros de efectivo generados durante este turno
    const [salidasEfectivo] = await db.query(
      `SELECT 
         COUNT(*) AS cantidad_salidas_efectivo,
         COALESCE(SUM(monto), 0) AS total_salidas_efectivo
       FROM gastos_financieros
       WHERE ((turno_caja_id = ?) OR (usuario_id = ? AND created_at >= ? AND turno_caja_id IS NULL))
         AND metodo_pago = 'EFECTIVO'
         AND estado = 'PAGADO'`,
      [turno.id, usuarioId, turno.fecha_apertura]
    );

    // Calcular devoluciones en efectivo realizadas durante este turno
    const [devEfectivo] = await db.query(
      `SELECT 
         COUNT(*) AS cantidad_dev_efectivo,
         COALESCE(SUM(monto_total), 0) AS total_dev_efectivo
       FROM devoluciones
       WHERE ((usuario_id = ?) OR 1=1)
         AND metodo_reembolso = 'EFECTIVO'
         AND created_at >= ?`,
      [usuarioId, turno.fecha_apertura]
    );

    const efectivoVentas = parseFloat(ventasEfectivo[0].total_ventas_efectivo || 0);
    const efectivoSalidas = parseFloat(salidasEfectivo[0].total_salidas_efectivo || 0);
    const efectivoDev = parseFloat(devEfectivo[0].total_dev_efectivo || 0);
    const montoInicial = parseFloat(turno.monto_inicial || 0);
    const efectivoEsperadoEnCaja = montoInicial + efectivoVentas - efectivoSalidas - efectivoDev;

    return successResponse(res, {
      message: 'Estado de caja obtenido exitosamente',
      data: {
        tiene_caja_abierta: true,
        turno: {
          ...turno,
          monto_inicial: montoInicial,
          ventas_efectivo: efectivoVentas,
          cantidad_ventas_efectivo: ventasEfectivo[0].cantidad_ventas_efectivo,
          salidas_efectivo: efectivoSalidas,
          cantidad_salidas_efectivo: salidasEfectivo[0].cantidad_salidas_efectivo,
          devoluciones_efectivo: efectivoDev,
          cantidad_devoluciones_efectivo: devEfectivo[0].cantidad_dev_efectivo,
          total_esperado_caja: efectivoEsperadoEnCaja
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar apertura de turno de caja (Fondo de cambio inicial)
 * POST /api/v1/caja/abrir
 * Body: { monto_inicial, notas }
 */
const abrirCaja = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;
    const { monto_inicial, notas } = req.body;

    if (monto_inicial === undefined || monto_inicial === null || isNaN(monto_inicial) || Number(monto_inicial) < 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debe ingresar un monto inicial de cambio válido (mayor o igual a L. 0.00)'
      });
    }

    const montoNum = parseFloat(monto_inicial);

    // Verificar si ya tiene una caja abierta
    const [cajasAbiertas] = await db.query(
      `SELECT id, monto_inicial, fecha_apertura 
       FROM turnos_caja 
       WHERE usuario_id = ? AND estado = 'ABIERTA'
       LIMIT 1`,
      [usuarioId]
    );

    if (cajasAbiertas.length > 0) {
      return errorResponse(res, {
        statusCode: 409,
        message: `Ya tienes una caja abierta con fecha ${cajasAbiertas[0].fecha_apertura}. Debes cerrarla antes de abrir una nueva.`,
        data: cajasAbiertas[0]
      });
    }

    // Insertar apertura de turno
    const [result] = await db.query(
      `INSERT INTO turnos_caja (usuario_id, monto_inicial, notas, estado, fecha_apertura)
       VALUES (?, ?, ?, 'ABIERTA', NOW())`,
      [usuarioId, montoNum, notas ? notas.trim() : null]
    );

    const nuevoTurnoId = result.insertId;

    const [nuevoTurno] = await db.query(
      `SELECT t.*, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM turnos_caja t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.id = ?`,
      [nuevoTurnoId]
    );

    const turnoData = {
      ...nuevoTurno[0],
      monto_inicial: montoNum,
      ventas_efectivo: 0,
      total_esperado_caja: montoNum
    };

    // Registrar en auditoría de logs
    await logActivity({
      req,
      modulo: 'CAJA',
      accion: 'APERTURA_CAJA',
      descripcion: `Apertura de turno de caja con fondo inicial de cambio de L. ${montoNum.toFixed(2)} (${req.user.nombre})`,
      detalles: {
        turno_id: nuevoTurnoId,
        monto_inicial: montoNum,
        notas: notas || null
      }
    });

    // Notificar en tiempo real por WebSockets
    try {
      const io = getIO();
      if (io) {
        io.emit('pos:caja_abierta', {
          turno: turnoData,
          usuario_id: usuarioId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Socket emit warning (caja_abierta):', e.message);
    }

    return successResponse(res, {
      statusCode: 201,
      message: `Caja abierta exitosamente con L. ${montoNum.toFixed(2)} de fondo inicial`,
      data: turnoData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cerrar turno de caja y calcular arqueo
 * POST /api/v1/caja/cerrar
 * Body: { monto_final_real, notas }
 */
const cerrarCaja = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;
    const { monto_final_real, notas, turno_id } = req.body;

    if (monto_final_real === undefined || isNaN(monto_final_real) || Number(monto_final_real) < 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debe ingresar el monto en efectivo físico contado en caja'
      });
    }

    let turno = null;
    if (turno_id) {
      const [turnos] = await db.query(
        `SELECT t.*, u.nombre AS usuario_nombre, u.email AS usuario_email
         FROM turnos_caja t
         INNER JOIN usuarios u ON t.usuario_id = u.id
         WHERE t.id = ? AND t.estado = 'ABIERTA'`,
        [turno_id]
      );
      if (turnos.length > 0) turno = turnos[0];
    }

    if (!turno) {
      const [turnos] = await db.query(
        `SELECT t.*, u.nombre AS usuario_nombre, u.email AS usuario_email
         FROM turnos_caja t
         INNER JOIN usuarios u ON t.usuario_id = u.id
         WHERE (t.usuario_id = ? OR 1=1) AND t.estado = 'ABIERTA' 
         ORDER BY (t.usuario_id = ?) DESC, t.id DESC LIMIT 1`,
        [usuarioId, usuarioId]
      );
      if (turnos.length > 0) turno = turnos[0];
    }

    if (!turno) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'No hay ningún turno de caja abierto actualmente para finalizar o cerrar'
      });
    }

    // Ventas en efectivo durante el turno (incluye porción en efectivo de pagos mixtos)
    const [ventasEfectivo] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN total WHEN metodo_pago = 'MIXTO' THEN monto_efectivo ELSE 0 END), 0) AS total_efectivo, 
              COUNT(CASE WHEN metodo_pago = 'EFECTIVO' OR (metodo_pago = 'MIXTO' AND monto_efectivo > 0) THEN 1 END) AS cantidad_efectivo 
       FROM ventas 
       WHERE (usuario_id = ? OR 1=1) AND metodo_pago IN ('EFECTIVO', 'MIXTO') AND estado != 'ANULADA' AND created_at >= ?`,
      [turno.usuario_id, turno.fecha_apertura]
    );

    // Ventas con tarjeta durante el turno (incluye porción con tarjeta de pagos mixtos)
    const [ventasTarjeta] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN metodo_pago = 'TARJETA' THEN total WHEN metodo_pago = 'MIXTO' THEN monto_tarjeta ELSE 0 END), 0) AS total_tarjeta, 
              COUNT(CASE WHEN metodo_pago = 'TARJETA' OR (metodo_pago = 'MIXTO' AND monto_tarjeta > 0) THEN 1 END) AS cantidad_tarjeta 
       FROM ventas 
       WHERE (usuario_id = ? OR 1=1) AND metodo_pago IN ('TARJETA', 'MIXTO') AND estado != 'ANULADA' AND created_at >= ?`,
      [turno.usuario_id, turno.fecha_apertura]
    );

    // Ventas por transferencia durante el turno (incluye porción transferencia de pagos mixtos)
    const [ventasTransferencia] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN metodo_pago = 'TRANSFERENCIA' THEN total WHEN metodo_pago = 'MIXTO' THEN monto_transferencia ELSE 0 END), 0) AS total_transf, 
              COUNT(CASE WHEN metodo_pago = 'TRANSFERENCIA' OR (metodo_pago = 'MIXTO' AND monto_transferencia > 0) THEN 1 END) AS cantidad_transf 
       FROM ventas 
       WHERE (usuario_id = ? OR 1=1) AND metodo_pago IN ('TRANSFERENCIA', 'MIXTO') AND estado != 'ANULADA' AND created_at >= ?`,
      [turno.usuario_id, turno.fecha_apertura]
    );

    // Salidas de efectivo durante el turno
    const [salidasEfectivo] = await db.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_salidas, COUNT(*) AS cantidad_salidas 
       FROM gastos_financieros 
       WHERE ((turno_caja_id = ?) OR (usuario_id = ? AND created_at >= ? AND turno_caja_id IS NULL))
         AND metodo_pago = 'EFECTIVO' 
         AND estado = 'PAGADO'`,
      [turno.id, turno.usuario_id, turno.fecha_apertura]
    );

    // Devoluciones en efectivo durante el turno
    const [devEfectivo] = await db.query(
      `SELECT COALESCE(SUM(monto_total), 0) AS total_dev_efectivo, COUNT(*) AS cantidad_dev 
       FROM devoluciones 
       WHERE metodo_reembolso = 'EFECTIVO' AND created_at >= ?`,
      [turno.fecha_apertura]
    );

    const efectivoVentas = parseFloat(ventasEfectivo[0].total_efectivo || 0);
    const efectivoTarjeta = parseFloat(ventasTarjeta[0].total_tarjeta || 0);
    const efectivoTransf = parseFloat(ventasTransferencia[0].total_transf || 0);
    const efectivoSalidas = parseFloat(salidasEfectivo[0].total_salidas || 0);
    const efectivoDev = parseFloat(devEfectivo[0].total_dev_efectivo || 0);
    const montoInicial = parseFloat(turno.monto_inicial || 0);

    const montoEsperado = parseFloat((montoInicial + efectivoVentas - efectivoSalidas - efectivoDev).toFixed(2));
    const montoReal = parseFloat(monto_final_real);
    const diferencia = parseFloat((montoReal - montoEsperado).toFixed(2));

    await db.query(
      `UPDATE turnos_caja 
       SET monto_final_esperado = ?,
           monto_final_real = ?,
           diferencia = ?,
           estado = 'CERRADA',
           fecha_cierre = NOW(),
           notas = CONCAT(COALESCE(notas, ''), IF(LENGTH(COALESCE(notas, '')) > 0, ' | Cierre: ', 'Cierre: '), ?)
       WHERE id = ?`,
      [montoEsperado, montoReal, diferencia, notas ? notas.trim() : 'Cierre y finalización del día', turno.id]
    );

    const turnoCerrado = {
      id: turno.id,
      usuario_id: turno.usuario_id,
      usuario_nombre: turno.usuario_nombre || req.user.nombre,
      cerrado_por: req.user.nombre,
      monto_inicial: montoInicial,
      ventas_efectivo: efectivoVentas,
      ventas_tarjeta: efectivoTarjeta,
      ventas_transferencia: efectivoTransf,
      ventas_totales: efectivoVentas + efectivoTarjeta + efectivoTransf,
      salidas_efectivo: efectivoSalidas,
      devoluciones_efectivo: efectivoDev,
      monto_final_esperado: montoEsperado,
      monto_final_real: montoReal,
      diferencia: diferencia,
      estado: 'CERRADA',
      fecha_apertura: turno.fecha_apertura,
      fecha_cierre: new Date().toISOString()
    };

    // Auditoría
    await logActivity({
      req,
      modulo: 'CAJA',
      accion: 'CIERRE_CAJA',
      descripcion: `Finalización de día y cierre de caja #${turno.id}. Fondo inicial: L. ${montoInicial.toFixed(2)}, Ventas efectivo: L. ${efectivoVentas.toFixed(2)}, Salidas: L. ${efectivoSalidas.toFixed(2)}, Dev: L. ${efectivoDev.toFixed(2)}, Real contado: L. ${montoReal.toFixed(2)}, Diferencia: L. ${diferencia.toFixed(2)} (${req.user.nombre})`,
      detalles: turnoCerrado
    });

    try {
      const io = getIO();
      if (io) {
        io.emit('pos:caja_cerrada', {
          turno: turnoCerrado,
          usuario_id: usuarioId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Socket emit warning (caja_cerrada):', e.message);
    }

    return successResponse(res, {
      message: 'Turno de caja cerrado exitosamente',
      data: turnoCerrado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar una salida / retiro de dinero en efectivo de la caja
 * POST /api/v1/caja/salida
 * Body: { monto, motivo, categoria, beneficiario, numero_comprobante, notas }
 */
const registrarSalidaCaja = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;
    const { monto, motivo, categoria, beneficiario, numero_comprobante, notas } = req.body;

    if (!monto || isNaN(monto) || Number(monto) <= 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debe ingresar un monto válido y mayor a L. 0.00 para la salida de efectivo'
      });
    }

    if (!motivo || !motivo.trim()) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debe especificar el motivo o concepto de la salida de dinero'
      });
    }

    // Buscar turno de caja abierto
    const [turnos] = await db.query(
      `SELECT id, monto_inicial, fecha_apertura 
       FROM turnos_caja 
       WHERE usuario_id = ? AND estado = 'ABIERTA' 
       ORDER BY id DESC LIMIT 1`,
      [usuarioId]
    );

    if (turnos.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'No puedes registrar una salida de dinero sin un turno de caja abierto'
      });
    }

    const turno = turnos[0];
    const montoNum = parseFloat(monto);

    // Validar categoría financiera válida
    const categoriasValidas = [
      'ALQUILER', 'SERVICIOS_PUBLICOS', 'PAGO_PROVEEDORES', 'NOMINA_SALARIOS',
      'TRANSPORTE_FLETES', 'MARKETING_PUBLICIDAD', 'EMPAQUES_SUMINISTROS',
      'MANTENIMIENTO', 'IMPUESTOS', 'OTROS'
    ];
    const catFinal = (categoria && categoriasValidas.includes(categoria.toUpperCase())) 
      ? categoria.toUpperCase() 
      : 'OTROS';

    // Generar número de vale automático si no se provee
    const numComprobante = numero_comprobante && numero_comprobante.trim()
      ? numero_comprobante.trim()
      : `VALE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-5)}`;

    const descFinal = `${motivo.trim()}${beneficiario && beneficiario.trim() ? ` (Entregado a: ${beneficiario.trim()})` : ''}`;

    const [result] = await db.query(
      `INSERT INTO gastos_financieros 
         (categoria, usuario_id, turno_caja_id, descripcion, monto, metodo_pago, numero_comprobante, fecha_gasto, estado, notas)
       VALUES (?, ?, ?, ?, ?, 'EFECTIVO', ?, CURDATE(), 'PAGADO', ?)`,
      [catFinal, usuarioId, turno.id, descFinal, montoNum, numComprobante, notas ? notas.trim() : null]
    );

    const salidaId = result.insertId;

    const salidaRegistrada = {
      id: salidaId,
      turno_caja_id: turno.id,
      usuario_id: usuarioId,
      usuario_nombre: req.user.nombre,
      categoria: catFinal,
      motivo: motivo.trim(),
      beneficiario: beneficiario ? beneficiario.trim() : null,
      descripcion: descFinal,
      monto: montoNum,
      metodo_pago: 'EFECTIVO',
      numero_comprobante: numComprobante,
      fecha_gasto: getLocalDateString(),
      fecha_hora: new Date().toISOString(),
      estado: 'PAGADO',
      notas: notas || null
    };

    // Auditoría
    await logActivity({
      req,
      modulo: 'CAJA',
      accion: 'SALIDA_EFECTIVO',
      descripcion: `Salida de efectivo de caja por L. ${montoNum.toFixed(2)} - ${descFinal} (Comprobante: ${numComprobante})`,
      detalles: salidaRegistrada
    });

    // Notificar en tiempo real
    try {
      const io = getIO();
      if (io) {
        io.emit('pos:salida_caja', {
          salida: salidaRegistrada,
          usuario_id: usuarioId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Socket emit warning (salida_caja):', e.message);
    }

    return successResponse(res, {
      statusCode: 201,
      message: `Salida de efectivo registrada exitosamente por L. ${montoNum.toFixed(2)}`,
      data: salidaRegistrada
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener lista de salidas de dinero registradas en el turno actual
 * GET /api/v1/caja/salidas
 */
const getSalidasCaja = async (req, res, next) => {
  try {
    const usuarioId = req.user.id;
    const turnoIdReq = req.query.turno_id;

    let turnoId = turnoIdReq;

    if (!turnoId) {
      const [turnos] = await db.query(
        `SELECT id FROM turnos_caja WHERE usuario_id = ? AND estado = 'ABIERTA' ORDER BY id DESC LIMIT 1`,
        [usuarioId]
      );
      if (turnos.length > 0) {
        turnoId = turnos[0].id;
      }
    }

    let query = `
      SELECT g.*, u.nombre AS usuario_nombre 
      FROM gastos_financieros g
      LEFT JOIN usuarios u ON g.usuario_id = u.id
      WHERE g.metodo_pago = 'EFECTIVO' AND g.estado = 'PAGADO'
    `;
    const params = [];

    if (turnoId) {
      query += ` AND g.turno_caja_id = ?`;
      params.push(turnoId);
    } else {
      query += ` AND g.usuario_id = ? AND g.fecha_gasto = CURDATE()`;
      params.push(usuarioId);
    }

    query += ` ORDER BY g.id DESC`;

    const [rows] = await db.query(query, params);

    return successResponse(res, {
      message: 'Salidas de caja obtenidas exitosamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Historial de aperturas y cierres de caja
 * GET /api/v1/caja/historial
 */
const getHistorialCajas = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT t.*, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM turnos_caja t
       INNER JOIN usuarios u ON t.usuario_id = u.id
       ORDER BY t.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [count] = await db.query('SELECT COUNT(*) AS total FROM turnos_caja');

    return successResponse(res, {
      message: 'Historial de turnos de caja obtenido',
      data: rows,
      pagination: {
        page,
        limit,
        total: count[0].total,
        totalPages: Math.ceil(count[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEstadoCaja,
  abrirCaja,
  cerrarCaja,
  registrarSalidaCaja,
  getSalidasCaja,
  getHistorialCajas
};
