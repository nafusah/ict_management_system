import 'package:flutter/material.dart';
import '../../theme/theme.dart';

enum TrendDirection {
  up,
  down,
  neutral,
}

class KpiCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final String trendLabel;
  final TrendDirection trendDirection;
  final String? subtitle;

  const KpiCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.trendLabel,
    this.trendDirection = TrendDirection.up,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    Color trendBg;
    Color trendTextColor;
    IconData? trendIcon;

    switch (trendDirection) {
      case TrendDirection.up:
        trendBg = AppColors.statusActiveSurface;
        trendTextColor = AppColors.statusActiveText;
        trendIcon = Icons.north_east;
        break;
      case TrendDirection.down:
        trendBg = AppColors.statusCriticalSurface;
        trendTextColor = AppColors.statusCriticalText;
        trendIcon = Icons.south_east;
        break;
      case TrendDirection.neutral:
        trendBg = AppColors.slateLight;
        trendTextColor = AppColors.slateDark;
        trendIcon = null;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.slateBorder, width: 1),
        borderRadius: AppRadius.roundedLg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Top Row: Section Label + Tertiary Icon
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: AppTypography.labelMd.copyWith(
                  color: AppColors.slateMuted,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.slateCanvas,
                  borderRadius: AppRadius.rounded,
                  border: Border.all(color: AppColors.slateBorder, width: 1),
                ),
                child: Icon(
                  icon,
                  size: 16,
                  color: AppColors.tertiaryAccent,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),

          // Center Metric in Headline-LG with Tabular Numbers
          Text(
            value,
            style: AppTypography.headlineLg,
          ),
          const SizedBox(height: AppSpacing.sm),

          // Bottom Row: Trend Badge + Subtitle
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: trendBg,
                  borderRadius: AppRadius.roundedFull,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (trendIcon != null) ...[
                      Icon(trendIcon, size: 12, color: trendTextColor),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      trendLabel,
                      style: AppTypography.labelSm.copyWith(
                        color: trendTextColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    subtitle!,
                    style: AppTypography.bodySm.copyWith(
                      color: AppColors.slateMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

