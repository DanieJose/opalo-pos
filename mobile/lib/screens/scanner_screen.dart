import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../core/utils/formatters.dart';
import '../providers/cart_provider.dart';
import '../providers/product_provider.dart';
import '../providers/customer_provider.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _cameraController = MobileScannerController();
  bool _isProcessing = false;
  bool _scanProductMode = true; // true = Prenda (Barcode), false = Clienta (QR Lealtad)

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? code = barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() => _isProcessing = true);

    if (_scanProductMode) {
      // 1. Escaneo de Prenda / SKU / Código de barras
      final productProvider = Provider.of<ProductProvider>(context, listen: false);
      final variant = await productProvider.findVariantByBarcodeOrSku(code);

      if (!mounted) return;

      if (variant != null) {
        final cart = Provider.of<CartProvider>(context, listen: false);
        final added = cart.addItem(
          variant: variant,
          productName: 'Producto #${variant.productoId}',
        );

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: added ? AppColors.emerald : Colors.red,
            content: Text(
              added
                  ? 'Añadido: Talla ${variant.talla} / ${variant.color} (${Formatters.currency(variant.precioVenta)})'
                  : 'Sin stock disponible para esta variante',
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('No se encontró ninguna variante con código: $code'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    } else {
      // 2. Escaneo de QR de Lealtad de Clienta
      final customerProvider = Provider.of<CustomerProvider>(context, listen: false);
      final customer = await customerProvider.findCustomerByQR(code);

      if (!mounted) return;

      if (customer != null) {
        final cart = Provider.of<CartProvider>(context, listen: false);
        cart.setCustomer(customer);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.emerald,
            content: Text('Clienta asignada: ${customer.nombre} (💎 ${customer.puntosLealtad} pts)'),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Código QR no registrado: $code'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    }

    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Escáner de Tienda', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _cameraController.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => _cameraController.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _cameraController,
            onDetect: _onDetect,
          ),

          // Selector de Modo (Prenda vs Clienta)
          Positioned(
            top: 20,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _scanProductMode ? AppColors.primary : Colors.transparent,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () => setState(() => _scanProductMode = true),
                      child: const Text('👗 Prenda / Código', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: !_scanProductMode ? AppColors.accent : Colors.transparent,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () => setState(() => _scanProductMode = false),
                      child: const Text('💎 QR Clienta', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Mira visual de escaneo
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: _scanProductMode ? AppColors.primary : AppColors.accent,
                  width: 3,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),

          // Indicador inferior
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _scanProductMode
                    ? 'Apunta la cámara al código de barras o etiqueta de la prenda'
                    : 'Apunta al código QR de la tarjeta de lealtad de la clienta',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

