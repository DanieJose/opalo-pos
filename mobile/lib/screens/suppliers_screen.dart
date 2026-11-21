import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/supplier_model.dart';
import '../widgets/logout_dialog.dart';

class SuppliersScreen extends StatefulWidget {
  const SuppliersScreen({super.key});

  @override
  State<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends State<SuppliersScreen> {
  List<SupplierModel> _suppliers = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchSuppliers();
  }

  Future<void> _fetchSuppliers() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiClient().dio.get(
        ApiConstants.suppliers,
        queryParameters: _searchQuery.isNotEmpty ? {'search': _searchQuery} : null,
      );

      if (response.data['success'] == true) {
        final List list = response.data['data'] ?? [];
        setState(() {
          _suppliers = list.map((item) => SupplierModel.fromJson(item)).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar proveedores: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copiado al portapapeles: $text'),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text(
          'Proveedores y Suplidores',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchSuppliers,
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
          // Barra de búsqueda
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar por empresa, contacto, RTN o ciudad...',
                hintStyle: const TextStyle(fontSize: 12, color: AppColors.slateGray),
                prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.slateGray),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                isDense: true,
              ),
              style: const TextStyle(fontSize: 13),
              onChanged: (val) {
                _searchQuery = val;
                _fetchSuppliers();
              },
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _suppliers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.factory_outlined, size: 48, color: AppColors.slateGray),
                            const SizedBox(height: 12),
                            const Text(
                              'No se encontraron proveedores',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slateDark),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _searchQuery.isNotEmpty ? 'Prueba con otro término de búsqueda' : 'Registra proveedores desde el panel web',
                              style: const TextStyle(fontSize: 12, color: AppColors.slateGray),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchSuppliers,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _suppliers.length,
                          itemBuilder: (context, index) {
                            final sup = _suppliers[index];
                            return _buildSupplierCard(sup);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSupplierCard(SupplierModel sup) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Encabezado de Empresa y Estado
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, Color(0xFFFB7185)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    sup.nombreEmpresa.isNotEmpty ? sup.nombreEmpresa[0].toUpperCase() : 'P',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sup.nombreEmpresa,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.slateDark),
                    ),
                    if (sup.categoriaSuministro != null)
                      Text(
                        sup.categoriaSuministro!,
                        style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: sup.isActivo ? const Color(0xFFECFDF5) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: sup.isActivo ? const Color(0xFFA7F3D0) : const Color(0xFFCBD5E1)),
                ),
                child: Text(
                  sup.estado,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: sup.isActivo ? const Color(0xFF065F46) : AppColors.slateGray,
                  ),
                ),
              ),
            ],
          ),

          const Divider(height: 20, color: Color(0xFFF1F5F9)),

          // Detalles de Contacto
          Row(
            children: [
              const Icon(Icons.person_outline, size: 14, color: AppColors.slateGray),
              const SizedBox(width: 6),
              Text(
                sup.contactoNombre ?? 'Sin contacto registrado',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slateDark),
              ),
              const Spacer(),
              const Icon(Icons.location_on_outlined, size: 14, color: AppColors.slateGray),
              const SizedBox(width: 4),
              Text(
                sup.ciudad,
                style: const TextStyle(fontSize: 11, color: AppColors.slateGray),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Teléfono y RTN
          Row(
            children: [
              const Icon(Icons.phone_outlined, size: 14, color: AppColors.slateGray),
              const SizedBox(width: 6),
              Text(
                sup.telefono,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slateDark),
              ),
              const Spacer(),
              if (sup.rtn != null && sup.rtn!.isNotEmpty) ...[
                const Text('RTN: ', style: TextStyle(fontSize: 10, color: AppColors.slateGray)),
                Text(
                  sup.rtn!,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.slateDark),
                ),
              ],
            ],
          ),

          // Datos Bancarios si existen
          if (sup.banco != null || sup.cuentaBancaria != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.account_balance_outlined, size: 14, color: Color(0xFF1D4ED8)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${sup.banco ?? "Banco"}: ${sup.cuentaBancaria ?? ""}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF1E40AF)),
                    ),
                  ),
                  if (sup.cuentaBancaria != null)
                    InkWell(
                      onTap: () => _copyToClipboard(sup.cuentaBancaria!, 'Número de cuenta'),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 4),
                        child: Icon(Icons.copy_rounded, size: 14, color: Color(0xFF1D4ED8)),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

