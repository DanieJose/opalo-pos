import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../models/sale_model.dart';

class TicketPrinter {
  static Future<void> printReceipt(
    SaleReceiptModel receipt, {
    String? cajeroNombre,
    String? storeName,
    String? storeLocation,
    String? storeRtn,
  }) async {
    await Printing.layoutPdf(
      name: 'Ticket_${receipt.numeroFactura}',
      format: const PdfPageFormat(
        80 * PdfPageFormat.mm,
        double.infinity,
        marginAll: 4 * PdfPageFormat.mm,
      ),
      onLayout: (PdfPageFormat format) async {
        return buildReceiptPdf(
          receipt,
          format: format,
          cajeroNombre: cajeroNombre,
          storeName: storeName,
          storeLocation: storeLocation,
          storeRtn: storeRtn,
        );
      },
    );
  }

  static Future<void> shareReceipt(
    SaleReceiptModel receipt, {
    String? cajeroNombre,
    String? storeName,
    String? storeLocation,
    String? storeRtn,
  }) async {
    final pdfBytes = await buildReceiptPdf(
      receipt,
      format: const PdfPageFormat(
        80 * PdfPageFormat.mm,
        double.infinity,
        marginAll: 4 * PdfPageFormat.mm,
      ),
      cajeroNombre: cajeroNombre,
      storeName: storeName,
      storeLocation: storeLocation,
      storeRtn: storeRtn,
    );

    await Printing.sharePdf(
      bytes: pdfBytes,
      filename: 'Ticket_${receipt.numeroFactura}.pdf',
    );
  }

  static Future<Uint8List> buildReceiptPdf(
    SaleReceiptModel receipt, {
    required PdfPageFormat format,
    String? cajeroNombre,
    String? storeName,
    String? storeLocation,
    String? storeRtn,
  }) async {
    final doc = pw.Document();

    final String nombreEmpresa = storeName ?? 'ÓPALO ACCESORIOS S. DE R.L.';
    final String ubicacion = storeLocation ?? 'Tocoa, Colón • Honduras';
    final String rtn = storeRtn ?? '02091995001230';
    final String cajero = cajeroNombre ?? 'Turno Activo';

    doc.addPage(
      pw.Page(
        pageFormat: format,
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                // Encabezado
                pw.Text(
                  nombreEmpresa,
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 13),
                  textAlign: pw.TextAlign.center,
                ),
                pw.SizedBox(height: 2),
                pw.Text(
                  ubicacion,
                  style: const pw.TextStyle(fontSize: 8),
                  textAlign: pw.TextAlign.center,
                ),
                pw.Text(
                  'RTN: $rtn',
                  style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                ),
                pw.SizedBox(height: 3),
                pw.Text(
                  'FACTURA: ${receipt.numeroFactura}',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
                ),
                pw.Text(
                  receipt.fecha,
                  style: const pw.TextStyle(fontSize: 8),
                ),
                pw.SizedBox(height: 4),
                pw.Divider(borderStyle: pw.BorderStyle.dashed, thickness: 0.8),

                // Cajero y Cliente
                _buildPdfRow('Cajero:', cajero),
                _buildPdfRow('Cliente:', receipt.clienteNombre),
                if (receipt.clienteRtn != null && receipt.clienteRtn!.isNotEmpty)
                  _buildPdfRow('RTN Cliente:', receipt.clienteRtn!),
                _buildPdfRow(
                  'Método de Pago:',
                  '${receipt.metodoPago} ${receipt.bancoTransferencia != null ? "(${receipt.bancoTransferencia})" : ""}',
                ),

                if (receipt.metodoPago == 'MIXTO') ...[
                  pw.SizedBox(height: 2),
                  if (receipt.montoEfectivo > 0)
                    _buildPdfRow('  ↳ Efectivo:', 'L. ${receipt.montoEfectivo.toStringAsFixed(2)}'),
                  if (receipt.montoTarjeta > 0)
                    _buildPdfRow('  ↳ Tarjeta:', 'L. ${receipt.montoTarjeta.toStringAsFixed(2)}'),
                  if (receipt.montoTransferencia > 0)
                    _buildPdfRow('  ↳ Transferencia:', 'L. ${receipt.montoTransferencia.toStringAsFixed(2)}'),
                ],

                pw.SizedBox(height: 4),
                pw.Divider(borderStyle: pw.BorderStyle.dashed, thickness: 0.8),

                // Lista de Artículos
                pw.Align(
                  alignment: pw.Alignment.centerLeft,
                  child: pw.Text(
                    'ARTÍCULOS:',
                    style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                  ),
                ),
                pw.SizedBox(height: 3),

                ...receipt.items.map((it) {
                  return pw.Padding(
                    padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Expanded(
                              child: pw.Text(
                                '${it.cantidad}x ${it.nombre}',
                                style: const pw.TextStyle(fontSize: 8),
                              ),
                            ),
                            pw.Text(
                              'L. ${(it.precioUnitario * it.cantidad).toStringAsFixed(2)}',
                              style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                            ),
                          ],
                        ),
                        if (it.descuento > 0)
                          pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text('  ↳ Rebaja/Descuento:', style: const pw.TextStyle(fontSize: 7)),
                              pw.Text('- L. ${it.descuento.toStringAsFixed(2)}', style: const pw.TextStyle(fontSize: 7)),
                            ],
                          ),
                      ],
                    ),
                  );
                }),

                pw.SizedBox(height: 4),
                pw.Divider(borderStyle: pw.BorderStyle.dashed, thickness: 0.8),

                // Desglose SAR Honduras (coincide con la Web)
                _buildPdfRow('Subtotal Gravable (15%):', 'L. ${receipt.subtotal.toStringAsFixed(2)}'),
                _buildPdfRow('ISV (15%):', 'L. ${receipt.isv15.toStringAsFixed(2)}'),
                _buildPdfRow('Subtotal Gravable (18%):', 'L. 0.00'),
                _buildPdfRow('ISV (18%):', 'L. 0.00'),
                if (receipt.totalDescuento > 0)
                  _buildPdfRow('Descuentos Otorgados:', '- L. ${receipt.totalDescuento.toStringAsFixed(2)}'),

                pw.SizedBox(height: 3),
                pw.Divider(thickness: 1),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('TOTAL A PAGAR:', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                    pw.Text('L. ${receipt.total.toStringAsFixed(2)}', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                  ],
                ),
                pw.Divider(thickness: 1),

                if (receipt.metodoPago == 'EFECTIVO' || receipt.montoRecibido > 0) ...[
                  _buildPdfRow('Recibido:', 'L. ${receipt.montoRecibido.toStringAsFixed(2)}'),
                  _buildPdfRow('Cambio Entregado:', 'L. ${receipt.cambio.toStringAsFixed(2)}'),
                ],

                if (receipt.puntosGanados > 0) ...[
                  pw.SizedBox(height: 6),
                  pw.Container(
                    padding: const pw.EdgeInsets.all(3),
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(width: 0.5),
                    ),
                    child: pw.Text(
                      '💎 ¡Has ganado ${receipt.puntosGanados} puntos de lealtad!',
                      style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
                      textAlign: pw.TextAlign.center,
                    ),
                  ),
                ],

                pw.SizedBox(height: 8),
                pw.Text(
                  '¡Gracias por tu compra en Ópalo Accesorios!',
                  style: const pw.TextStyle(fontSize: 7),
                  textAlign: pw.TextAlign.center,
                ),
                pw.Text(
                  'No se aceptan devoluciones sin este recibo.',
                  style: const pw.TextStyle(fontSize: 6),
                  textAlign: pw.TextAlign.center,
                ),
              ],
            ),
          );
        },
      ),
    );

    return doc.save();
  }

  static pw.Widget _buildPdfRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 0.8),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: const pw.TextStyle(fontSize: 8)),
          pw.Text(value, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }
}
