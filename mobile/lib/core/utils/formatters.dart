import 'package:intl/intl.dart';

class Formatters {
  static String currency(dynamic amount) {
    if (amount == null) return 'L. 0.00';
    final double value = amount is num ? amount.toDouble() : double.tryParse(amount.toString()) ?? 0.0;
    final formatter = NumberFormat.currency(locale: 'es_HN', symbol: 'L. ', decimalDigits: 2);
    return formatter.format(value);
  }

  static String date(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final dateTime = DateTime.parse(dateStr).toLocal();
      return DateFormat('dd/MM/yyyy hh:mm a').format(dateTime);
    } catch (_) {
      return dateStr;
    }
  }
}

