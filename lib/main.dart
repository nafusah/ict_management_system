import 'package:flutter/material.dart';
import 'core/routes/app_router.dart';
import 'core/theme/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ITManagementApp());
}

class ITManagementApp extends StatelessWidget {
  const ITManagementApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Kinetic Amber Enterprise IT',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: AppRouter.router,
      // ضبط اتجاه التطبيق بالكامل من اليمين لليسار (RTL)
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child!,
        );
      },
    );
  }
}
