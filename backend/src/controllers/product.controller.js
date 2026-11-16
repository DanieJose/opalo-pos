const db = require('../config/db');
const { emitEvent } = require('../config/socket');
const { logActivity } = require('../utils/logger.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Listar productos con paginación, filtros de búsqueda y categoría
 * GET /api/v1/productos?page=1&limit=10&search=vestido&categoria_id=4&estado=ACTIVO
 */
const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const { search, categoria_id, estado } = req.query;

    const whereClauses = [];
    const queryParams = [];

    if (search) {
      whereClauses.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (categoria_id) {
      whereClauses.push('p.categoria_id = ?');
      queryParams.push(categoria_id);
    }

    if (estado) {
      whereClauses.push('p.estado = ?');
      queryParams.push(estado);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Contar total de registros
    const countSql = `SELECT COUNT(*) AS total FROM productos p ${whereSQL}`;
    const [countResult] = await db.query(countSql, queryParams);
    const total = countResult[0].total;

    // Obtener productos
    const sql = `
      SELECT p.id, p.nombre, p.descripcion, p.precio_costo, p.precio_base, p.tipo_impuesto,
             p.precio_incluye_isv,
             p.aplica_descuento, p.descuento_porcentaje, p.precio_con_descuento,
             p.imagen_url, p.estado, 
             p.created_at, p.updated_at,
             c.id AS categoria_id, c.nombre AS categoria_nombre,
             pr.id AS proveedor_id, pr.nombre_empresa AS proveedor_nombre
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
      ${whereSQL}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;

    const [products] = await db.query(sql, [...queryParams, limit, offset]);

    // Si hay productos, cargar sus variantes asociadas
    if (products.length > 0) {
      const productIds = products.map((p) => p.id);
      const [variants] = await db.query(
        `SELECT id, producto_id, sku, codigo_barras, talla, color, precio_costo, precio_venta, 
                precio_incluye_isv,
                descuento_porcentaje, precio_con_descuento,
                precio_adicional, stock, stock_minimo, imagen_url, estado
         FROM variantes_producto 
         WHERE producto_id IN (?) AND estado = 'ACTIVO'
         ORDER BY id ASC`,
        [productIds]
      );

      // Agrupar variantes por producto
      const variantsByProductId = {};
      variants.forEach((v) => {
        if (!variantsByProductId[v.producto_id]) {
          variantsByProductId[v.producto_id] = [];
        }
        variantsByProductId[v.producto_id].push(v);
      });

      products.forEach((p) => {
        p.variantes = variantsByProductId[p.id] || [];
        p.total_stock = p.variantes.reduce((acc, curr) => acc + (curr.stock || 0), 0);
      });
    }

    const totalPages = Math.ceil(total / limit);

    return successResponse(res, {
      message: 'Lista de productos obtenida exitosamente',
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un producto por ID con todas sus variantes
 * GET /api/v1/productos/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [productRows] = await db.query(
      `SELECT p.id, p.nombre, p.descripcion, p.precio_costo, p.precio_base, p.tipo_impuesto,
              p.precio_incluye_isv,
              p.aplica_descuento, p.descuento_porcentaje, p.precio_con_descuento,
              p.imagen_url, p.estado, 
              p.created_at, p.updated_at,
              c.id AS categoria_id, c.nombre AS categoria_nombre
       FROM productos p
       INNER JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?
       LIMIT 1`,
      [id]
    );

    if (productRows.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Producto no encontrado'
      });
    }

    const product = productRows[0];

    // Obtener todas las variantes del producto
    const [variants] = await db.query(
      `SELECT id, producto_id, sku, codigo_barras, talla, color, precio_costo, precio_venta, 
              precio_incluye_isv,
              descuento_porcentaje, precio_con_descuento,
              precio_adicional, stock, stock_minimo, imagen_url, estado, created_at
       FROM variantes_producto
       WHERE producto_id = ?
       ORDER BY id ASC`,
      [id]
    );

    product.variantes = variants;
    product.total_stock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

    return successResponse(res, {
      message: 'Producto obtenido exitosamente',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar variante por SKU o Código de barras (Ruta clave para escaneo en POS)
 * GET /api/v1/productos/buscar/codigo?term=7421001001
 */
const findVariantByBarcodeOrSku = async (req, res, next) => {
  try {
    const { term } = req.query;

    if (!term) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debes proporcionar un término de búsqueda (SKU o Código de Barras)'
      });
    }

    const sql = `
      SELECT v.id AS variante_id, v.sku, v.codigo_barras, v.talla, v.color, 
             v.precio_venta, v.stock, v.stock_minimo, v.estado AS variante_estado,
             p.id AS producto_id, p.nombre AS producto_nombre, p.descripcion, 
             c.nombre AS categoria_nombre
      FROM variantes_producto v
      INNER JOIN productos p ON v.producto_id = p.id
      INNER JOIN categorias c ON p.categoria_id = c.id
      WHERE (v.sku = ? OR v.codigo_barras = ?) AND v.estado = 'ACTIVO' AND p.estado = 'ACTIVO'
      LIMIT 1
    `;

    const [rows] = await db.query(sql, [term.trim(), term.trim()]);

    if (rows.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: `No se encontró ninguna variante activa con el código: ${term}`
      });
    }

    return successResponse(res, {
      message: 'Variante encontrada para el POS',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear un nuevo producto junto a sus variantes de forma transaccional
 * POST /api/v1/productos
 */
const createProduct = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { 
      nombre, 
      descripcion, 
      categoria_id, 
      proveedor_id, 
      precio_costo, 
      precio_base, 
      tipo_impuesto,
      precio_incluye_isv,
      aplica_descuento, 
      descuento_porcentaje, 
      precio_con_descuento, 
      imagen_url, 
      variantes 
    } = req.body;

    if (!nombre || !categoria_id || precio_base === undefined) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El nombre, la categoría y el precio base son obligatorios'
      });
    }

    const parsedCosto = precio_costo !== undefined ? (parseFloat(precio_costo) || 0.00) : 0.00;
    const parsedBase = parseFloat(precio_base) || 0.00;
    const parsedIncluyeIsv = (precio_incluye_isv === true || precio_incluye_isv === 1 || precio_incluye_isv === '1') ? 1 : 0;
    const hasDiscount = aplica_descuento ? 1 : 0;
    const discountPct = hasDiscount ? (parseFloat(descuento_porcentaje) || 0.00) : 0.00;
    const discountPrice = hasDiscount && discountPct > 0 
      ? (precio_con_descuento ? parseFloat(precio_con_descuento) : parseFloat((parsedBase * (1 - discountPct / 100)).toFixed(2))) 
      : null;

    const parsedTaxType = ['ISV_15', 'ISV_18', 'EXENTO'].includes(tipo_impuesto) ? tipo_impuesto : 'ISV_15';

    // Iniciar transacción MySQL
    await connection.beginTransaction();

    // 1. Insertar el producto base
    const [productResult] = await connection.query(
      `INSERT INTO productos (categoria_id, proveedor_id, nombre, descripcion, precio_costo, precio_base, tipo_impuesto, precio_incluye_isv, aplica_descuento, descuento_porcentaje, precio_con_descuento, imagen_url, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
      [
        categoria_id, 
        proveedor_id ? parseInt(proveedor_id, 10) : null, 
        nombre.trim(), 
        descripcion || null, 
        parsedCosto,
        parsedBase,
        parsedTaxType,
        parsedIncluyeIsv,
        hasDiscount,
        discountPct,
        discountPrice,
        imagen_url ? imagen_url.trim() : null
      ]
    );

    const newProductId = productResult.insertId;

    // 2. Procesar e insertar las variantes
    const itemsToInsert = Array.isArray(variantes) && variantes.length > 0 
      ? variantes 
      : [{
          talla: 'Única',
          color: 'Estándar',
          sku: `SKU-${newProductId}-${Date.now().toString().slice(-4)}`,
          codigo_barras: null,
          precio_costo: parsedCosto,
          precio_venta: parsedBase,
          precio_incluye_isv: parsedIncluyeIsv,
          descuento_porcentaje: discountPct,
          precio_con_descuento: discountPrice,
          precio_adicional: 0.00,
          stock: 0,
          stock_minimo: 3
        }];

    const insertedVariants = [];

    for (const v of itemsToInsert) {
      const sku = v.sku || `SKU-${newProductId}-${v.talla || 'U'}-${v.color || 'E'}-${Date.now().toString().slice(-3)}`;
      const variantCosto = v.precio_costo !== undefined ? (parseFloat(v.precio_costo) || 0.00) : parsedCosto;
      const precioVenta = v.precio_venta !== undefined ? parseFloat(v.precio_venta) : parsedBase;
      const varIncluyeIsv = v.precio_incluye_isv !== undefined 
        ? ((v.precio_incluye_isv === true || v.precio_incluye_isv === 1 || v.precio_incluye_isv === '1') ? 1 : 0)
        : parsedIncluyeIsv;
      const varDescPct = v.descuento_porcentaje !== undefined ? (parseFloat(v.descuento_porcentaje) || 0.00) : discountPct;
      const varDiscountPrice = hasDiscount && varDescPct > 0 
        ? parseFloat((precioVenta * (1 - varDescPct / 100)).toFixed(2)) 
        : (discountPrice || null);

      const precioAdicional = v.precio_adicional ? parseFloat(v.precio_adicional) : 0.00;
      const stock = v.stock !== undefined ? parseInt(v.stock, 10) : 0;
      const stockMinimo = v.stock_minimo !== undefined ? parseInt(v.stock_minimo, 10) : 3;

      const [variantResult] = await connection.query(
        `INSERT INTO variantes_producto 
         (producto_id, sku, codigo_barras, talla, color, precio_costo, precio_venta, precio_incluye_isv, descuento_porcentaje, precio_con_descuento, precio_adicional, stock, stock_minimo, imagen_url, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
        [
          newProductId,
          sku.trim(),
          v.codigo_barras ? v.codigo_barras.trim() : null,
          v.talla || 'Única',
          v.color || 'Estándar',
          variantCosto,
          precioVenta,
          varIncluyeIsv,
          varDescPct,
          varDiscountPrice,
          precioAdicional,
          stock,
          stockMinimo,
          v.imagen_url ? v.imagen_url.trim() : (imagen_url ? imagen_url.trim() : null)
        ]
      );

      insertedVariants.push({
        id: variantResult.insertId,
        producto_id: newProductId,
        sku,
        codigo_barras: v.codigo_barras || null,
        talla: v.talla || 'Única',
        color: v.color || 'Estándar',
        precio_costo: variantCosto,
        precio_venta: precioVenta,
        descuento_porcentaje: varDescPct,
        precio_con_descuento: varDiscountPrice,
        stock
      });
    }

    // Confirmar transacción
    await connection.commit();

    const createdData = {
      id: newProductId,
      nombre,
      descripcion,
      categoria_id,
      precio_base: parseFloat(precio_base),
      variantes: insertedVariants
    };

    emitEvent('pos:product_created', createdData);

    return successResponse(res, {
      statusCode: 201,
      message: 'Producto y variantes creados exitosamente',
      data: createdData
    });
  } catch (error) {
    await connection.rollback();
    // Manejo de error de clave duplicada (SKU o combinación talla/color)
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, {
        statusCode: 409,
        message: 'Error de duplicidad: Ya existe un SKU, código de barras o la combinación de Talla y Color para este producto.'
      });
    }
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Actualizar producto y sus variantes
 * PUT /api/v1/productos/:id
 */
const updateProduct = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { 
      id 
    } = req.params;
    const { 
      nombre, 
      descripcion, 
      categoria_id, 
      proveedor_id, 
      precio_costo, 
      precio_base, 
      tipo_impuesto,
      precio_incluye_isv,
      aplica_descuento, 
      descuento_porcentaje, 
      precio_con_descuento, 
      imagen_url, 
      estado, 
      variantes 
    } = req.body;

    await connection.beginTransaction();

    // 1. Actualizar producto cabecera si hay campos
    const updateFields = [];
    const updateValues = [];

    if (nombre !== undefined) {
      updateFields.push('nombre = ?');
      updateValues.push(nombre.trim());
    }
    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      updateValues.push(descripcion);
    }
    if (categoria_id !== undefined) {
      updateFields.push('categoria_id = ?');
      updateValues.push(categoria_id);
    }
    if (proveedor_id !== undefined) {
      updateFields.push('proveedor_id = ?');
      updateValues.push(proveedor_id ? parseInt(proveedor_id, 10) : null);
    }
    if (precio_costo !== undefined) {
      updateFields.push('precio_costo = ?');
      updateValues.push(parseFloat(precio_costo) || 0.00);
    }
    if (precio_base !== undefined) {
      updateFields.push('precio_base = ?');
      updateValues.push(parseFloat(precio_base));
    }
    if (tipo_impuesto !== undefined) {
      updateFields.push('tipo_impuesto = ?');
      updateValues.push(['ISV_15', 'ISV_18', 'EXENTO'].includes(tipo_impuesto) ? tipo_impuesto : 'ISV_15');
    }
    if (precio_incluye_isv !== undefined) {
      updateFields.push('precio_incluye_isv = ?');
      updateValues.push((precio_incluye_isv === true || precio_incluye_isv === 1 || precio_incluye_isv === '1') ? 1 : 0);
    }
    if (aplica_descuento !== undefined) {
      const boolAplica = (aplica_descuento === true || aplica_descuento === 1 || aplica_descuento === '1');
      updateFields.push('aplica_descuento = ?');
      updateValues.push(boolAplica ? 1 : 0);
      if (!boolAplica) {
        updateFields.push('descuento_porcentaje = 0.00');
        updateFields.push('precio_con_descuento = NULL');
      }
    }
    if (descuento_porcentaje !== undefined && (aplica_descuento === undefined || (aplica_descuento === true || aplica_descuento === 1 || aplica_descuento === '1'))) {
      updateFields.push('descuento_porcentaje = ?');
      updateValues.push(parseFloat(descuento_porcentaje) || 0.00);
    }
    if (precio_con_descuento !== undefined && (aplica_descuento === undefined || (aplica_descuento === true || aplica_descuento === 1 || aplica_descuento === '1'))) {
      updateFields.push('precio_con_descuento = ?');
      updateValues.push(precio_con_descuento !== null ? parseFloat(precio_con_descuento) : null);
    }
    if (imagen_url !== undefined) {
      updateFields.push('imagen_url = ?');
      updateValues.push(imagen_url ? imagen_url.trim() : null);
    }
    if (estado !== undefined) {
      updateFields.push('estado = ?');
      updateValues.push(estado);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await connection.query(
        `UPDATE productos SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // 2. Si vienen variantes, procesar actualizaciones/inserciones
    if (Array.isArray(variantes)) {
      for (const v of variantes) {
        const cleanSku = (v.sku && typeof v.sku === 'string' && v.sku.trim())
          ? v.sku.trim()
          : `SKU-${id}-${(v.talla || 'U').replace(/\s+/g, '')}-${(v.color || 'E').replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

        const varIncluyeIsv = v.precio_incluye_isv !== undefined 
          ? ((v.precio_incluye_isv === true || v.precio_incluye_isv === 1 || v.precio_incluye_isv === '1') ? 1 : 0)
          : (precio_incluye_isv !== undefined ? ((precio_incluye_isv === true || precio_incluye_isv === 1 || precio_incluye_isv === '1') ? 1 : 0) : 1);

        const targetTalla = (v.talla && v.talla.trim()) ? v.talla.trim() : 'Única';
        const targetColor = (v.color && v.color.trim()) ? v.color.trim() : 'Estándar';

        const finalVarDescPct = (aplica_descuento === false || aplica_descuento === 0 || aplica_descuento === '0') 
          ? 0.00 
          : (v.descuento_porcentaje !== undefined ? (parseFloat(v.descuento_porcentaje) || 0.00) : 0.00);

        const finalVarPrecioConDesc = (aplica_descuento === false || aplica_descuento === 0 || aplica_descuento === '0' || finalVarDescPct <= 0)
          ? null
          : (v.precio_con_descuento !== undefined ? (v.precio_con_descuento !== null ? parseFloat(v.precio_con_descuento) : null) : null);

        if (v.id) {
          // Verificar si otra variante distinta ya tiene esta combinación de talla y color
          const [duplicateVar] = await connection.query(
            `SELECT id FROM variantes_producto WHERE producto_id = ? AND talla = ? AND color = ? AND id != ? LIMIT 1`,
            [id, targetTalla, targetColor, v.id]
          );

          if (duplicateVar && duplicateVar.length > 0) {
            await connection.rollback();
            return errorResponse(res, {
              statusCode: 400,
              message: `Ya existe una variante con la combinación Talla "${targetTalla}" y Color "${targetColor}" en este producto.`
            });
          }

          // Actualizar variante existente
          await connection.query(
            `UPDATE variantes_producto 
             SET sku = COALESCE(?, sku),
                 codigo_barras = COALESCE(?, codigo_barras),
                 talla = ?,
                 color = ?,
                 precio_costo = COALESCE(?, precio_costo),
                 precio_venta = COALESCE(?, precio_venta),
                 precio_incluye_isv = COALESCE(?, precio_incluye_isv),
                 descuento_porcentaje = ?,
                 precio_con_descuento = ?,
                 precio_adicional = COALESCE(?, precio_adicional),
                 stock = COALESCE(?, stock),
                 stock_minimo = COALESCE(?, stock_minimo),
                 estado = COALESCE(?, estado)
             WHERE id = ? AND producto_id = ?`,
            [
              (v.sku && typeof v.sku === 'string' && v.sku.trim()) ? v.sku.trim() : null,
              v.codigo_barras ? v.codigo_barras.trim() : null,
              targetTalla,
              targetColor,
              v.precio_costo !== undefined ? parseFloat(v.precio_costo) : null,
              v.precio_venta,
              varIncluyeIsv,
              finalVarDescPct,
              finalVarPrecioConDesc,
              v.precio_adicional,
              v.stock,
              v.stock_minimo,
              v.estado || 'ACTIVO',
              v.id,
              id
            ]
          );
        } else {
          // Verificar si ya existe una variante para este producto con esa talla y color
          const [existingVar] = await connection.query(
            `SELECT id FROM variantes_producto WHERE producto_id = ? AND talla = ? AND color = ? LIMIT 1`,
            [id, targetTalla, targetColor]
          );

          if (existingVar && existingVar.length > 0) {
            // Ya existe en la base de datos: actualizamos esa variante para evitar duplicados
            const existingId = existingVar[0].id;
            await connection.query(
              `UPDATE variantes_producto 
               SET sku = COALESCE(?, sku),
                   codigo_barras = COALESCE(?, codigo_barras),
                   precio_costo = COALESCE(?, precio_costo),
                   precio_venta = COALESCE(?, precio_venta),
                   precio_incluye_isv = COALESCE(?, precio_incluye_isv),
                   descuento_porcentaje = ?,
                   precio_con_descuento = ?,
                   precio_adicional = COALESCE(?, precio_adicional),
                   stock = COALESCE(?, stock),
                   stock_minimo = COALESCE(?, stock_minimo),
                   estado = 'ACTIVO'
               WHERE id = ? AND producto_id = ?`,
              [
                (v.sku && typeof v.sku === 'string' && v.sku.trim()) ? v.sku.trim() : null,
                v.codigo_barras ? v.codigo_barras.trim() : null,
                v.precio_costo !== undefined ? parseFloat(v.precio_costo) : null,
                v.precio_venta || (precio_base || null),
                varIncluyeIsv,
                finalVarDescPct,
                finalVarPrecioConDesc,
                v.precio_adicional || 0,
                v.stock !== undefined ? parseInt(v.stock, 10) : null,
                v.stock_minimo !== undefined ? parseInt(v.stock_minimo, 10) : null,
                existingId,
                id
              ]
            );
          } else {
            // Insertar nueva variante para este producto
            await connection.query(
              `INSERT INTO variantes_producto 
               (producto_id, sku, codigo_barras, talla, color, precio_costo, precio_venta, precio_incluye_isv, descuento_porcentaje, precio_con_descuento, precio_adicional, stock, stock_minimo, estado)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
              [
                id,
                cleanSku,
                v.codigo_barras ? v.codigo_barras.trim() : null,
                targetTalla,
                targetColor,
                v.precio_costo !== undefined ? (parseFloat(v.precio_costo) || 0.00) : (parseFloat(precio_costo) || 0.00),
                v.precio_venta || (precio_base || 0),
                varIncluyeIsv,
                v.descuento_porcentaje !== undefined ? (parseFloat(v.descuento_porcentaje) || 0.00) : (parseFloat(descuento_porcentaje) || 0.00),
                v.precio_con_descuento !== undefined ? (v.precio_con_descuento !== null ? parseFloat(v.precio_con_descuento) : null) : (precio_con_descuento || null),
                v.precio_adicional || 0,
                v.stock !== undefined ? parseInt(v.stock, 10) : 0,
                v.stock_minimo !== undefined ? parseInt(v.stock_minimo, 10) : 3
              ]
            );
          }
        }
      }
    }

    await connection.commit();

    emitEvent('pos:stock_updated', { producto_id: id });
    emitEvent('pos:product_created', { producto_id: id });

    return successResponse(res, {
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, {
        statusCode: 400,
        message: 'No se puede guardar: una variante con la misma talla y color ya existe en este producto.'
      });
    }
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Eliminar (o desactivar) producto
 * DELETE /api/v1/productos/:id?force=false
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    if (force === 'true') {
      // Borrado físico (en cascada elimina variantes si no hay ventas activas asociadas)
      await db.query('DELETE FROM productos WHERE id = ?', [id]);
      return successResponse(res, {
        message: 'Producto eliminado definitivamente del catálogo'
      });
    }

    // Borrado lógico (recomendado en POS para integridad referencial de ventas)
    await db.query('UPDATE productos SET estado = "INACTIVO" WHERE id = ?', [id]);
    await db.query('UPDATE variantes_producto SET estado = "INACTIVO" WHERE producto_id = ?', [id]);

    emitEvent('pos:stock_updated', { producto_id: id });
    emitEvent('pos:product_created', { producto_id: id });

    logActivity({
      req,
      modulo: 'INVENTARIO',
      accion: 'ELIMINAR_PRODUCTO',
      descripcion: `Producto ID ${id} eliminado/inactivado del inventario`
    });

    return successResponse(res, {
      message: 'Producto inactivado exitosamente (borrado lógico)'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar (o inactivar) una variante de producto
 * DELETE /api/v1/productos/variantes/:id
 */
const deleteVariant = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener la variante
    const [rows] = await db.query(
      'SELECT id, producto_id, sku, talla, color FROM variantes_producto WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Variante no encontrada'
      });
    }

    const variante = rows[0];

    // Verificar si tiene ventas o devoluciones asociadas para mantener integridad referencial
    const [sales] = await db.query(
      'SELECT COUNT(*) as count FROM detalle_ventas WHERE variante_id = ?',
      [id]
    );
    const [returns] = await db.query(
      'SELECT COUNT(*) as count FROM detalle_devoluciones WHERE variante_id = ?',
      [id]
    );

    const hasHistory = (sales[0]?.count > 0) || (returns[0]?.count > 0);

    if (hasHistory) {
      // Inactivación lógica si ya fue vendida en alguna factura
      await db.query(
        'UPDATE variantes_producto SET estado = "INACTIVO" WHERE id = ?',
        [id]
      );
    } else {
      // Eliminación física si nunca se ha vendido
      await db.query('DELETE FROM variantes_producto WHERE id = ?', [id]);
    }

    emitEvent('pos:stock_updated', { producto_id: variante.producto_id });
    emitEvent('pos:product_created', { producto_id: variante.producto_id });

    logActivity({
      req,
      modulo: 'INVENTARIO',
      accion: 'ELIMINAR_VARIANTE',
      descripcion: `Variante eliminada/inactivada: SKU ${variante.sku} (${variante.talla}/${variante.color}) del producto ID ${variante.producto_id}`,
      detalles: variante
    });

    return successResponse(res, {
      message: hasHistory 
        ? `Variante ${variante.talla} / ${variante.color} inactivada correctamente (conservada en historial de ventas)` 
        : `Variante ${variante.talla} / ${variante.color} eliminada exitosamente`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ajustar stock de una variante específica (auditorías, mermas o recepciones rápidas)
 * PATCH /api/v1/productos/variantes/:id/stock
 */
const updateVariantStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, delta } = req.body;

    if (stock === undefined && delta === undefined) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Debes enviar "stock" (valor absoluto) o "delta" (incremento/decremento)'
      });
    }

    let sql = '';
    let params = [];

    if (stock !== undefined) {
      sql = 'UPDATE variantes_producto SET stock = ? WHERE id = ?';
      params = [parseInt(stock, 10), id];
    } else {
      sql = 'UPDATE variantes_producto SET stock = stock + ? WHERE id = ?';
      params = [parseInt(delta, 10), id];
    }

    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Variante no encontrada'
      });
    }

    const [updatedRow] = await db.query(
      'SELECT id, producto_id, sku, talla, color, stock, stock_minimo FROM variantes_producto WHERE id = ?',
      [id]
    );

    // Notificar cambio de stock en tiempo real
    emitEvent('pos:stock_updated', updatedRow[0]);

    // Auditoría de ajuste de stock
    logActivity({
      req,
      modulo: 'INVENTARIO',
      accion: 'AJUSTE_STOCK',
      descripcion: `Stock ajustado para SKU ${updatedRow[0].sku} (${updatedRow[0].talla}/${updatedRow[0].color}): Nuevo stock = ${updatedRow[0].stock}`,
      detalles: updatedRow[0]
    });

    return successResponse(res, {
      message: 'Stock de la variante actualizado correctamente',
      data: updatedRow[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Subir fotografía de producto
 * POST /api/v1/productos/upload-imagen
 */
const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'No se ha subido ningún archivo de imagen'
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const relativePath = `/uploads/products/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativePath}`;

    return successResponse(res, {
      statusCode: 201,
      message: 'Fotografía subida exitosamente',
      data: {
        filename: req.file.filename,
        path: relativePath,
        url: fullUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener listado de variantes y productos formateados para la impresión de etiquetas y códigos de barra
 * GET /api/v1/productos/etiquetas/items
 */
const getItemsForLabels = async (req, res, next) => {
  try {
    const { search, categoria_id, producto_id, solo_con_stock, limit = 200 } = req.query;

    const whereClauses = ["v.estado = 'ACTIVO'", "p.estado = 'ACTIVO'"];
    const params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereClauses.push('(p.nombre LIKE ? OR v.sku LIKE ? OR v.codigo_barras LIKE ? OR v.talla LIKE ? OR v.color LIKE ?)');
      params.push(term, term, term, term, term);
    }

    if (categoria_id) {
      whereClauses.push('p.categoria_id = ?');
      params.push(categoria_id);
    }

    if (producto_id) {
      whereClauses.push('p.id = ?');
      params.push(producto_id);
    }

    if (solo_con_stock === 'true' || solo_con_stock === '1') {
      whereClauses.push('v.stock > 0');
    }

    const limitNum = Math.min(500, parseInt(limit, 10) || 200);

    const sql = `
      SELECT v.id AS variante_id,
             v.producto_id,
             p.nombre AS producto_nombre,
             c.id AS categoria_id,
             c.nombre AS categoria_nombre,
             v.sku,
             v.codigo_barras,
             v.talla,
             v.color,
             v.precio_venta,
             v.precio_con_descuento,
             v.descuento_porcentaje,
             v.stock,
             v.stock_minimo,
             COALESCE(v.imagen_url, p.imagen_url) AS imagen_url,
             p.precio_incluye_isv
      FROM variantes_producto v
      INNER JOIN productos p ON v.producto_id = p.id
      INNER JOIN categorias c ON p.categoria_id = c.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY p.nombre ASC, v.talla ASC, v.color ASC
      LIMIT ?
    `;
    params.push(limitNum);

    const [rows] = await db.query(sql, params);

    return successResponse(res, {
      message: 'Items para impresión de etiquetas obtenidos correctamente',
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  findVariantByBarcodeOrSku,
  getItemsForLabels,
  createProduct,
  updateProduct,
  deleteProduct,
  updateVariantStock,
  deleteVariant,
  uploadProductImage
};

