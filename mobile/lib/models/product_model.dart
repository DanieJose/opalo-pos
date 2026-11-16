class VariantModel {
  final int id;
  final int productoId;
  final String sku;
  final String? codigoBarras;
  final String talla;
  final String color;
  final double precioCosto;
  final double precioVenta;
  final double descuentoPorcentaje;
  final double? precioConDescuento;
  final int stock;
  final int stockMinimo;

  VariantModel({
    required this.id,
    required this.productoId,
    required this.sku,
    this.codigoBarras,
    required this.talla,
    required this.color,
    this.precioCosto = 0.0,
    required this.precioVenta,
    this.descuentoPorcentaje = 0.0,
    this.precioConDescuento,
    required this.stock,
    required this.stockMinimo,
  });

  factory VariantModel.fromJson(Map<String, dynamic> json) {
    return VariantModel(
      id: json['id'] ?? json['variante_id'] ?? 0,
      productoId: json['producto_id'] ?? 0,
      sku: json['sku'] ?? '',
      codigoBarras: json['codigo_barras'],
      talla: json['talla'] ?? 'Única',
      color: json['color'] ?? 'Estándar',
      precioCosto: (json['precio_costo'] != null)
          ? double.tryParse(json['precio_costo'].toString()) ?? 0.0
          : 0.0,
      precioVenta: (json['precio_venta'] != null)
          ? double.tryParse(json['precio_venta'].toString()) ?? 0.0
          : 0.0,
      descuentoPorcentaje: (json['descuento_porcentaje'] != null)
          ? double.tryParse(json['descuento_porcentaje'].toString()) ?? 0.0
          : 0.0,
      precioConDescuento: (json['precio_con_descuento'] != null)
          ? double.tryParse(json['precio_con_descuento'].toString())
          : null,
      stock: json['stock'] ?? 0,
      stockMinimo: json['stock_minimo'] ?? 3,
    );
  }

  bool get isLowStock => stock <= stockMinimo;
  bool get hasStock => stock > 0;
  double get precioEfectivo {
    if (precioConDescuento != null && precioConDescuento! > 0) return precioConDescuento!;
    if (descuentoPorcentaje > 0) {
      return precioVenta * (1 - descuentoPorcentaje / 100);
    }
    return precioVenta;
  }
  double get profit => precioEfectivo - precioCosto;
  double get profitMargin => precioCosto > 0 ? (profit / precioCosto) * 100 : 0.0;
}

class ProductModel {
  final int id;
  final String nombre;
  final String? descripcion;
  final double precioCosto;
  final double precioBase;
  final bool aplicaDescuento;
  final double descuentoPorcentaje;
  final double? precioConDescuento;
  final String categoriaNombre;
  final String? imagenUrl;
  final List<VariantModel> variantes;
  final int totalStock;

  ProductModel({
    required this.id,
    required this.nombre,
    this.descripcion,
    this.precioCosto = 0.0,
    required this.precioBase,
    this.aplicaDescuento = false,
    this.descuentoPorcentaje = 0.0,
    this.precioConDescuento,
    required this.categoriaNombre,
    this.imagenUrl,
    required this.variantes,
    required this.totalStock,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final rawVariantes = json['variantes'] as List? ?? [];
    final variantesList = rawVariantes.map((v) => VariantModel.fromJson(v)).toList();

    return ProductModel(
      id: json['id'] ?? json['producto_id'] ?? 0,
      nombre: json['nombre'] ?? json['producto_nombre'] ?? '',
      descripcion: json['descripcion'],
      precioCosto: (json['precio_costo'] != null)
          ? double.tryParse(json['precio_costo'].toString()) ?? 0.0
          : 0.0,
      precioBase: (json['precio_base'] != null)
          ? double.tryParse(json['precio_base'].toString()) ?? 0.0
          : 0.0,
      aplicaDescuento: json['aplica_descuento'] == 1 || json['aplica_descuento'] == true,
      descuentoPorcentaje: (json['descuento_porcentaje'] != null)
          ? double.tryParse(json['descuento_porcentaje'].toString()) ?? 0.0
          : 0.0,
      precioConDescuento: (json['precio_con_descuento'] != null)
          ? double.tryParse(json['precio_con_descuento'].toString())
          : null,
      categoriaNombre: json['categoria_nombre'] ?? 'Accesorios',
      imagenUrl: json['imagen_url'],
      variantes: variantesList,
      totalStock: json['total_stock'] ??
          variantesList.fold<int>(0, (sum, v) => sum + v.stock),
    );
  }

  double get precioEfectivo {
    if (aplicaDescuento && precioConDescuento != null && precioConDescuento! > 0) {
      return precioConDescuento!;
    }
    if (aplicaDescuento && descuentoPorcentaje > 0) {
      return precioBase * (1 - descuentoPorcentaje / 100);
    }
    return precioBase;
  }

  double get profit => precioEfectivo - precioCosto;
  double get profitMargin => precioCosto > 0 ? (profit / precioCosto) * 100 : 0.0;
}

