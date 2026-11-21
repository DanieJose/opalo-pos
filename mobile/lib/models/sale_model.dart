class SaleItemModel {
  final int varianteId;
  final String nombre;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;
  final double descuento;

  SaleItemModel({
    required this.varianteId,
    required this.nombre,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
    this.descuento = 0.0,
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
      descuento: (json['descuento'] != null)
          ? double.tryParse(json['descuento'].toString()) ?? 0.0
          : 0.0,
    );
  }
}

class SaleReceiptModel {
  final int id;
  final String numeroFactura;
  final String fecha;
  final String clienteNombre;
  final String? clienteRtn;
  final double subtotal;
  final double isv15;
  final double isv18;
  final double totalDescuento;
  final double total;
  final String metodoPago;
  final double montoEfectivo;
  final double montoTarjeta;
  final double montoTransferencia;
  final String? bancoTransferencia;
  final double montoRecibido;
  final double cambio;
  final int puntosGanados;
  final List<SaleItemModel> items;

  SaleReceiptModel({
    required this.id,
    required this.numeroFactura,
    required this.fecha,
    required this.clienteNombre,
    this.clienteRtn,
    required this.subtotal,
    required this.isv15,
    this.isv18 = 0.0,
    this.totalDescuento = 0.0,
    required this.total,
    required this.metodoPago,
    this.montoEfectivo = 0.0,
    this.montoTarjeta = 0.0,
    this.montoTransferencia = 0.0,
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
      clienteNombre: json['cliente_nombre'] ?? 'Consumidor Final',
      clienteRtn: json['cliente_rtn'],
      subtotal: (json['subtotal'] != null)
          ? double.tryParse(json['subtotal'].toString()) ?? 0.0
          : 0.0,
      isv15: (json['isv_15'] != null)
          ? double.tryParse(json['isv_15'].toString()) ?? 0.0
          : 0.0,
      isv18: (json['isv_18'] != null)
          ? double.tryParse(json['isv_18'].toString()) ?? 0.0
          : 0.0,
      totalDescuento: (json['total_descuento'] != null)
          ? double.tryParse(json['total_descuento'].toString()) ?? 0.0
          : 0.0,
      total: (json['total'] != null)
          ? double.tryParse(json['total'].toString()) ?? 0.0
          : 0.0,
      metodoPago: json['metodo_pago'] ?? 'EFECTIVO',
      montoEfectivo: (json['monto_efectivo'] != null)
          ? double.tryParse(json['monto_efectivo'].toString()) ?? 0.0
          : 0.0,
      montoTarjeta: (json['monto_tarjeta'] != null)
          ? double.tryParse(json['monto_tarjeta'].toString()) ?? 0.0
          : 0.0,
      montoTransferencia: (json['monto_transferencia'] != null)
          ? double.tryParse(json['monto_transferencia'].toString()) ?? 0.0
          : 0.0,
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
