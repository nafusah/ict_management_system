import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../layout/main_layout.dart';
import '../../features/devices/presentation/screens/devices_screen.dart';
import '../../features/inks/presentation/screens/inks_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

/// تأثير انتقال ناعم وانسيابي (Fade Transition) مخصص للشاشات ولوحات التحكم
Page<dynamic> _buildSmoothPage({
  required LocalKey key,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: key,
    child: child,
    transitionDuration: const Duration(milliseconds: 200),
    reverseTransitionDuration: const Duration(milliseconds: 200),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: CurvedAnimation(
          parent: animation,
          curve: Curves.easeInOut,
        ),
        child: child,
      );
    },
  );
}

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    routes: [
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return MainLayout(child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            pageBuilder: (context, state) => _buildSmoothPage(
              key: state.pageKey,
              child: const DevicesScreen(),
            ),
          ),
          GoRoute(
            path: '/inks',
            pageBuilder: (context, state) => _buildSmoothPage(
              key: state.pageKey,
              child: const InksScreen(),
            ),
          ),
        ],
      ),
    ],
  );
}
