import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io_client;
import '../constants/api_constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;

  io_client.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  final Map<String, List<Function(dynamic)>> _listeners = {};

  SocketService._internal();

  void init({String? customUrl}) {
    final rawUrl = customUrl ?? ApiConstants.baseUrl;
    final serverUrl = rawUrl.replaceAll(RegExp(r'/api/v1/?$'), '');

    if (_socket != null) {
      _socket?.dispose();
    }

    try {
      _socket = io_client.io(
        serverUrl,
        io_client.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .build(),
      );

      _socket?.onConnect((_) {
        _isConnected = true;
        debugPrint('[Mobile WebSocket] Conectado en tiempo real al servidor POS: ${_socket?.id}');
      });

      _socket?.onDisconnect((_) {
        _isConnected = false;
        debugPrint('[Mobile WebSocket] Desconectado del servidor POS');
      });

      // Registrar los eventos principales
      const events = [
        'pos:sale_created',
        'pos:sale_cancelled',
        'pos:stock_updated',
        'pos:product_created',
        'pos:customer_created'
      ];

      for (final event in events) {
        _socket?.on(event, (data) {
          debugPrint('[Mobile WebSocket] Evento recibido "$event": $data');
          if (_listeners.containsKey(event)) {
            for (final callback in _listeners[event]!) {
              callback(data);
            }
          }
        });
      }
    } catch (e) {
      debugPrint('[Mobile WebSocket Error] No se pudo inicializar socket: $e');
    }
  }

  void on(String event, Function(dynamic) callback) {
    _listeners.putIfAbsent(event, () => []).add(callback);
  }

  void off(String event) {
    _listeners.remove(event);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }
}
