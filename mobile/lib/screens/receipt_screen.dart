import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../core/utils/formatters.dart';
import '../core/utils/ticket_printer.dart';
import '../models/sale_model.dart';
import '../providers/auth_provider.dart';

class ReceiptScreen extends StatelessWidget {
  final SaleReceiptModel receipt;

  const ReceiptScreen({super.key, required this.receipt});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final String cajeroNombre = auth.user?.nombre ?? 'Turno Activo';

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Comprobante de Venta', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.slateDark,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: AppColors.slateDark),
            tooltip: 'Compartir Ticket en PDF',
            onPressed: () => TicketPrinter.shareReceipt(
              receipt,
              cajeroNombre: cajeroNombre,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Encabezado Ticket Térmico
                        const Text(
                          'ÓPALO ACCESORIOS S. DE R.L.',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.slateDark),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Tocoa, Colón • Honduras',
                          style: TextStyle(fontSize: 11, color: AppColors.slateGray),
                          textAlign: TextAlign.center,
                        ),
                        const Text(
                          'RTN: 02091995001230',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slateDark),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'FACTURA: ${receipt.numeroFactura}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primary),
                        ),
                        Text(
                          receipt.fecha,
                          style: const TextStyle(fontSize: 10, color: AppColors.slateGray),
                        ),
                        const SizedBox(height: 10),
                        const Divider(thickness: 1),

                        // Datos de Cajero y Cliente
                        _buildRow('Cajero:', cajeroNombre),
                        _buildRow('Cliente:', receipt.clienteNombre),
                        if (receipt.clienteRtn != null && receipt.clienteRtn!.isNotEmpty)
                          _buildRow('RTN Cliente:', receipt.clienteRtn!),
                        _buildRow(
                          'Método de Pago:',
                          '${receipt.metodoPago} ${receipt.bancoTransferencia != null ? "(${receipt.bancoTransferencia})" : ""}',
                        ),

                        if (receipt.metodoPago == 'MIXTO') ...[
                          const SizedBox(height: 2),
                          if (receipt.montoEfectivo > 0)
                            _buildRow('  ↳ Efectivo:', Formatters.currency(receipt.montoEfectivo)),
                          if (receipt.montoTarjeta > 0)
                            _buildRow('  ↳ Tarjeta:', Formatters.currency(receipt.montoTarjeta)),
                          if (receipt.montoTransferencia > 0)
                            _buildRow('  ↳ Transferencia:', Formatters.currency(receipt.montoTransferencia)),
                        ],

                        const SizedBox(height: 8),
                        const Divider(thickness: 1),

                        // Desglose de Artículos
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'ARTÍCULOS VENDIDOS:',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.slateDark),
                          ),
                        ),
                        const SizedBox(height: 6),

                        ...receipt.items.map((item) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
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
                                      Formatters.currency(item.precioUnitario * item.cantidad),
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                if (item.descuento > 0)
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text(
                                        '  ↳ Descuento aplicado:',
                                        style: TextStyle(fontSize: 10, color: Colors.green),
                                      ),
                                      Text(
                                        '- ${Formatters.currency(item.descuento)}',
                                        style: const TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                              ],
                            ),
                          );
                        }),

                        const SizedBox(height: 8),
                        const Divider(thickness: 1),

                        // Desglose Fiscal Oficial SAR (coincide con la Web)
                        _buildRow('Subtotal Gravable (15%):', Formatters.currency(receipt.subtotal)),
                        _buildRow('ISV (15%):', Formatters.currency(receipt.isv15)),
                        _buildRow('Subtotal Gravable (18%):', 'L. 0.00'),
                        _buildRow('ISV (18%):', 'L. 0.00'),
                        if (receipt.totalDescuento > 0)
                          _buildRow('Descuentos y Rebajas:', '- ${Formatters.currency(receipt.totalDescuento)}'),

                        const SizedBox(height: 4),
                        const Divider(thickness: 1.5),

                        // TOTAL
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('TOTAL A PAGAR:', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
                            Text(
                              Formatters.currency(receipt.total),
                              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppColors.primary),
                            ),
                          ],
                        ),
                        const Divider(thickness: 1.5),

                        if (receipt.metodoPago == 'EFECTIVO' || receipt.montoRecibido > 0) ...[
                          _buildRow('Monto Recibido:', Formatters.currency(receipt.montoRecibido)),
                          _buildRow('Cambio Entregado:', Formatters.currency(receipt.cambio)),
                        ],

                        // Puntos de Lealtad
                        if (receipt.puntosGanados > 0) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFDF2F8),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text('💎 ', style: TextStyle(fontSize: 14)),
                                Text(
                                  '¡La clienta acumuló ${receipt.puntosGanados} puntos de lealtad!',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 12),
                        const Text(
                          '¡Gracias por tu compra en Ópalo Accesorios!\nNo se aceptan devoluciones sin este recibo.',
                          style: TextStyle(fontSize: 10, color: AppColors.slateGray),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Botones de Acción
              Row(
                children: [
                  // Botón Imprimir Ticket
                  Expanded(
                    child: SizedBox(
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: () => TicketPrinter.printReceipt(
                          receipt,
                          cajeroNombre: cajeroNombre,
                        ),
                        icon: const Icon(Icons.print, color: Colors.white, size: 20),
                        label: const Text(
                          'Imprimir Ticket',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.slateDark,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Botón Compartir
                  SizedBox(
                    height: 50,
                    width: 50,
                    child: OutlinedButton(
                      onPressed: () => TicketPrinter.shareReceipt(
                        receipt,
                        cajeroNombre: cajeroNombre,
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        side: const BorderSide(color: AppColors.slateDark),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Icon(Icons.share, color: AppColors.slateDark, size: 20),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Botón Nueva Venta
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.add_shopping_cart, color: Colors.white, size: 18),
                  label: const Text(
                    'Nueva Venta en POS',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.emerald,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.slateGray)),
          Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slateDark)),
        ],
      ),
    );
  }
}
