import 'package:flutter/material.dart';
import '../../theme/theme.dart';

class NavItemData {
  final String label;
  final IconData icon;
  final String route;
  final int? badgeCount;

  const NavItemData({
    required this.label,
    required this.icon,
    required this.route,
    this.badgeCount,
  });
}

class AppSidebar extends StatelessWidget {
  final String currentRoute;
  final Function(String route) onNavigate;
  final bool isCollapsed;
  final VoidCallback? onToggleCollapse;

  const AppSidebar({
    super.key,
    required this.currentRoute,
    required this.onNavigate,
    this.isCollapsed = false,
    this.onToggleCollapse,
  });

  static const List<NavItemData> navItems = [
    NavItemData(
      label: 'Dashboard',
      icon: Icons.dashboard_outlined,
      route: '/',
    ),
    NavItemData(
      label: 'IT Assets & Devices',
      icon: Icons.computer_outlined,
      route: '/assets',
      badgeCount: 142,
    ),
    NavItemData(
      label: 'Servers & Infrastructure',
      icon: Icons.dns_outlined,
      route: '/servers',
    ),
    NavItemData(
      label: 'Software & Licenses',
      icon: Icons.verified_user_outlined,
      route: '/licenses',
    ),
    NavItemData(
      label: 'Incident Tickets',
      icon: Icons.confirmation_number_outlined,
      route: '/tickets',
      badgeCount: 3,
    ),
    NavItemData(
      label: 'System Analytics',
      icon: Icons.analytics_outlined,
      route: '/analytics',
    ),
    NavItemData(
      label: 'Admin Settings',
      icon: Icons.settings_outlined,
      route: '/settings',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final width = isCollapsed ? AppSpacing.sidebarCollapsedWidth : AppSpacing.sidebarWidth;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: width,
      decoration: const BoxDecoration(
        color: AppColors.slateDeep,
        border: Border(
          right: BorderSide(color: AppColors.slateStructural, width: 1),
        ),
      ),
      child: Column(
        children: [
          // Logo & Branding Area
          Container(
            height: AppSpacing.topbarHeight,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            alignment: Alignment.centerLeft,
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AppColors.slateStructural, width: 1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.signalYellow,
                    borderRadius: AppRadius.rounded,
                  ),
                  child: const Icon(
                    Icons.bolt,
                    color: AppColors.textOnYellow,
                    size: 20,
                  ),
                ),
                if (!isCollapsed) ...[
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'KINETIC AMBER',
                          style: AppTypography.labelLg.copyWith(
                            color: Colors.white,
                            letterSpacing: 1.1,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'IT Management Suite',
                          style: AppTypography.labelSm.copyWith(
                            color: AppColors.slatePlaceholder,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Navigation Items List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              itemCount: navItems.length,
              separatorBuilder: (_, __) => const SizedBox(height: 2),
              itemBuilder: (context, index) {
                final item = navItems[index];
                final isSelected = currentRoute == item.route;
                return _buildNavItem(item, isSelected);
              },
            ),
          ),

          // Footer / System Status
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: AppColors.slateStructural, width: 1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isCollapsed) ...[
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'Cluster Online (99.98%)',
                      style: AppTypography.labelSm.copyWith(
                        color: AppColors.slatePlaceholder,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(NavItemData item, bool isSelected) {
    return InkWell(
      onTap: () => onNavigate(item.route),
      child: Container(
        height: 44,
        color: isSelected ? AppColors.slateStructural : Colors.transparent,
        child: Row(
          children: [
            // 3px Pure Signal Yellow Leading Accent Bar for Selected Item
            Container(
              width: 3,
              height: double.infinity,
              color: isSelected ? AppColors.signalYellow : Colors.transparent,
            ),
            const SizedBox(width: 13),
            Icon(
              item.icon,
              size: 20,
              color: isSelected ? Colors.white : AppColors.slatePlaceholder,
            ),
            if (!isCollapsed) ...[
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  item.label,
                  style: AppTypography.labelMd.copyWith(
                    color: isSelected ? Colors.white : AppColors.slatePlaceholder,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (item.badgeCount != null) ...[
                Container(
                  margin: const EdgeInsets.only(right: AppSpacing.md),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.signalYellow : AppColors.slateDark,
                    borderRadius: AppRadius.roundedFull,
                  ),
                  child: Text(
                    '${item.badgeCount}',
                    style: AppTypography.labelSm.copyWith(
                      color: isSelected ? AppColors.textOnYellow : Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

