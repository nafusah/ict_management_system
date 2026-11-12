import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../theme/theme.dart';
import 'app_sidebar.dart';
import 'app_topbar.dart';

class AppShell extends StatefulWidget {
  final Widget child;

  const AppShell({
    super.key,
    required this.child,
  });

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _isCollapsed = false;

  List<String> _getBreadcrumbs(String location) {
    if (location == '/' || location.isEmpty) {
      return ['IT Management', 'Dashboard'];
    }
    final segments = location.split('/').where((s) => s.isNotEmpty).toList();
    final crumbs = ['IT Management'];
    for (final seg in segments) {
      crumbs.add(seg[0].toUpperCase() + seg.substring(1));
    }
    return crumbs;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= 1024;

    return Scaffold(
      key: _scaffoldKey,
      drawer: isDesktop
          ? null
          : Drawer(
              child: AppSidebar(
                currentRoute: location,
                onNavigate: (route) {
                  Navigator.of(context).pop();
                  context.go(route);
                },
              ),
            ),
      body: Row(
        children: [
          // Persistent Desktop Sidebar
          if (isDesktop) ...[
            AppSidebar(
              currentRoute: location,
              isCollapsed: _isCollapsed,
              onToggleCollapse: () {
                setState(() {
                  _isCollapsed = !_isCollapsed;
                });
              },
              onNavigate: (route) => context.go(route),
            ),
          ],

          // Main Viewport (Topbar + Dynamic Canvas)
          Expanded(
            child: Column(
              children: [
                AppTopbar(
                  breadcrumbs: _getBreadcrumbs(location),
                  onMenuPressed: isDesktop
                      ? null
                      : () => _scaffoldKey.currentState?.openDrawer(),
                ),
                Expanded(
                  child: Container(
                    color: AppColors.slateCanvas,
                    alignment: Alignment.topCenter,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        maxWidth: AppSpacing.maxContentWidth,
                      ),
                      child: widget.child,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

