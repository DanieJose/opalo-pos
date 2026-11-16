import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _client = ApiClient();
  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _client.dio.post(
        ApiConstants.login,
        data: {'email': email.trim(), 'password': password},
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        _token = data['token'];
        _user = UserModel.fromJson(data['user']);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('opalo_jwt_token', _token!);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.data['message'] ?? 'Error de autenticación';
      }
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        _errorMessage = e.response?.data['message'] ?? 'Credenciales inválidas';
      } else {
        _errorMessage = 'No se pudo conectar con el servidor de Ópalo';
      }
    } catch (e) {
      _errorMessage = 'Error inesperado: $e';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('opalo_jwt_token');

    if (savedToken == null || savedToken.isEmpty) return;
    _token = savedToken;

    try {
      final response = await _client.dio.get(ApiConstants.profile);
      if (response.data['success'] == true) {
        _user = UserModel.fromJson(response.data['data']);
        notifyListeners();
      } else {
        await logout();
      }
    } catch (_) {
      await logout();
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('opalo_jwt_token');
    notifyListeners();
  }
}

