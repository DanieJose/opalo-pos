import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../core/utils/formatters.dart';
import '../providers/cart_provider.dart';
import 'receipt_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _metodoPago = 'EFECTIVO';
  String _banco = 'BAC Credomatic';
  final _montoRecibidoController = TextEditingController();

  final List<String> _bancosHonduras = [
    'BAC Credomatic',
    'Banco Atlántida',
    'Banco Ficohsa',
    'Banrural Honduras',
    'Banco de Occidente',
  ];

  @override
  void initState() {
    super.initState();
    final cart = Provider.of<CartProvider>(context, listen: false);
    _montoRecibidoController.text = cart.total.toStringAsFixed(2);
  }

  @override
  void dispose() {
    _montoRecibidoController.dispose();
    super.dispose();
  }

  double get _cambio {
    final cart = Provider.of<CartProvider>(context, listen: false);
    final recibido = double.tryParse(_montoRecibidoController.text) ?? cart.total;
    return (recibido >= cart.total) ? (recibido - cart.total) : 0.0;
  }

  Future<void> _processCheckout() async {
    final cart = Provider.of<CartProvider>(context, listen: false);
    final recibido = double.tryParse(_montoRecibidoController.text) ?? cart.total;

    if (_metodoPago == 'EFECTIVO' && recibido < cart.total) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('El monto recibido no puede ser menor al total')),
      );
      return;
    }

    final receipt = await cart.checkout(
      metodoPago: _metodoPago,
      bancoTransferencia: _metodoPago == 'TRANSFERENCIA' ? _banco : null,
      montoRecibido: _metodoPago == 'EFECTIVO' ? recibido : cart.total,
    );

    if (!mounted) return;

    if (receipt != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => ReceiptScreen(receipt: receipt)),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error al procesar la venta en caja. Verifica inventario.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Cobro en Caja (POS)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.slateDark,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tarjeta Resumen Total
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.slateDark, Color(0xFF1E293B)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    const Text('TOTAL A COBRAR', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70)),
                    const SizedBox(height: 4),
                    Text(
                      Formatters.currency(cart.total),
                      style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Subtotal: ${Formatters.currency(cart.subtotal)}  •  ISV (15%): ${Formatters.currency(cart.isv15)}',
                      style: const TextStyle(fontSize: 11, color: Colors.white60),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Métodos de Pago
              const Text('Método de Pago', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 10),
              Row(
                children: [
                  _paymentButton('EFECTIVO', '💵 Efectivo', Icons.money),
                  const SizedBox(width: 8),
                  _paymentButton('TARJETA', '💳 Tarjeta', Icons.credit_card),
                  const SizedBox(width: 8),
                  _paymentButton('TRANSFERENCIA', '🏦 Transf.', Icons.account_balance),
                ],
              ),
              const SizedBox(height: 20),

              // Opciones según método
              if (_metodoPago == 'EFECTIVO') ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Monto Recibido en Efectivo', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _montoRecibidoController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        onChanged: (_) => setState(() {}),
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          prefixText: 'L. ',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          filled: true,
                          fillColor: AppColors.surface,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Billetes de Honduras
                      Wrap(
                        spacing: 8,
                        children: [100, 200, 500, 1000].map((bill) {
                          return ActionChip(
                            label: Text('L. $bill', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                            backgroundColor: AppColors.surface,
                            onPressed: () {
                              setState(() {
                                _montoRecibidoController.text = bill.toDouble().toStringAsFixed(2);
                              });
                            },
                          );
                        }).toList()
                          ..add(
                            ActionChip(
                              label: const Text('Exacto', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.emerald)),
                              backgroundColor: const Color(0xFFECFDF5),
                              onPressed: () {
                                setState(() {
                                  _montoRecibidoController.text = cart.total.toStringAsFixed(2);
                                });
                              },
                            ),
                          ),
                      ),
                      const SizedBox(height: 16),
                      const Divider(),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Cambio a Devolver:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          Text(
                            Formatters.currency(_cambio),
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.emerald),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ] else if (_metodoPago == 'TRANSFERENCIA') ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Banco de Honduras', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: _banco,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          filled: true,
                          fillColor: AppColors.surface,
                        ),
                        items: _bancosHonduras
                            .map((b) => DropdownMenuItem(value: b, child: Text(b, style: const TextStyle(fontSize: 13))))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _banco = val);
                        },
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 30),

              // Botón Finalizar Venta
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: cart.isSubmitting ? null : _processCheckout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.emerald,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: cart.isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(
                          'Confirmar Cobro de ${Formatters.currency(cart.total)}',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _paymentButton(String key, String title, IconData icon) {
    final isSelected = _metodoPago == key;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _metodoPago = key),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppColors.primary : Colors.grey.shade300,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? Colors.white : AppColors.slateDark, size: 20),
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : AppColors.slateDark,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

