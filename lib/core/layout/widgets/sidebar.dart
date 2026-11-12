import 'package:flutter/material.dart';
import '../../theme/theme.dart';
import '../models/nav_item.dart';

class Sidebar extends StatelessWidget {
  final String currentRoute;
  final bool isCollapsed;
  final VoidCallback? onToggleCollapse;
  final Function(String route) onNavigate;

  const Sidebar({
    super.key,
    required this.currentRoute,
    required this.onNavigate,
    this.isCollapsed = false,
    this.onToggleCollapse,
  });

  static const List<NavItem> navItems = [
    NavItem(
      title: 'Dashboard',
      icon: Icons.dashboard_outlined,
      route: '/',
    ),
    NavItem(
      title: 'IT Assets & Devices',
      icon: Icons.devices_outlined,
      route: '/assets',
      badgeCount: 142,
    ),
    NavItem(
      title: 'Servers & Nodes',
      icon: Icons.dns_outlined,
      route: '/servers',
    ),
    NavItem(
      title: 'Tickets & Support',
      icon: Icons.confirmation_number_outlined,
      route: '/tickets',
      badgeCount: 3,
    ),
    NavItem(
      title: 'Settings & Config',
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
          // Brand Header
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
                          'Enterprise IT Suite',
                          style: AppTypography.labelSm.copyWith(
                            color: AppColors.slatePlaceholder,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (onToggleCollapse != null) ...[
                    IconButton(
                      icon: const Icon(
                        Icons.chevron_left,
                        color: AppColors.slatePlaceholder,
                        size: 20,
                      ),
                      onPressed: onToggleCollapse,
                      tooltip: 'Collapse Sidebar',
                    ),
                  ],
                ],
              ],
            ),
          ),

          // Navigation Links
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

          // Expand Button when collapsed
          if (isCollapsed && onToggleCollapse != null) ...[
            IconButton(
              icon: const Icon(
                Icons.chevron_right,
                color: AppColors.slatePlaceholder,
                size: 20,
              ),
              onPressed: onToggleCollapse,
              tooltip: 'Expand Sidebar',
            ),
            const SizedBox(height: AppSpacing.sm),
          ],

          // System Status Footer
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

  Widget _buildNavItem(NavItem item, bool isSelected) {
    return InkWell(
      onTap: () => onNavigate(item.route),
      child: Container(
        height: 44,
        color: isSelected ? AppColors.slateStructural : Colors.transparent,
        child: Row(
          children: [
            // 3px Pure Yellow Leading Strip
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
                  item.title,
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

