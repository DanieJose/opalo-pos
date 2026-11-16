import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/network/socket_service.dart';
import '../models/customer_model.dart';

class CustomerProvider extends ChangeNotifier {
  final ApiClient _client = ApiClient();
  final SocketService _socket = SocketService();

  List<CustomerModel> _customers = [];
  bool _isLoading = false;
  String? _errorMessage;

  CustomerProvider() {
    _initSocketListeners();
  }

  void _initSocketListeners() {
    _socket.on('pos:customer_created', (data) {
      debugPrint('[CustomerProvider Real-Time] Nueva clienta registrada');
      loadCustomers();
    });

    _socket.on('pos:sale_created', (data) {
      // Si la venta sumó puntos a una clienta, refrescar lista
      if (data != null && data['cliente_id'] != null) {
        loadCustomers();
      }
    });
  }

  List<CustomerModel> get customers => _customers;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadCustomers({String? search}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{'estado': 'ACTIVO', 'limit': 30};
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await _client.dio.get(
        ApiConstants.customers,
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        _customers = list.map((c) => CustomerModel.fromJson(c)).toList();
      }
    } catch (e) {
      _errorMessage = 'Error cargando lista de clientas';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<CustomerModel?> findCustomerByQR(String qrCode) async {
    try {
      final response = await _client.dio.get(
        '${ApiConstants.searchCustomerQr}/$qrCode',
      );

      if (response.data['success'] == true && response.data['data'] != null) {
        return CustomerModel.fromJson(response.data['data']);
      }
    } catch (_) {}
    return null;
  }

  Future<CustomerModel?> createCustomer({
    required String nombre,
    String? rtnDni,
    String? telefono,
    String? email,
  }) async {
    try {
      final response = await _client.dio.post(
        ApiConstants.customers,
        data: {
          'nombre': nombre,
          'rtn_dni': rtnDni,
          'telefono': telefono,
          'email': email,
        },
      );

      if (response.data['success'] == true && response.data['data'] != null) {
        final newCustomer = CustomerModel.fromJson(response.data['data']);
        _customers.insert(0, newCustomer);
        notifyListeners();
        return newCustomer;
      }
    } catch (_) {}
    return null;
  }
}

