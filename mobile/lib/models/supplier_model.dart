class SupplierModel {
  final int id;
  final String nombreEmpresa;
  final String? contactoNombre;
  final String? rtn;
  final String telefono;
  final String? telefonoSecundario;
  final String? email;
  final String? direccion;
  final String ciudad;
  final String? categoriaSuministro;
  final int diasCredito;
  final String? banco;
  final String? cuentaBancaria;
  final String? notas;
  final String estado;

  SupplierModel({
    required this.id,
    required this.nombreEmpresa,
    this.contactoNombre,
    this.rtn,
    required this.telefono,
    this.telefonoSecundario,
    this.email,
    this.direccion,
    required this.ciudad,
    this.categoriaSuministro,
    required this.diasCredito,
    this.banco,
    this.cuentaBancaria,
    this.notas,
    required this.estado,
  });

  factory SupplierModel.fromJson(Map<String, dynamic> json) {
    return SupplierModel(
      id: json['id'] ?? 0,
      nombreEmpresa: json['nombre_empresa'] ?? '',
      contactoNombre: json['contacto_nombre'],
      rtn: json['rtn'],
      telefono: json['telefono'] ?? '',
      telefonoSecundario: json['telefono_secundario'],
      email: json['email'],
      direccion: json['direccion'],
      ciudad: json['ciudad'] ?? 'Tocoa',
      categoriaSuministro: json['categoria_suministro'],
      diasCredito: json['dias_credito'] ?? 0,
      banco: json['banco'],
      cuentaBancaria: json['cuenta_bancaria'],
      notas: json['notas'],
      estado: json['estado'] ?? 'ACTIVO',
    );
  }

  bool get isActivo => estado == 'ACTIVO';
}

