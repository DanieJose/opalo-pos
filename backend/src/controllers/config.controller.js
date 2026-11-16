const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../utils/logger.service');
const { emitEvent } = require('../config/socket');
const fs = require('fs');
const path = require('path');

/**
 * ============================================================================
 * CONTROLADOR DE CONFIGURACIÓN DE EMPRESA, RTN, LOGO Y DATOS FISCALES
 * ============================================================================
 */

// 1. Obtener la configuración general de la empresa
const getCompanyConfig = async (req, res, next) => {
  try {
    let [rows] = await db.query('SELECT * FROM configuracion_empresa ORDER BY id ASC LIMIT 1');

    if (rows.length === 0) {
      // Si no existe, crear registro base por defecto
      const defaultInsert = `
        INSERT INTO configuracion_empresa (
          nombre_empresa, nombre_comercial, rtn, logo_url, telefono, email,
          direccion, ciudad, pais, moneda_simbolo, moneda_codigo, isv_porcentaje,
          cai_sar, rango_autorizado_sar, fecha_limite_emision, mensaje_ticket_pie
        ) VALUES (
          'Ópalo Accesorios', 'Ópalo', '02091995001230', NULL, '+504 9876-5432', 'contacto@opalo.hn',
          'Barrio El Centro, Calle Principal, Tocoa, Colón', 'Tocoa, Colón', 'Honduras', 'L.', 'HNL', 15.00,
          'E54D7A-B981F2-9942B5-17C3D8-72AE10-94', '000-001-01-00000001 a 000-001-01-00050000', '2026-12-31',
          '¡Gracias por su compra en Ópalo Accesorios!\nPrendas y accesorios con estilo único.\nNo se aceptan devoluciones sin este recibo.'
        )
      `;
      const [insertResult] = await db.query(defaultInsert);
      [rows] = await db.query('SELECT * FROM configuracion_empresa WHERE id = ?', [insertResult.insertId]);
    }

    return successResponse(res, {
      message: 'Configuración de empresa obtenida exitosamente',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// 2. Subir nuevo archivo de logotipo
const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'No se ha seleccionado ningún archivo de imagen para el logotipo'
      });
    }

    const relativeUrl = `/uploads/logo/${req.file.filename}`;

    // Actualizar automáticamente el logo_url en la base de datos
    await db.query('UPDATE configuracion_empresa SET logo_url = ? WHERE id = 1', [relativeUrl]);

    // Registrar en auditoría
    await logActivity(
      req.user?.id || 1,
      'ACTUALIZAR',
      'CONFIGURACION',
      1,
      `Actualización de logotipo empresarial: ${req.file.originalname}`,
      req
    );

    // Notificar en tiempo real a clientes conectados
    emitEvent('configuracion:logo_actualizado', { logo_url: relativeUrl });

    return successResponse(res, {
      statusCode: 201,
      message: 'Logotipo subido y actualizado exitosamente',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: relativeUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Eliminar / restablecer el logotipo de la empresa
const removeCompanyLogo = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT logo_url FROM configuracion_empresa WHERE id = 1');
    if (rows.length > 0 && rows[0].logo_url) {
      const filePath = path.join(__dirname, '../../public', rows[0].logo_url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('[Logo] No se pudo borrar archivo físico anterior:', e.message);
        }
      }
    }

    await db.query('UPDATE configuracion_empresa SET logo_url = NULL WHERE id = 1');

    await logActivity(
      req.user?.id || 1,
      'ELIMINAR',
      'CONFIGURACION',
      1,
      'Logotipo empresarial eliminado',
      req
    );

    emitEvent('configuracion:logo_actualizado', { logo_url: null });

    return successResponse(res, {
      message: 'Logotipo eliminado exitosamente. Se usará el ícono por defecto.'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Actualizar todos los datos de configuración (RTN, nombre, contacto, SAR, ticket)
const updateCompanyConfig = async (req, res, next) => {
  try {
    const {
      nombre_empresa,
      nombre_comercial,
      rtn,
      telefono,
      email,
      direccion,
      ciudad,
      pais,
      moneda_simbolo,
      moneda_codigo,
      isv_porcentaje,
      isv_18_porcentaje,
      cai_sar,
      rango_autorizado_sar,
      fecha_limite_emision,
      mensaje_ticket_pie
    } = req.body;

    if (!nombre_empresa || !nombre_empresa.trim()) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El nombre o razón social de la empresa es obligatorio'
      });
    }

    if (!rtn || !rtn.trim()) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El RTN de la empresa es obligatorio'
      });
    }

    const cleanRtn = rtn.trim().replace(/[^0-9]/g, '');
    if (cleanRtn.length > 0 && cleanRtn.length !== 14) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El RTN hondureño debe contener exactamente 14 dígitos numéricos'
      });
    }

    const updateSql = `
      UPDATE configuracion_empresa SET
        nombre_empresa = ?,
        nombre_comercial = ?,
        rtn = ?,
        telefono = ?,
        email = ?,
        direccion = ?,
        ciudad = ?,
        pais = ?,
        moneda_simbolo = ?,
        moneda_codigo = ?,
        isv_porcentaje = ?,
        isv_18_porcentaje = ?,
        cai_sar = ?,
        rango_autorizado_sar = ?,
        fecha_limite_emision = ?,
        mensaje_ticket_pie = ?
      WHERE id = 1
    `;

    const params = [
      nombre_empresa.trim(),
      (nombre_comercial || '').trim(),
      cleanRtn || rtn.trim(),
      (telefono || '').trim(),
      (email || '').trim().toLowerCase(),
      (direccion || '').trim(),
      (ciudad || 'Tocoa, Colón').trim(),
      (pais || 'Honduras').trim(),
      (moneda_simbolo || 'L.').trim(),
      (moneda_codigo || 'HNL').trim(),
      parseFloat(isv_porcentaje || 15),
      parseFloat(isv_18_porcentaje || 18),
      cai_sar ? cai_sar.trim() : null,
      rango_autorizado_sar ? rango_autorizado_sar.trim() : null,
      fecha_limite_emision || null,
      mensaje_ticket_pie ? mensaje_ticket_pie.trim() : null
    ];

    await db.query(updateSql, params);

    const [updatedRows] = await db.query('SELECT * FROM configuracion_empresa WHERE id = 1');
    const updatedData = updatedRows[0];

    // Registrar en auditoría
    await logActivity(
      req.user?.id || 1,
      'ACTUALIZAR',
      'CONFIGURACION',
      1,
      `Configuración de la empresa actualizada. RTN: ${cleanRtn || rtn}, Razón Social: ${nombre_empresa}`,
      req
    );

    // Notificar por websockets para que las terminales POS actualicen ticket y encabezados
    emitEvent('configuracion:actualizada', updatedData);

    return successResponse(res, {
      message: 'Configuración de la empresa actualizada exitosamente',
      data: updatedData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanyConfig,
  uploadCompanyLogo,
  removeCompanyLogo,
  updateCompanyConfig
};

