import 'dart:ui';
import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Kinetic Amber Enterprise Typography Tokens
class AppTypography {
  AppTypography._();

  static const String fontInter = 'Inter';
  static const String fontPlex = 'IBM Plex Sans';
  static const String fontPlexArabic = 'IBM Plex Sans Arabic';
  static const String fontMono = 'JetBrains Mono';

  static const List<String> fallbackSans = [
    fontPlex,
    fontPlexArabic,
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ];

  static const List<String> fallbackMono = [
    'Consolas',
    'Courier New',
    'monospace',
  ];

  // Display
  static const TextStyle display = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 36,
    fontWeight: FontWeight.w700,
    height: 44 / 36,
    letterSpacing: -0.72,
    color: AppColors.slateDeep,
  );

  // Headlines
  static const TextStyle headlineLg = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    height: 36 / 28,
    letterSpacing: -0.42,
    color: AppColors.slateDeep,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  static const TextStyle headlineLgMobile = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 24,
    fontWeight: FontWeight.w700,
    height: 32 / 24,
    letterSpacing: -0.24,
    color: AppColors.slateDeep,
  );

  static const TextStyle headlineMd = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 22,
    fontWeight: FontWeight.w600,
    height: 28 / 22,
    letterSpacing: -0.22,
    color: AppColors.slateDeep,
  );

  static const TextStyle headlineSm = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 24 / 18,
    color: AppColors.slateDeep,
  );

  // Titles
  static const TextStyle titleMd = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 22 / 16,
    color: AppColors.slateDeep,
  );

  static const TextStyle titleSm = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 20 / 14,
    color: AppColors.slateDeep,
  );

  // Body
  static const TextStyle bodyLg = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 24 / 16,
    color: AppColors.slateDark,
  );

  static const TextStyle bodyMd = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 20 / 14,
    color: AppColors.slateDark,
  );

  static const TextStyle bodySm = TextStyle(
    fontFamily: fontInter,
    fontFamilyFallback: fallbackSans,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 16 / 12,
    color: AppColors.slateMuted,
  );

  // Labels & Metadata (IBM Plex Sans)
  static const TextStyle labelLg = TextStyle(
    fontFamily: fontPlex,
    fontFamilyFallback: fallbackSans,
    fontSize: 13,
    fontWeight: FontWeight.w600,
    height: 18 / 13,
    letterSpacing: 0.13,
    color: AppColors.slateDark,
  );

  static const TextStyle labelMd = TextStyle(
    fontFamily: fontPlex,
    fontFamilyFallback: fallbackSans,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 16 / 12,
    letterSpacing: 0.24,
    color: AppColors.slateMuted,
  );

  static const TextStyle labelSm = TextStyle(
    fontFamily: fontPlex,
    fontFamilyFallback: fallbackSans,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 14 / 11,
    letterSpacing: 0.33,
    color: AppColors.slateMuted,
  );

  // Code / Monospace
  static const TextStyle codeMono = TextStyle(
    fontFamily: fontMono,
    fontFamilyFallback: fallbackMono,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 16 / 12,
    fontFeatures: [FontFeature.tabularFigures()],
    color: AppColors.slateDeep,
  );

  /// Convert to Material 3 TextTheme
  static TextTheme toTextTheme() {
    return const TextTheme(
      displayLarge: display,
      headlineLarge: headlineLg,
      headlineMedium: headlineMd,
      headlineSmall: headlineSm,
      titleMedium: titleMd,
      titleSmall: titleSm,
      bodyLarge: bodyLg,
      bodyMedium: bodyMd,
      bodySmall: bodySm,
      labelLarge: labelLg,
      labelMedium: labelMd,
      labelSmall: labelSm,
    );
  }
}

