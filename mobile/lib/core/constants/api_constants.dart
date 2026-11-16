import 'dart:io';

class ApiConstants {
  // En emulador Android: 10.0.2.2 accede al localhost de Windows
  // En iOS Simulator o Web: localhost
  // En dispositivo físico: IP local (ej. 192.168.1.100)
  static String get defaultBaseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:4000/api/v1';
    }
    return 'http://localhost:4000/api/v1';
  }

  static String baseUrl = defaultBaseUrl;

  // Endpoints
  static const String login = '/auth/login';
  static const String profile = '/auth/profile';
  static const String products = '/productos';
  static const String searchBarcode = '/productos/buscar/codigo';
  static const String categories = '/categorias';
  static const String customers = '/clientes';
  static const String searchCustomerQr = '/clientes/buscar/qr';
  static const String sales = '/ventas';
  static const String reportsDashboard = '/reportes/dashboard';
  static const String reportsLowStock = '/reportes/stock-bajo';
  static const String cajaEstado = '/caja/estado';
  static const String cajaAbrir = '/caja/abrir';
  static const String cajaCerrar = '/caja/cerrar';
  static const String suppliers = '/proveedores';

  static String formatImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final serverHost = baseUrl.replaceAll('/api/v1', '');
    return '$serverHost${path.startsWith('/') ? '' : '/'}$path';
  }
}

