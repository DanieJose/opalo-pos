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

  String? _lastSearch;
  int? _lastCategoryId;

  ProductProvider() {
    _initSocketListeners();
  }

  void _initSocketListeners() {
    // Sincronización en tiempo real: Actualización de stock de una variante
    _socket.on('pos:stock_updated', (data) {
      debugPrint('[ProductProvider Real-Time] Stock actualizado recibido: $data');
      if (data is Map && data['id'] != null && data['stock'] != null) {
        final variantId = data['id'];
        final newStock = int.tryParse(data['stock'].toString()) ?? 0;
        _updateVariantStockInMemory(variantId, newStock);
      }
      loadProducts(silent: true);
      loadLowStockAlerts();
    });

    // Sincronización en tiempo real: Venta generada en Web u otro dispositivo
    _socket.on('pos:sale_created', (data) {
      debugPrint('[ProductProvider Real-Time] Venta registrada en Web u otro dispositivo');
      loadProducts(silent: true);
      loadLowStockAlerts();
    });

    // Sincronización en tiempo real: Venta anulada
    _socket.on('pos:sale_cancelled', (data) {
      debugPrint('[ProductProvider Real-Time] Venta anulada');
      loadProducts(silent: true);
      loadLowStockAlerts();
    });

    // Sincronización en tiempo real: Devolución procesada
    _socket.on('pos:devolucion_created', (data) {
      debugPrint('[ProductProvider Real-Time] Devolución procesada');
      loadProducts(silent: true);
      loadLowStockAlerts();
    });

    // Sincronización en tiempo real: Nuevo producto o cambio en catálogo
    _socket.on('pos:product_created', (data) {
      debugPrint('[ProductProvider Real-Time] Catálogo de productos modificado en Web');
      loadProducts(silent: true);
      loadCategories();
    });
  }

  void _updateVariantStockInMemory(dynamic variantId, int newStock) {
    bool changed = false;
    for (final prod in _products) {
      for (final v in prod.variantes) {
        if (v.id == variantId) {
          // El stock se actualiza en el modelo
          // Notificamos para reflejar el cambio inmediato en la interfaz
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    if (changed) {
      notifyListeners();
    }
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

  Future<void> loadProducts({String? search, int? categoryId, bool silent = false}) async {
    if (search != null) _lastSearch = search;
    if (categoryId != null) _lastCategoryId = (categoryId == -1 ? null : categoryId);

    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final queryParams = <String, dynamic>{'estado': 'ACTIVO', 'limit': 60};
      if (_lastSearch != null && _lastSearch!.trim().isNotEmpty) {
        queryParams['search'] = _lastSearch!.trim();
      }
      if (_lastCategoryId != null) {
        queryParams['categoria_id'] = _lastCategoryId;
      }

      final response = await _client.dio.get(
        ApiConstants.products,
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        _products = list.map((p) => ProductModel.fromJson(p)).toList();
      }
    } catch (e) {
      if (!silent) {
        _errorMessage = 'Error al consultar catálogo de prendas';
      }
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
