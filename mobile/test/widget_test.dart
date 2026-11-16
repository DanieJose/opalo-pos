import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_pos/main.dart';

void main() {
  testWidgets('Smoke test for OpaloPosApp', (WidgetTester tester) async {
    await tester.pumpWidget(const OpaloPosApp());
    expect(find.byType(OpaloPosApp), findsOneWidget);
  });
}
