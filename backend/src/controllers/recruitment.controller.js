const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../utils/logger.service');
const { emitEvent } = require('../config/socket');

/**
 * ============================================================================
 * ENDPOINTS PÚBLICOS (Portal de Empleo & Postulaciones)
 * ============================================================================
 */

// 1. Obtener vacantes abiertas públicas para postulantes
const getPublicVacancies = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, titulo, departamento, ubicacion, tipo_contrato, salario_ofrecido, 
              descripcion, requisitos, beneficios, created_at 
       FROM vacantes_empleo 
       WHERE estado = 'ABIERTA' 
       ORDER BY id DESC`
    );

    return successResponse(res, {
      message: 'Vacantes disponibles obtenidas exitosamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// 2. Subida de archivo de CV / Hoja de Vida (Público)
const uploadCvFile = (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'No se ha proporcionado ningún archivo de hoja de vida (PDF, DOCX o Imagen)'
      });
    }

    const relativePath = `/uploads/cvs/${req.file.filename}`;

    return successResponse(res, {
      statusCode: 201,
      message: 'Hoja de vida subida exitosamente',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: relativePath
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Enviar postulación de candidato (Público)
const submitApplication = async (req, res, next) => {
  try {
    const {
      vacante_id,
      nombre_completo,
      identidad_dni,
      telefono,
      email,
      ciudad_direccion,
      puesto_interes,
      experiencia_previa,
      cv_archivo_url
    } = req.body;

    if (!nombre_completo || !telefono || !cv_archivo_url) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Nombre completo, teléfono/WhatsApp y la hoja de vida (CV) son obligatorios'
      });
    }

    const [result] = await db.query(
      `INSERT INTO candidatos_postulaciones 
       (vacante_id, nombre_completo, identidad_dni, telefono, email, ciudad_direccion, puesto_interes, experiencia_previa, cv_archivo_url, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NUEVO')`,
      [
        vacante_id ? parseInt(vacante_id, 10) : null,
        nombre_completo.trim(),
        identidad_dni ? identidad_dni.trim() : null,
        telefono.trim(),
        email ? email.trim().toLowerCase() : null,
        ciudad_direccion ? ciudad_direccion.trim() : 'Tocoa, Colón',
        puesto_interes ? puesto_interes.trim() : null,
        experiencia_previa ? experiencia_previa.trim() : null,
        cv_archivo_url.trim()
      ]
    );

    const newId = result.insertId;

    // Obtener los datos completos para notificación en tiempo real
    const [rows] = await db.query(
      `SELECT c.*, v.titulo AS vacante_titulo, v.departamento AS vacante_departamento 
       FROM candidatos_postulaciones c 
       LEFT JOIN vacantes_empleo v ON c.vacante_id = v.id 
       WHERE c.id = ?`,
      [newId]
    );

    const candidateData = rows[0];

    // Emitir evento WebSocket para actualizar en tiempo real el módulo de Reclutamiento
    emitEvent('reclutamiento:nueva_postulacion', candidateData);

    // Registrar en auditoría
    await logActivity({
      usuarioId: null,
      usuarioNombre: 'Portal Web Público',
      modulo: 'RECLUTAMIENTO',
      accion: 'NUEVA_POSTULACION',
      descripcion: `Postulación recibida de "${nombre_completo}" para: ${candidateData.vacante_titulo || puesto_interes || 'General'}. Tel: ${telefono}`,
      ip: req.ip
    });

    return successResponse(res, {
      statusCode: 201,
      message: '¡Tu postulación ha sido enviada con éxito! El equipo de Recursos Humanos de Ópalo Accesorios se pondrá en contacto contigo.',
      data: candidateData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ============================================================================
 * ENDPOINTS ADMINISTRATIVOS (Módulo Interno de RRHH / Reclutamiento)
 * ============================================================================
 */

// 4. Métricas y KPIs de Reclutamiento
const getRecruitmentMetrics = async (req, res, next) => {
  try {
    const [vacanciesCount] = await db.query(
      `SELECT COUNT(*) AS total_vacantes,
              SUM(CASE WHEN estado = 'ABIERTA' THEN 1 ELSE 0 END) AS vacantes_abiertas 
       FROM vacantes_empleo`
    );

    const [candidatesMetrics] = await db.query(
      `SELECT COUNT(*) AS total_postulaciones,
              SUM(CASE WHEN estado = 'NUEVO' THEN 1 ELSE 0 END) AS nuevos,
              SUM(CASE WHEN estado = 'EN_REVISION' THEN 1 ELSE 0 END) AS en_revision,
              SUM(CASE WHEN estado = 'ENTREVISTA' THEN 1 ELSE 0 END) AS en_entrevista,
              SUM(CASE WHEN estado = 'CONTRATADO' THEN 1 ELSE 0 END) AS contratados,
              SUM(CASE WHEN estado = 'DESCARTADO' THEN 1 ELSE 0 END) AS descartados
       FROM candidatos_postulaciones`
    );

    return successResponse(res, {
      message: 'Métricas de reclutamiento obtenidas',
      data: {
        vacantes: vacanciesCount[0],
        postulaciones: candidatesMetrics[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Listado de Candidatos / Hojas de Vida
const getCandidates = async (req, res, next) => {
  try {
    const { estado, vacante_id, search } = req.query;
    const whereClauses = [];
    const queryParams = [];

    if (estado) {
      whereClauses.push('c.estado = ?');
      queryParams.push(estado);
    }

    if (vacante_id) {
      whereClauses.push('c.vacante_id = ?');
      queryParams.push(vacante_id);
    }

    if (search) {
      whereClauses.push('(c.nombre_completo LIKE ? OR c.telefono LIKE ? OR c.identidad_dni LIKE ? OR c.email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT c.*, 
             v.titulo AS vacante_titulo, 
             v.departamento AS vacante_departamento
      FROM candidatos_postulaciones c
      LEFT JOIN vacantes_empleo v ON c.vacante_id = v.id
      ${whereSQL}
      ORDER BY c.id DESC
    `;

    const [candidates] = await db.query(sql, queryParams);

    return successResponse(res, {
      message: 'Listado de candidatos obtenido exitosamente',
      data: candidates
    });
  } catch (error) {
    next(error);
  }
};

// 6. Actualizar estado y notas de un candidato
const updateCandidateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, notas_internas } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (estado !== undefined) {
      updateFields.push('estado = ?');
      updateValues.push(estado);
    }

    if (notas_internas !== undefined) {
      updateFields.push('notas_internas = ?');
      updateValues.push(notas_internas);
    }

    if (updateFields.length === 0) {
      return errorResponse(res, { statusCode: 400, message: 'No hay datos para actualizar' });
    }

    updateValues.push(id);
    await db.query(`UPDATE candidatos_postulaciones SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    const [updated] = await db.query(
      `SELECT c.*, v.titulo AS vacante_titulo 
       FROM candidatos_postulaciones c 
       LEFT JOIN vacantes_empleo v ON c.vacante_id = v.id 
       WHERE c.id = ?`,
      [id]
    );

    emitEvent('reclutamiento:candidato_actualizado', updated[0]);

    await logActivity({
      usuarioId: req.user?.id,
      usuarioNombre: req.user?.nombre,
      modulo: 'RECLUTAMIENTO',
      accion: 'ACTUALIZAR_CANDIDATO',
      descripcion: `Estado del candidato #${id} ("${updated[0]?.nombre_completo}") actualizado a: ${estado}`,
      ip: req.ip
    });

    return successResponse(res, {
      message: 'Estado del candidato actualizado con éxito',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// 7. Eliminar postulación
const deleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM candidatos_postulaciones WHERE id = ?', [id]);

    await logActivity({
      usuarioId: req.user?.id,
      usuarioNombre: req.user?.nombre,
      modulo: 'RECLUTAMIENTO',
      accion: 'ELIMINAR_CANDIDATO',
      descripcion: `Postulación de candidato #${id} eliminada`,
      ip: req.ip
    });

    return successResponse(res, { message: 'Postulación eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

// 8. Listado de Vacantes Administrativas
const getVacancies = async (req, res, next) => {
  try {
    const sql = `
      SELECT v.*, 
             COUNT(c.id) AS total_postulantes 
      FROM vacantes_empleo v
      LEFT JOIN candidatos_postulaciones c ON v.id = c.vacante_id
      GROUP BY v.id
      ORDER BY v.id DESC
    `;
    const [rows] = await db.query(sql);

    return successResponse(res, {
      message: 'Vacantes obtenidas exitosamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// 9. Crear nueva vacante de empleo
const createVacancy = async (req, res, next) => {
  try {
    const {
      titulo,
      departamento,
      ubicacion,
      tipo_contrato,
      salario_ofrecido,
      descripcion,
      requisitos,
      beneficios,
      estado
    } = req.body;

    if (!titulo || !descripcion) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El título del puesto y la descripción son obligatorios'
      });
    }

    const [result] = await db.query(
      `INSERT INTO vacantes_empleo 
       (titulo, departamento, ubicacion, tipo_contrato, salario_ofrecido, descripcion, requisitos, beneficios, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo.trim(),
        departamento ? departamento.trim() : 'Ventas',
        ubicacion ? ubicacion.trim() : 'Tocoa, Colón',
        tipo_contrato || 'TIEMPO_COMPLETO',
        salario_ofrecido ? salario_ofrecido.trim() : null,
        descripcion.trim(),
        requisitos ? requisitos.trim() : null,
        beneficios ? beneficios.trim() : null,
        estado || 'ABIERTA'
      ]
    );

    const newId = result.insertId;
    const [rows] = await db.query('SELECT * FROM vacantes_empleo WHERE id = ?', [newId]);

    emitEvent('reclutamiento:vacante_creada', rows[0]);

    await logActivity({
      usuarioId: req.user?.id,
      usuarioNombre: req.user?.nombre,
      modulo: 'RECLUTAMIENTO',
      accion: 'CREAR_VACANTE',
      descripcion: `Nueva vacante creada: "${titulo}" (${departamento || 'General'})`,
      ip: req.ip
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Vacante creada exitosamente',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// 10. Actualizar vacante de empleo
const updateVacancy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      departamento,
      ubicacion,
      tipo_contrato,
      salario_ofrecido,
      descripcion,
      requisitos,
      beneficios,
      estado
    } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (titulo !== undefined) { updateFields.push('titulo = ?'); updateValues.push(titulo.trim()); }
    if (departamento !== undefined) { updateFields.push('departamento = ?'); updateValues.push(departamento.trim()); }
    if (ubicacion !== undefined) { updateFields.push('ubicacion = ?'); updateValues.push(ubicacion.trim()); }
    if (tipo_contrato !== undefined) { updateFields.push('tipo_contrato = ?'); updateValues.push(tipo_contrato); }
    if (salario_ofrecido !== undefined) { updateFields.push('salario_ofrecido = ?'); updateValues.push(salario_ofrecido ? salario_ofrecido.trim() : null); }
    if (descripcion !== undefined) { updateFields.push('descripcion = ?'); updateValues.push(descripcion.trim()); }
    if (requisitos !== undefined) { updateFields.push('requisitos = ?'); updateValues.push(requisitos ? requisitos.trim() : null); }
    if (beneficios !== undefined) { updateFields.push('beneficios = ?'); updateValues.push(beneficios ? beneficios.trim() : null); }
    if (estado !== undefined) { updateFields.push('estado = ?'); updateValues.push(estado); }

    if (updateFields.length === 0) {
      return errorResponse(res, { statusCode: 400, message: 'No hay datos para actualizar' });
    }

    updateValues.push(id);
    await db.query(`UPDATE vacantes_empleo SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    const [rows] = await db.query('SELECT * FROM vacantes_empleo WHERE id = ?', [id]);

    emitEvent('reclutamiento:vacante_actualizada', rows[0]);

    await logActivity({
      usuarioId: req.user?.id,
      usuarioNombre: req.user?.nombre,
      modulo: 'RECLUTAMIENTO',
      accion: 'ACTUALIZAR_VACANTE',
      descripcion: `Vacante #${id} ("${rows[0]?.titulo}") actualizada`,
      ip: req.ip
    });

    return successResponse(res, {
      message: 'Vacante actualizada exitosamente',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// 11. Eliminar vacante de empleo
const deleteVacancy = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM vacantes_empleo WHERE id = ?', [id]);

    await logActivity({
      usuarioId: req.user?.id,
      usuarioNombre: req.user?.nombre,
      modulo: 'RECLUTAMIENTO',
      accion: 'ELIMINAR_VACANTE',
      descripcion: `Vacante #${id} eliminada`,
      ip: req.ip
    });

    return successResponse(res, { message: 'Vacante eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicVacancies,
  uploadCvFile,
  submitApplication,
  getRecruitmentMetrics,
  getCandidates,
  updateCandidateStatus,
  deleteCandidate,
  getVacancies,
  createVacancy,
  updateVacancy,
  deleteVacancy
};
