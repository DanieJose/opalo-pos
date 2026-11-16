import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../core/utils/formatters.dart';
import '../models/sale_model.dart';

class ReceiptScreen extends StatelessWidget {
  final SaleReceiptModel receipt;

  const ReceiptScreen({super.key, required this.receipt});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Recibo de Venta', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.slateDark,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Icono éxito
                        const CircleAvatar(
                          radius: 30,
                          backgroundColor: Color(0xFFECFDF5),
                          child: Icon(Icons.check_circle, color: AppColors.emerald, size: 36),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          '¡Venta Procesada Exitosamente!',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.slateDark),
                        ),
                        const Text(
                          'ÓPALO ACCESORIOS • TOCOA, COLÓN',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slateGray),
                        ),
                        const SizedBox(height: 16),
                        const Divider(),

                        // Factura y fecha
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Factura:', style: TextStyle(fontSize: 12, color: AppColors.slateGray)),
                            Text(receipt.numeroFactura, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Método de Pago:', style: TextStyle(fontSize: 12, color: AppColors.slateGray)),
                            Text(
                              '${receipt.metodoPago} ${receipt.bancoTransferencia != null ? "(${receipt.bancoTransferencia})" : ""}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Divider(),

                        // Detalle de Ítems
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text('Artículos:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                        const SizedBox(height: 8),
                        ...receipt.items.map((item) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${item.cantidad}x ${item.nombre}',
                                      style: const TextStyle(fontSize: 12),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Text(
                                    Formatters.currency(item.subtotal),
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            )),

                        const SizedBox(height: 16),
                        const Divider(),

                        // Totales con ISV 15%
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Subtotal:', style: TextStyle(fontSize: 12, color: AppColors.slateGray)),
                            Text(Formatters.currency(receipt.subtotal), style: const TextStyle(fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('ISV (15%):', style: TextStyle(fontSize: 12, color: AppColors.slateGray)),
                            Text(Formatters.currency(receipt.isv15), style: const TextStyle(fontSize: 12)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('TOTAL:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                            Text(
                              Formatters.currency(receipt.total),
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.primary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Cambio Entregado:', style: TextStyle(fontSize: 12, color: AppColors.slateGray)),
                            Text(Formatters.currency(receipt.cambio), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ],
                        ),

                        if (receipt.puntosGanados > 0) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text('💎 ', style: TextStyle(fontSize: 16)),
                                Text(
                                  '¡La clienta acumuló ${receipt.puntosGanados} puntos de lealtad!',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryDark,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.add_shopping_cart, color: Colors.white),
                  label: const Text(
                    'Nueva Venta en POS',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

