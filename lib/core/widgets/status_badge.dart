import 'package:flutter/material.dart';
import '../../theme/theme.dart';

enum AssetStatus {
  active,
  available,
  lowStock,
  critical,
}

class StatusBadge extends StatelessWidget {
  final AssetStatus status;
  final String? customLabel;

  const StatusBadge({
    super.key,
    required this.status,
    this.customLabel,
  });

  @override
  Widget build(BuildContext context) {
    final statusColors = Theme.of(context).extension<AppStatusColors>()!;

    Color surface;
    Color border;
    Color text;
    String label;

    switch (status) {
      case AssetStatus.active:
        surface = statusColors.activeSurface;
        border = statusColors.activeBorder;
        text = statusColors.activeText;
        label = customLabel ?? 'Active';
        break;
      case AssetStatus.available:
        surface = statusColors.availableSurface;
        border = statusColors.availableBorder;
        text = statusColors.availableText;
        label = customLabel ?? 'Available';
        break;
      case AssetStatus.lowStock:
        surface = statusColors.warningSurface;
        border = statusColors.warningBorder;
        text = statusColors.warningText;
        label = customLabel ?? 'Low Stock';
        break;
      case AssetStatus.critical:
        surface = statusColors.criticalSurface;
        border = statusColors.criticalBorder;
        text = statusColors.criticalText;
        label = customLabel ?? 'Expiring Soon';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: surface,
        border: Border.all(color: border, width: 1),
        borderRadius: AppRadius.roundedFull,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(
              color: text,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTypography.labelSm.copyWith(
              color: text,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

