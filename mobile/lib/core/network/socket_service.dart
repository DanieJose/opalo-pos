import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io_client;
import '../constants/api_constants.dart';

class SocketService extends ChangeNotifier {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;

  io_client.Socket? _socket;
  bool _isConnected = false;
  String _currentServerUrl = '';

  bool get isConnected => _isConnected;
  String get currentServerUrl => _currentServerUrl;

  final Map<String, List<Function(dynamic)>> _listeners = {};

  SocketService._internal();

  void init({String? customUrl}) {
    final rawUrl = customUrl ?? ApiConstants.baseUrl;
    final serverUrl = rawUrl.replaceAll(RegExp(r'/api/v1/?$'), '');
    _currentServerUrl = serverUrl;

    if (_socket != null) {
      _socket?.dispose();
    }

    try {
      debugPrint('[Mobile WebSocket] Intentando conectar a: $serverUrl');
      _socket = io_client.io(
        serverUrl,
        io_client.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionAttempts(9999)
            .build(),
      );

      _socket?.onConnect((_) {
        _isConnected = true;
        debugPrint('[Mobile WebSocket] Conectado en tiempo real al servidor POS: ${_socket?.id}');
        notifyListeners();
      });

      _socket?.onDisconnect((_) {
        _isConnected = false;
        debugPrint('[Mobile WebSocket] Desconectado del servidor POS');
        notifyListeners();
      });

      _socket?.onConnectError((err) {
        debugPrint('[Mobile WebSocket] Error de conexión: $err');
      });

      // Eventos principales del ecosistema Ópalo POS
      const events = [
        'pos:sale_created',
        'pos:sale_cancelled',
        'pos:stock_updated',
        'pos:product_created',
        'pos:customer_created',
        'pos:customer_updated',
        'pos:devolucion_created',
        'pos:caja_abierta',
        'pos:caja_cerrada',
        'pos:salida_caja'
      ];

      for (final event in events) {
        _socket?.on(event, (data) {
          debugPrint('[Mobile WebSocket] Evento recibido "$event": $data');
          _dispatch(event, data);
        });
      }
    } catch (e) {
      debugPrint('[Mobile WebSocket Error] No se pudo inicializar socket: $e');
    }
  }

  void _dispatch(String event, dynamic data) {
    if (_listeners.containsKey(event)) {
      for (final callback in List.from(_listeners[event]!)) {
        try {
          callback(data);
        } catch (e) {
          debugPrint('[Mobile WebSocket] Error en callback de "$event": $e');
        }
      }
    }
  }

  void on(String event, Function(dynamic) callback) {
    _listeners.putIfAbsent(event, () => []).add(callback);
    _socket?.on(event, (data) {
      _dispatch(event, data);
    });
  }

  void off(String event) {
    _listeners.remove(event);
    _socket?.off(event);
  }

  void reconnect() {
    _socket?.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    notifyListeners();
  }
}
