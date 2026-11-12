import 'package:flutter_test/flutter_test.dart';
import 'package:it_management_system/main.dart';

void main() {
  testWidgets('App loads test', (WidgetTester tester) async {
    await tester.pumpWidget(const ITManagementApp());
    expect(find.byType(ITManagementApp), findsOneWidget);
  });
}
