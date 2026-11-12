import 'package:flutter/material.dart';

/// Kinetic Amber Enterprise Color Palette
class AppColors {
  AppColors._();

  // Core Identity / Kinetic Amber
  static const Color primary = Color(0xFF775A00);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFFFCC41A); // Operational Signal Yellow
  static const Color onPrimaryContainer = Color(0xFF6D5200);
  static const Color inversePrimary = Color(0xFFF6BF10);

  static const Color primaryFixed = Color(0xFFFFDF97);
  static const Color primaryFixedDim = Color(0xFFF6BF10);
  static const Color onPrimaryFixed = Color(0xFF251A00);
  static const Color onPrimaryFixedVariant = Color(0xFF5A4300);

  // Operational Yellow Accent & Charcoal Text
  static const Color signalYellow = Color(0xFFFCC41A);
  static const Color signalYellowHover = Color(0xFFF5B700);
  static const Color signalYellowActive = Color(0xFFDDA600);
  static const Color textOnYellow = Color(0xFF0F172A);

  // Secondary / Structural Slates
  static const Color secondary = Color(0xFF565E74);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFDAE2FD);
  static const Color onSecondaryContainer = Color(0xFF5C647A);

  static const Color secondaryFixed = Color(0xFFDAE2FD);
  static const Color secondaryFixedDim = Color(0xFFBEC6E0);
  static const Color onSecondaryFixed = Color(0xFF131B2E);
  static const Color onSecondaryFixedVariant = Color(0xFF3F465C);

  // Structural Enterprise Slates
  static const Color slateDeep = Color(0xFF0F172A); // Sidebars, high priority typography
  static const Color slateStructural = Color(0xFF1E293B);
  static const Color slateDark = Color(0xFF334155);
  static const Color slateMuted = Color(0xFF64748B);
  static const Color slatePlaceholder = Color(0xFF94A3B8);
  static const Color slateBorderSecondary = Color(0xFFCBD5E1);
  static const Color slateBorder = Color(0xFFE2E8F0);
  static const Color slateLight = Color(0xFFF1F5F9);
  static const Color slateCanvas = Color(0xFFF8FAFC);

  // Tertiary / Cobalt Blue
  static const Color tertiary = Color(0xFF4059AA);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFFBDCAFF);
  static const Color onTertiaryContainer = Color(0xFF3851A1);
  static const Color tertiaryAccent = Color(0xFF1E3A8A); // Deep Cobalt for analytical links/pills

  static const Color tertiaryFixed = Color(0xFFDCE1FF);
  static const Color tertiaryFixedDim = Color(0xFFB6C4FF);
  static const Color onTertiaryFixed = Color(0xFF00164E);
  static const Color onTertiaryFixedVariant = Color(0xFF264191);

  // Surfaces & Backgrounds
  static const Color background = Color(0xFFF8F9FF);
  static const Color onBackground = Color(0xFF0B1C30);
  static const Color surface = Color(0xFFF8F9FF);
  static const Color surfaceDim = Color(0xFFCBDBF5);
  static const Color surfaceBright = Color(0xFFF8F9FF);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFEFF4FF);
  static const Color surfaceContainer = Color(0xFFE5EEFF);
  static const Color surfaceContainerHigh = Color(0xFFDCE9FF);
  static const Color surfaceContainerHighest = Color(0xFFD3E4FE);
  static const Color surfaceVariant = Color(0xFFD3E4FE);
  static const Color onSurface = Color(0xFF0B1C30);
  static const Color onSurfaceVariant = Color(0xFF4F4633);
  static const Color inverseSurface = Color(0xFF213145);
  static const Color inverseOnSurface = Color(0xFFEAF1FF);
  static const Color surfaceTint = Color(0xFF775A00);

  // Outlines
  static const Color outline = Color(0xFF817660);
  static const Color outlineVariant = Color(0xFFD3C5AC);

  // Error States
  static const Color error = Color(0xFFBA1A1A);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF93000A);

  // Status Semantic Roles
  // 1. Active / Operational
  static const Color statusActiveSurface = Color(0xFFECFDF5);
  static const Color statusActiveBorder = Color(0xFFA7F3D0);
  static const Color statusActiveText = Color(0xFF065F46);

  // 2. Available
  static const Color statusAvailableSurface = Color(0xFFEFF6FF);
  static const Color statusAvailableBorder = Color(0xFFBFDBFE);
  static const Color statusAvailableText = Color(0xFF1E40AF);

  // 3. Low Stock / Attention
  static const Color statusWarningSurface = Color(0xFFFEFCE8);
  static const Color statusWarningBorder = Color(0xFFFEF08A);
  static const Color statusWarningText = Color(0xFF854D0E);

  // 4. Expiring Soon / Critical
  static const Color statusCriticalSurface = Color(0xFFFEF2F2);
  static const Color statusCriticalBorder = Color(0xFFFECACA);
  static const Color statusCriticalText = Color(0xFF991B1B);
}

