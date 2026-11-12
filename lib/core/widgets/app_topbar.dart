import 'package:flutter/material.dart';
import '../../theme/theme.dart';

class AppTopbar extends StatelessWidget {
  final List<String> breadcrumbs;
  final VoidCallback? onMenuPressed;
  final ValueChanged<String>? onSearch;

  const AppTopbar({
    super.key,
    required this.breadcrumbs,
    this.onMenuPressed,
    this.onSearch,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppSpacing.topbarHeight,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: AppColors.slateBorder, width: 1),
        ),
      ),
      child: Row(
        children: [
          // Mobile/Tablet Drawer Toggle
          if (onMenuPressed != null) ...[
            IconButton(
              icon: const Icon(Icons.menu, size: 20, color: AppColors.slateDark),
              onPressed: onMenuPressed,
              tooltip: 'Toggle Navigation',
            ),
            const SizedBox(width: AppSpacing.sm),
          ],

          // Global Breadcrumbs with Chevrons
          Expanded(
            child: Row(
              children: [
                for (int i = 0; i < breadcrumbs.length; i++) ...[
                  if (i > 0) ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6),
                      child: Icon(
                        Icons.chevron_right,
                        size: 16,
                        color: AppColors.slatePlaceholder,
                      ),
                    ),
                  ],
                  Text(
                    breadcrumbs[i],
                    style: AppTypography.labelMd.copyWith(
                      color: i == breadcrumbs.length - 1
                          ? AppColors.slateDeep
                          : AppColors.slateMuted,
                      fontWeight: i == breadcrumbs.length - 1
                          ? FontWeight.w600
                          : FontWeight.w400,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Centered Command-Bar Search with ⌘K Badge
          Container(
            width: 280,
            height: 38,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: AppColors.slateLight,
              borderRadius: AppRadius.rounded,
              border: Border.all(color: AppColors.slateBorderSecondary, width: 1),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.search,
                  size: 18,
                  color: AppColors.slatePlaceholder,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    onChanged: onSearch,
                    decoration: InputDecoration(
                      hintText: 'Search assets, IPs, nodes...',
                      hintStyle: AppTypography.bodySm.copyWith(
                        color: AppColors.slatePlaceholder,
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      filled: false,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                    style: AppTypography.bodySm,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: AppColors.slateBorder, width: 1),
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text(
                    '⌘K',
                    style: AppTypography.codeMono.copyWith(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.slateMuted,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.lg),

          // Notification Bell with Badge
          Stack(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.notifications_none_outlined,
                  size: 20,
                  color: AppColors.slateDark,
                ),
                onPressed: () {},
                tooltip: 'Alerts & Notifications',
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: AppSpacing.sm),

          // User Role & Profile Avatar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.slateCanvas,
              border: Border.all(color: AppColors.slateBorder, width: 1),
              borderRadius: AppRadius.roundedFull,
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: AppColors.slateDeep,
                  child: Text(
                    'MA',
                    style: AppTypography.labelSm.copyWith(
                      color: AppColors.signalYellow,
                      fontWeight: FontWeight.w700,
                      fontSize: 10,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'M. Alhamali',
                      style: AppTypography.labelSm.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.slateDeep,
                      ),
                    ),
                    Text(
                      'SysAdmin',
                      style: AppTypography.labelSm.copyWith(
                        fontSize: 10,
                        color: AppColors.slateMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.keyboard_arrow_down,
                  size: 16,
                  color: AppColors.slatePlaceholder,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

