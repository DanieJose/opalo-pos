import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../core/network/socket_service.dart';
import '../providers/product_provider.dart';
import '../providers/customer_provider.dart';

class SyncStatusBadge extends StatelessWidget {
  const SyncStatusBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SocketService>(
      builder: (context, socket, child) {
        final isConnected = socket.isConnected;

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: InkWell(
            onTap: () => showSyncDetailsDialog(context),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: isConnected ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isConnected ? const Color(0xFFA7F3D0) : const Color(0xFFFECDD3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: isConnected ? AppColors.emerald : Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    isConnected ? 'En Vivo' : 'Reconectando',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isConnected ? AppColors.emerald : Colors.red,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

void showSyncDetailsDialog(BuildContext context) {
  final socket = Provider.of<SocketService>(context, listen: false);
  final isConnected = socket.isConnected;

  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isConnected ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    isConnected ? Icons.wifi_tethering : Icons.wifi_off,
                    color: isConnected ? AppColors.emerald : Colors.red,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isConnected ? 'Sincronización en Tiempo Real Activa' : 'Reconectando con Servidor...',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isConnected
                            ? 'Cualquier venta, cambio de stock o cliente en la Web se sincroniza de inmediato.'
                            : 'Verifica tu conexión a internet o el estado del backend.',
                        style: const TextStyle(fontSize: 11, color: AppColors.slateGray),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            const Divider(),
            const SizedBox(height: 10),

            // Servidor actual
            const Text(
              'Servidor POS Conectado:',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.slateDark),
            ),
            const SizedBox(height: 4),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Text(
                ApiConstants.baseUrl,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'monospace'),
              ),
            ),
            const SizedBox(height: 16),

            // Opciones de cambio rápido de servidor
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: BorderSide(
                        color: ApiConstants.baseUrl == ApiConstants.productionBaseUrl
                            ? AppColors.primary
                            : Colors.grey.shade300,
                      ),
                    ),
                    onPressed: () {
                      ApiClient().updateBaseUrl(ApiConstants.productionBaseUrl);
                      Provider.of<ProductProvider>(context, listen: false).loadProducts();
                      Provider.of<CustomerProvider>(context, listen: false).loadCustomers();
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Conectado a Producción (Railway)')),
                      );
                    },
                    child: const Text('☁️ Producción (Cloud)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: BorderSide(
                        color: ApiConstants.baseUrl != ApiConstants.productionBaseUrl
                            ? AppColors.primary
                            : Colors.grey.shade300,
                      ),
                    ),
                    onPressed: () {
                      ApiClient().updateBaseUrl(ApiConstants.localAndroidBaseUrl);
                      Provider.of<ProductProvider>(context, listen: false).loadProducts();
                      Provider.of<CustomerProvider>(context, listen: false).loadCustomers();
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Conectado a Localhost (10.0.2.2)')),
                      );
                    },
                    child: const Text('💻 Localhost Dev', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Botón Forzar Reconexión
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Reconectar y Sincronizar Ahora', style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: () {
                  socket.reconnect();
                  Provider.of<ProductProvider>(context, listen: false).loadProducts();
                  Provider.of<CustomerProvider>(context, listen: false).loadCustomers();
                  Navigator.pop(ctx);
                },
              ),
            ),
          ],
        ),
      );
    },
  );
}
