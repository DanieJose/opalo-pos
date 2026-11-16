class CustomerModel {
  final int id;
  final String nombre;
  final String? rtnDni;
  final String? telefono;
  final String? email;
  final String? codigoQrLealtad;
  final int puntosLealtad;

  CustomerModel({
    required this.id,
    required this.nombre,
    this.rtnDni,
    this.telefono,
    this.email,
    this.codigoQrLealtad,
    required this.puntosLealtad,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      rtnDni: json['rtn_dni'],
      telefono: json['telefono'],
      email: json['email'],
      codigoQrLealtad: json['codigo_qr_lealtad'],
      puntosLealtad: json['puntos_lealtad'] ?? 0,
    );
  }
}

