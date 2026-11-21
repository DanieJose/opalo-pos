import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../providers/customer_provider.dart';
import '../widgets/sync_status_badge.dart';
import '../widgets/logout_dialog.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CustomerProvider>(context, listen: false).loadCustomers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showAddCustomerDialog() {
    final nombreCtrl = TextEditingController();
    final dniCtrl = TextEditingController();
    final telCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Registrar Clienta', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nombreCtrl,
              decoration: const InputDecoration(labelText: 'Nombre Completo *'),
            ),
            TextField(
              controller: dniCtrl,
              decoration: const InputDecoration(labelText: 'DNI o RTN'),
            ),
            TextField(
              controller: telCtrl,
              decoration: const InputDecoration(labelText: 'Teléfono (WhatsApp)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () async {
              if (nombreCtrl.text.trim().isEmpty) return;
              final p = Provider.of<CustomerProvider>(context, listen: false);
              final created = await p.createCustomer(
                nombre: nombreCtrl.text.trim(),
                rtnDni: dniCtrl.text.trim(),
                telefono: telCtrl.text.trim(),
              );
              if (ctx.mounted) Navigator.pop(ctx);
              if (created != null && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Clienta ${created.nombre} registrada con QR: ${created.codigoQrLealtad}')),
                );
              }
            },
            child: const Text('Guardar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final customerProvider = Provider.of<CustomerProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Clientas y Lealtad', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.slateDark,
        elevation: 0,
        actions: [
          const SyncStatusBadge(),
          IconButton(
            icon: const Icon(Icons.person_add, color: AppColors.primary),
            onPressed: _showAddCustomerDialog,
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
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Buscar clienta por nombre, DNI o QR...',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
              ),
              onSubmitted: (q) => customerProvider.loadCustomers(search: q),
            ),
          ),

          Expanded(
            child: customerProvider.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : customerProvider.customers.isEmpty
                    ? const Center(child: Text('No hay clientas registradas', style: TextStyle(color: AppColors.slateGray)))
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: customerProvider.customers.length,
                        separatorBuilder: (_, index) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final c = customerProvider.customers[index];
                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.primaryLight,
                                  child: Text(
                                    c.nombre.isNotEmpty ? c.nombre[0].toUpperCase() : 'C',
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        c.nombre,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                      if (c.rtnDni != null && c.rtnDni!.isNotEmpty)
                                        Text(
                                          'RTN: ${c.rtnDni}',
                                          style: const TextStyle(fontSize: 11, color: AppColors.slateGray),
                                        ),
                                      Text(
                                        'QR: ${c.codigoQrLealtad ?? "N/A"}',
                                        style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: AppColors.slateGray),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryLight,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      const Text('💎 ', style: TextStyle(fontSize: 12)),
                                      Text(
                                        '${c.puntosLealtad} pts',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 12,
                                          color: AppColors.primaryDark,
                                        ),
                                      ),
                                    ],
                                  ),
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

