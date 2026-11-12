import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Semantic Status Color Extension for Enterprise Workflows
@immutable
class AppStatusColors extends ThemeExtension<AppStatusColors> {
  final Color activeSurface;
  final Color activeBorder;
  final Color activeText;

  final Color availableSurface;
  final Color availableBorder;
  final Color availableText;

  final Color warningSurface;
  final Color warningBorder;
  final Color warningText;

  final Color criticalSurface;
  final Color criticalBorder;
  final Color criticalText;

  const AppStatusColors({
    required this.activeSurface,
    required this.activeBorder,
    required this.activeText,
    required this.availableSurface,
    required this.availableBorder,
    required this.availableText,
    required this.warningSurface,
    required this.warningBorder,
    required this.warningText,
    required this.criticalSurface,
    required this.criticalBorder,
    required this.criticalText,
  });

  static const AppStatusColors standard = AppStatusColors(
    activeSurface: AppColors.statusActiveSurface,
    activeBorder: AppColors.statusActiveBorder,
    activeText: AppColors.statusActiveText,
    availableSurface: AppColors.statusAvailableSurface,
    availableBorder: AppColors.statusAvailableBorder,
    availableText: AppColors.statusAvailableText,
    warningSurface: AppColors.statusWarningSurface,
    warningBorder: AppColors.statusWarningBorder,
    warningText: AppColors.statusWarningText,
    criticalSurface: AppColors.statusCriticalSurface,
    criticalBorder: AppColors.statusCriticalBorder,
    criticalText: AppColors.statusCriticalText,
  );

  @override
  AppStatusColors copyWith({
    Color? activeSurface,
    Color? activeBorder,
    Color? activeText,
    Color? availableSurface,
    Color? availableBorder,
    Color? availableText,
    Color? warningSurface,
    Color? warningBorder,
    Color? warningText,
    Color? criticalSurface,
    Color? criticalBorder,
    Color? criticalText,
  }) {
    return AppStatusColors(
      activeSurface: activeSurface ?? this.activeSurface,
      activeBorder: activeBorder ?? this.activeBorder,
      activeText: activeText ?? this.activeText,
      availableSurface: availableSurface ?? this.availableSurface,
      availableBorder: availableBorder ?? this.availableBorder,
      availableText: availableText ?? this.availableText,
      warningSurface: warningSurface ?? this.warningSurface,
      warningBorder: warningBorder ?? this.warningBorder,
      warningText: warningText ?? this.warningText,
      criticalSurface: criticalSurface ?? this.criticalSurface,
      criticalBorder: criticalBorder ?? this.criticalBorder,
      criticalText: criticalText ?? this.criticalText,
    );
  }

  @override
  AppStatusColors lerp(ThemeExtension<AppStatusColors>? other, double t) {
    if (other is! AppStatusColors) return this;
    return AppStatusColors(
      activeSurface: Color.lerp(activeSurface, other.activeSurface, t)!,
      activeBorder: Color.lerp(activeBorder, other.activeBorder, t)!,
      activeText: Color.lerp(activeText, other.activeText, t)!,
      availableSurface: Color.lerp(availableSurface, other.availableSurface, t)!,
      availableBorder: Color.lerp(availableBorder, other.availableBorder, t)!,
      availableText: Color.lerp(availableText, other.availableText, t)!,
      warningSurface: Color.lerp(warningSurface, other.warningSurface, t)!,
      warningBorder: Color.lerp(warningBorder, other.warningBorder, t)!,
      warningText: Color.lerp(warningText, other.warningText, t)!,
      criticalSurface: Color.lerp(criticalSurface, other.criticalSurface, t)!,
      criticalBorder: Color.lerp(criticalBorder, other.criticalBorder, t)!,
      criticalText: Color.lerp(criticalText, other.criticalText, t)!,
    );
  }
}

