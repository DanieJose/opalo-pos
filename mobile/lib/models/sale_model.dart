class SaleItemModel {
  final int varianteId;
  final String nombre;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;

  SaleItemModel({
    required this.varianteId,
    required this.nombre,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
  });

  factory SaleItemModel.fromJson(Map<String, dynamic> json) {
    return SaleItemModel(
      varianteId: json['variante_id'] ?? 0,
      nombre: json['nombre'] ?? '',
      cantidad: json['cantidad'] ?? 1,
      precioUnitario: (json['precio_unitario'] != null)
          ? double.tryParse(json['precio_unitario'].toString()) ?? 0.0
          : 0.0,
      subtotal: (json['subtotal'] != null)
          ? double.tryParse(json['subtotal'].toString()) ?? 0.0
          : 0.0,
    );
  }
}

class SaleReceiptModel {
  final int id;
  final String numeroFactura;
  final String fecha;
  final double subtotal;
  final double isv15;
  final double total;
  final String metodoPago;
  final String? bancoTransferencia;
  final double montoRecibido;
  final double cambio;
  final int puntosGanados;
  final List<SaleItemModel> items;

  SaleReceiptModel({
    required this.id,
    required this.numeroFactura,
    required this.fecha,
    required this.subtotal,
    required this.isv15,
    required this.total,
    required this.metodoPago,
    this.bancoTransferencia,
    required this.montoRecibido,
    required this.cambio,
    required this.puntosGanados,
    required this.items,
  });

  factory SaleReceiptModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List? ?? [];
    final itemsList = rawItems.map((i) => SaleItemModel.fromJson(i)).toList();

    return SaleReceiptModel(
      id: json['id'] ?? 0,
      numeroFactura: json['numero_factura'] ?? '',
      fecha: json['fecha'] ?? '',
      subtotal: (json['subtotal'] != null)
          ? double.tryParse(json['subtotal'].toString()) ?? 0.0
          : 0.0,
      isv15: (json['isv_15'] != null)
          ? double.tryParse(json['isv_15'].toString()) ?? 0.0
          : 0.0,
      total: (json['total'] != null)
          ? double.tryParse(json['total'].toString()) ?? 0.0
          : 0.0,
      metodoPago: json['metodo_pago'] ?? 'EFECTIVO',
      bancoTransferencia: json['banco_transferencia'],
      montoRecibido: (json['monto_recibido'] != null)
          ? double.tryParse(json['monto_recibido'].toString()) ?? 0.0
          : 0.0,
      cambio: (json['cambio'] != null)
          ? double.tryParse(json['cambio'].toString()) ?? 0.0
          : 0.0,
      puntosGanados: json['puntos_lealtad_ganados'] ?? 0,
      items: itemsList,
    );
  }
}

