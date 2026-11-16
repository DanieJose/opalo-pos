import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/product_model.dart';
import '../models/customer_model.dart';
import '../models/sale_model.dart';

class MobileCartItem {
  final int varianteId;
  final int productoId;
  final String productName;
  final String talla;
  final String color;
  final String sku;
  final double precioUnitario;
  int cantidad;
  final int stockDisponible;

  MobileCartItem({
    required this.varianteId,
    required this.productoId,
    required this.productName,
    required this.talla,
    required this.color,
    required this.sku,
    required this.precioUnitario,
    required this.cantidad,
    required this.stockDisponible,
  });

  double get subtotal => precioUnitario * cantidad;
}

class CartProvider extends ChangeNotifier {
  final ApiClient _client = ApiClient();

  final List<MobileCartItem> _items = [];
  CustomerModel? _selectedCustomer;
  bool _isSubmitting = false;

  List<MobileCartItem> get items => _items;
  CustomerModel? get selectedCustomer => _selectedCustomer;
  bool get isSubmitting => _isSubmitting;

  int get totalItemsCount => _items.fold<int>(0, (sum, i) => sum + i.cantidad);

  double get subtotal => _items.fold<double>(0.0, (sum, i) => sum + i.subtotal);
  double get isv15 => double.parse((subtotal * 0.15).toStringAsFixed(2));
  double get total => double.parse((subtotal + isv15).toStringAsFixed(2));

  bool addItem({
    required VariantModel variant,
    required String productName,
    int quantity = 1,
  }) {
    final index = _items.indexWhere((i) => i.varianteId == variant.id);

    if (index >= 0) {
      final current = _items[index];
      if (current.cantidad + quantity > variant.stock) {
        return false;
      }
      current.cantidad += quantity;
      notifyListeners();
      return true;
    }

    if (variant.stock < quantity) {
      return false;
    }

    _items.add(
      MobileCartItem(
        varianteId: variant.id,
        productoId: variant.productoId,
        productName: productName,
        talla: variant.talla,
        color: variant.color,
        sku: variant.sku,
        precioUnitario: variant.precioVenta,
        cantidad: quantity,
        stockDisponible: variant.stock,
      ),
    );
    notifyListeners();
    return true;
  }

  void updateQuantity(int index, int newQty) {
    if (index < 0 || index >= _items.length) return;
    if (newQty <= 0) {
      _items.removeAt(index);
    } else {
      final item = _items[index];
      if (newQty <= item.stockDisponible) {
        item.cantidad = newQty;
      }
    }
    notifyListeners();
  }

  void removeItem(int index) {
    if (index >= 0 && index < _items.length) {
      _items.removeAt(index);
      notifyListeners();
    }
  }

  void setCustomer(CustomerModel? customer) {
    _selectedCustomer = customer;
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _selectedCustomer = null;
    notifyListeners();
  }

  Future<SaleReceiptModel?> checkout({
    required String metodoPago,
    String? bancoTransferencia,
    double? montoRecibido,
  }) async {
    if (_items.isEmpty) return null;

    _isSubmitting = true;
    notifyListeners();

    try {
      final payload = {
        'cliente_id': _selectedCustomer?.id,
        'metodo_pago': metodoPago,
        'banco_transferencia': metodoPago == 'TRANSFERENCIA' ? bancoTransferencia : null,
        'monto_recibido': montoRecibido ?? total,
        'items': _items.map((i) => {
          'variante_id': i.varianteId,
          'cantidad': i.cantidad,
          'descuento': 0,
        }).toList(),
      };

      final response = await _client.dio.post(
        ApiConstants.sales,
        data: payload,
      );

      if (response.data['success'] == true) {
        final receipt = SaleReceiptModel.fromJson(response.data['data']);
        clear();
        _isSubmitting = false;
        notifyListeners();
        return receipt;
      }
    } on DioException catch (e) {
      debugPrint('Error en checkout: ${e.response?.data}');
    } catch (e) {
      debugPrint('Error inesperado en checkout: $e');
    }

    _isSubmitting = false;
    notifyListeners();
    return null;
  }
}

