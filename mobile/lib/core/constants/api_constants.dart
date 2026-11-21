import 'package:shared_preferences/shared_preferences.dart';

class ApiConstants {
  // URLs de conexión disponibles
  static const String productionBaseUrl = 'https://opalo-pos-production.up.railway.app/api/v1';
  static const String localWifiBaseUrl = 'http://192.168.1.5:4000/api/v1';
  static const String localAndroidBaseUrl = 'http://10.0.2.2:4000/api/v1';
  static const String localBaseUrl = 'http://localhost:4000/api/v1';

  static const String prefKeyBaseUrl = 'opalo_api_base_url';

  // Por defecto se conecta a Producción en Railway
  static String baseUrl = productionBaseUrl;

  /// Cargar URL guardada en almacenamiento local o usar producción por defecto
  static Future<String> initBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(prefKeyBaseUrl);
      if (saved != null && saved.trim().isNotEmpty) {
        baseUrl = saved.trim();
        return baseUrl;
      }
    } catch (_) {}
    baseUrl = productionBaseUrl;
    return baseUrl;
  }

  /// Guardar nueva URL base (producción o local)
  static Future<void> saveBaseUrl(String url) async {
    baseUrl = url.trim();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(prefKeyBaseUrl, baseUrl);
    } catch (_) {}
  }

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

  /// Convierte rutas relativas a URLs absolutas respetando el host actual (Railway o local)
  static String formatImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final serverHost = baseUrl.replaceAll(RegExp(r'/api/v1/?$'), '');
    return '$serverHost${path.startsWith('/') ? '' : '/'}$path';
  }
}
