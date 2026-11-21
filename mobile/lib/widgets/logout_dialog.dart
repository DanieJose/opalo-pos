import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';

void showLogoutConfirmationDialog(BuildContext context) {
  final auth = Provider.of<AuthProvider>(context, listen: false);

  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.logout_rounded, color: Colors.red, size: 22),
          ),
          const SizedBox(width: 12),
          const Text(
            'Cerrar Sesión',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ],
      ),
      content: Text(
        '¿Deseas salir del sistema, ${auth.user?.nombre ?? "Usuario"}?\n\nTu turno y ventas registradas quedarán guardados de forma segura.',
        style: const TextStyle(fontSize: 13, color: AppColors.slateDark),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancelar', style: TextStyle(color: AppColors.slateGray)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red.shade600,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: () async {
            Navigator.pop(ctx);
            Provider.of<CartProvider>(context, listen: false).clear();
            await auth.logout();
          },
          child: const Text('Salir', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}
