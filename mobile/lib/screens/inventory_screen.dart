import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/api_constants.dart';
import '../providers/product_provider.dart';
import '../widgets/sync_status_badge.dart';
import '../widgets/logout_dialog.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final p = Provider.of<ProductProvider>(context, listen: false);
      p.loadProducts();
      p.loadLowStockAlerts();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Inventario y Stock', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.slateDark,
        elevation: 0,
        actions: [
          const SyncStatusBadge(),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              productProvider.loadProducts();
              productProvider.loadLowStockAlerts();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 21),
            tooltip: 'Salir / Cerrar Sesión',
            onPressed: () => showLogoutConfirmationDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Alerta de Stock Crítico si existen
          if (productProvider.lowStockAlerts.isNotEmpty)
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFECDD3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.primary, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Variantes con Stock Crítico',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryDark),
                        ),
                        Text(
                          'Hay ${productProvider.lowStockAlerts.length} variantes en o por debajo de su stock mínimo.',
                          style: const TextStyle(fontSize: 11, color: AppColors.slateGray),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          // Buscador
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Buscar en inventario...',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
              ),
              onSubmitted: (q) => productProvider.loadProducts(search: q),
            ),
          ),
          const SizedBox(height: 8),

          // Lista de Productos y sus Variantes
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: productProvider.products.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final product = productProvider.products[index];

                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Miniatura de Imagen
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 44,
                              height: 44,
                              color: Colors.grey.shade100,
                              child: product.imagenUrl != null && product.imagenUrl!.isNotEmpty
                                  ? Image.network(
                                      ApiConstants.formatImageUrl(product.imagenUrl),
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) => const Center(
                                        child: Icon(Icons.checkroom, color: AppColors.primary, size: 22),
                                      ),
                                    )
                                  : Center(
                                      child: Text(
                                        product.nombre.isNotEmpty ? product.nombre[0].toUpperCase() : '👗',
                                        style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary),
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product.nombre,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  product.categoriaNombre,
                                  style: const TextStyle(fontSize: 11, color: AppColors.slateGray),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: product.totalStock > 0 ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${product.totalStock} total',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: product.totalStock > 0 ? AppColors.emerald : Colors.red,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Desglose de Variantes (Talla y Color)
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: product.variantes.map((v) {
                          final bool isCritical = v.stock <= v.stockMinimo;

                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isCritical ? const Color(0xFFFEF2F2) : AppColors.surface,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isCritical ? const Color(0xFFFECDD3) : Colors.grey.shade300,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '${v.talla} (${v.color}): ',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: isCritical ? AppColors.primaryDark : AppColors.slateDark,
                                  ),
                                ),
                                Text(
                                  '${v.stock} disp.',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                    color: isCritical ? Colors.red : AppColors.emerald,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

