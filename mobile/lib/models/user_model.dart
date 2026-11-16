class UserModel {
  final int id;
  final String nombre;
  final String email;
  final String? telefono;
  final String rolNombre;

  UserModel({
    required this.id,
    required this.nombre,
    required this.email,
    this.telefono,
    required this.rolNombre,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String rol = 'CAJERO';
    if (json['rol'] != null && json['rol'] is Map) {
      rol = json['rol']['nombre'] ?? 'CAJERO';
    } else if (json['rol_nombre'] != null) {
      rol = json['rol_nombre'];
    }

    return UserModel(
      id: json['id'] ?? 0,
      nombre: json['nombre'] ?? '',
      email: json['email'] ?? '',
      telefono: json['telefono'],
      rolNombre: rol,
    );
  }

  bool get isAdmin => rolNombre == 'ADMIN';
}

