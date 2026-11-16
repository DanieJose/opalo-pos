import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/network/socket_service.dart';
import '../models/product_model.dart';

class ProductProvider extends ChangeNotifier {
  final ApiClient _client = ApiClient();
  final SocketService _socket = SocketService();

  List<ProductModel> _products = [];
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _lowStockAlerts = [];
  bool _isLoading = false;
  String? _errorMessage;

  ProductProvider() {
    _initSocketListeners();
  }

  void _initSocketListeners() {
    // Sincronización en tiempo real: Actualización de stock de una variante
    _socket.on('pos:stock_updated', (data) {
      debugPrint('[ProductProvider Real-Time] Stock actualizado: $data');
      loadProducts();
    });

    // Sincronización en tiempo real: Venta generada en Web u otro dispositivo
    _socket.on('pos:sale_created', (data) {
      debugPrint('[ProductProvider Real-Time] Venta registrada en otro dispositivo');
      loadProducts();
      loadLowStockAlerts();
    });

    // Sincronización en tiempo real: Venta anulada
    _socket.on('pos:sale_cancelled', (data) {
      loadProducts();
      loadLowStockAlerts();
    });

    // Sincronización en tiempo real: Nuevo producto creado
    _socket.on('pos:product_created', (data) {
      loadProducts();
    });
  }

  List<ProductModel> get products => _products;
  List<Map<String, dynamic>> get categories => _categories;
  List<Map<String, dynamic>> get lowStockAlerts => _lowStockAlerts;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadCategories() async {
    try {
      final response = await _client.dio.get('${ApiConstants.categories}?estado=ACTIVO');
      if (response.data['success'] == true) {
        _categories = List<Map<String, dynamic>>.from(response.data['data']);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error cargando categorías: $e');
    }
  }

  Future<void> loadProducts({String? search, int? categoryId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{'estado': 'ACTIVO', 'limit': 50};
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (categoryId != null) queryParams['categoria_id'] = categoryId;

      final response = await _client.dio.get(
        ApiConstants.products,
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        _products = list.map((p) => ProductModel.fromJson(p)).toList();
      }
    } catch (e) {
      _errorMessage = 'Error al consultar catálogo de prendas';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<VariantModel?> findVariantByBarcodeOrSku(String code) async {
    try {
      final response = await _client.dio.get(
        ApiConstants.searchBarcode,
        queryParameters: {'term': code.trim()},
      );

      if (response.data['success'] == true && response.data['data'] != null) {
        return VariantModel.fromJson(response.data['data']);
      }
    } catch (_) {}
    return null;
  }

  Future<void> loadLowStockAlerts() async {
    try {
      final response = await _client.dio.get(ApiConstants.reportsLowStock);
      if (response.data['success'] == true) {
        _lowStockAlerts = List<Map<String, dynamic>>.from(response.data['data']);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error cargando alertas de stock: $e');
    }
  }
}

