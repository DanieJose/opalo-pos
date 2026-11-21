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
  final customUrlCtrl = TextEditingController(text: ApiConstants.baseUrl);

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: SingleChildScrollView(
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
                              ? 'Cualquier cambio en la Web se sincroniza de inmediato con esta App Móvil y viceversa.'
                              : 'Conectando con el servidor seleccionado...',
                          style: const TextStyle(fontSize: 11, color: AppColors.slateGray),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),

              // Servidor actual
              const Text(
                'Servidor Activo:',
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
              const SizedBox(height: 14),

              const Text(
                'Selecciona el Servidor para Sincronizar:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.slateDark),
              ),
              const SizedBox(height: 8),

              // Opción 1: Producción Railway
              _buildServerOption(
                ctx: ctx,
                title: '☁️ Producción (Cloud Railway)',
                subtitle: 'Sincroniza con: https://opalo-frontend-production.up.railway.app',
                url: ApiConstants.productionBaseUrl,
                isSelected: ApiConstants.baseUrl == ApiConstants.productionBaseUrl,
              ),

              // Opción 2: Wi-Fi PC (Ideal para Celular Físico)
              _buildServerOption(
                ctx: ctx,
                title: '📶 Wi-Fi PC Local (192.168.1.5)',
                subtitle: 'Para celular físico conectado al mismo Wi-Fi de tu PC (localhost:3000)',
                url: ApiConstants.localWifiBaseUrl,
                isSelected: ApiConstants.baseUrl == ApiConstants.localWifiBaseUrl,
              ),

              // Opción 3: Emulador Android
              _buildServerOption(
                ctx: ctx,
                title: '📱 Emulador Android (10.0.2.2)',
                subtitle: 'Para emuladores Android Studio en esta misma PC',
                url: ApiConstants.localAndroidBaseUrl,
                isSelected: ApiConstants.baseUrl == ApiConstants.localAndroidBaseUrl,
              ),

              // Opción 4: Localhost Windows
              _buildServerOption(
                ctx: ctx,
                title: '🖥️ Localhost (Windows / Desktop)',
                subtitle: 'Para ejecución directa en Windows',
                url: ApiConstants.localBaseUrl,
                isSelected: ApiConstants.baseUrl == ApiConstants.localBaseUrl,
              ),

              const SizedBox(height: 10),

              // Entrada URL personalizada
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: customUrlCtrl,
                      decoration: InputDecoration(
                        isDense: true,
                        hintText: 'http://TU-IP:4000/api/v1',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      style: const TextStyle(fontSize: 11),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () {
                      final newUrl = customUrlCtrl.text.trim();
                      if (newUrl.isNotEmpty) {
                        _applyServerChange(ctx, newUrl);
                      }
                    },
                    child: const Text('Aplicar', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Botón Reconectar / Refrescar
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.emerald,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Reconectar y Actualizar Catálogo', style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: () {
                    socket.reconnect();
                    Provider.of<ProductProvider>(ctx, listen: false).loadProducts();
                    Provider.of<ProductProvider>(ctx, listen: false).loadCategories();
                    Provider.of<CustomerProvider>(ctx, listen: false).loadCustomers();
                    Navigator.pop(ctx);
                  },
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

Widget _buildServerOption({
  required BuildContext ctx,
  required String title,
  required String subtitle,
  required String url,
  required bool isSelected,
}) {
  return Container(
    margin: const EdgeInsets.only(bottom: 6),
    child: InkWell(
      onTap: () => _applyServerChange(ctx, url),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFDF2F8) : AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade300,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
              color: isSelected ? AppColors.primary : Colors.grey,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? AppColors.primaryDark : AppColors.slateDark,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 9, color: Colors.grey.shade600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

void _applyServerChange(BuildContext ctx, String url) {
  ApiClient().updateBaseUrl(url);
  final prodProv = Provider.of<ProductProvider>(ctx, listen: false);
  final custProv = Provider.of<CustomerProvider>(ctx, listen: false);
  prodProv.loadCategories();
  prodProv.loadProducts();
  custProv.loadCustomers();

  Navigator.pop(ctx);
  ScaffoldMessenger.of(ctx).showSnackBar(
    SnackBar(content: Text('Servidor POS cambiado a: $url')),
  );
}
