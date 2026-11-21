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
  final bool precioIncluyeIsv;
  final String tipoImpuesto;
  double descuento;

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
    this.precioIncluyeIsv = true,
    this.tipoImpuesto = 'ISV_15',
    this.descuento = 0.0,
  });

  /// Total final de la línea que paga el cliente
  double get totalCobrado => (precioUnitario * cantidad) - descuento;

  /// Base imponible (Subtotal gravable)
  double get subtotalItem {
    if (tipoImpuesto == 'EXENTO') return totalCobrado;
    if (precioIncluyeIsv) {
      return double.parse((totalCobrado / 1.15).toStringAsFixed(2));
    }
    return totalCobrado;
  }

  /// Impuesto ISV (15%)
  double get isv15Item {
    if (tipoImpuesto == 'EXENTO') return 0.0;
    if (precioIncluyeIsv) {
      return double.parse((totalCobrado - subtotalItem).toStringAsFixed(2));
    }
    return double.parse((totalCobrado * 0.15).toStringAsFixed(2));
  }
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

  double get subtotalGravado15 => _items.fold<double>(
      0.0, (sum, i) => i.tipoImpuesto != 'EXENTO' ? sum + i.subtotalItem : sum);

  double get subtotalGravado18 => 0.00;

  double get subtotalExento => _items.fold<double>(
      0.0, (sum, i) => i.tipoImpuesto == 'EXENTO' ? sum + i.totalCobrado : sum);

  double get subtotal =>
      double.parse((subtotalGravado15 + subtotalExento).toStringAsFixed(2));

  double get isv15 => double.parse(
      _items.fold<double>(0.0, (sum, i) => sum + i.isv15Item).toStringAsFixed(2));

  double get isv18 => 0.00;

  double get totalDescuento => double.parse(
      _items.fold<double>(0.0, (sum, i) => sum + i.descuento).toStringAsFixed(2));

  /// Total Cobro al Cliente: Idéntico al cálculo de la Web
  double get total => double.parse((subtotal + isv15).toStringAsFixed(2));

  bool addItem({
    required VariantModel variant,
    required String productName,
    int quantity = 1,
    double discount = 0.0,
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

    final double effectivePrice = (variant.precioConDescuento != null &&
            variant.precioConDescuento! > 0)
        ? variant.precioConDescuento!
        : (variant.descuentoPorcentaje > 0
            ? variant.precioVenta * (1 - variant.descuentoPorcentaje / 100)
            : variant.precioVenta);

    _items.add(
      MobileCartItem(
        varianteId: variant.id,
        productoId: variant.productoId,
        productName: productName,
        talla: variant.talla,
        color: variant.color,
        sku: variant.sku,
        precioUnitario: effectivePrice,
        cantidad: quantity,
        stockDisponible: variant.stock,
        precioIncluyeIsv: variant.precioIncluyeIsv,
        tipoImpuesto: variant.tipoImpuesto,
        descuento: discount,
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

  void updateDiscount(int index, double discount) {
    if (index < 0 || index >= _items.length) return;
    final item = _items[index];
    final maxAllowed = item.precioUnitario * item.cantidad;
    item.descuento = discount.clamp(0.0, maxAllowed);
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
    double? montoEfectivo,
    double? montoTarjeta,
    double? montoTransferencia,
  }) async {
    if (_items.isEmpty) return null;

    _isSubmitting = true;
    notifyListeners();

    try {
      final payload = {
        'cliente_id': _selectedCustomer?.id,
        'metodo_pago': metodoPago,
        'monto_efectivo': montoEfectivo ?? (metodoPago == 'EFECTIVO' ? total : 0.0),
        'monto_tarjeta': montoTarjeta ?? (metodoPago == 'TARJETA' ? total : 0.0),
        'monto_transferencia': montoTransferencia ?? (metodoPago == 'TRANSFERENCIA' ? total : 0.0),
        'banco_transferencia': metodoPago == 'TRANSFERENCIA' ? bancoTransferencia : null,
        'monto_recibido': montoRecibido ?? total,
        'items': _items.map((i) => {
          'variante_id': i.varianteId,
          'cantidad': i.cantidad,
          'descuento': i.descuento,
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
