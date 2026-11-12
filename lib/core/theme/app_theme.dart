import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_radius.dart';
import 'app_spacing.dart';
import 'app_typography.dart';
import 'status_colors.dart';

/// Kinetic Amber Enterprise Theme Configuration
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    const colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      primaryContainer: AppColors.primaryContainer,
      onPrimaryContainer: AppColors.onPrimaryContainer,
      inversePrimary: AppColors.inversePrimary,
      secondary: AppColors.secondary,
      onSecondary: AppColors.onSecondary,
      secondaryContainer: AppColors.secondaryContainer,
      onSecondaryContainer: AppColors.onSecondaryContainer,
      tertiary: AppColors.tertiary,
      onTertiary: AppColors.onTertiary,
      tertiaryContainer: AppColors.tertiaryContainer,
      onTertiaryContainer: AppColors.onTertiaryContainer,
      error: AppColors.error,
      onError: AppColors.onError,
      errorContainer: AppColors.errorContainer,
      onErrorContainer: AppColors.onErrorContainer,
      surface: AppColors.surface,
      onSurface: AppColors.onSurface,
      onSurfaceVariant: AppColors.onSurfaceVariant,
      outline: AppColors.outline,
      outlineVariant: AppColors.outlineVariant,
      surfaceTint: AppColors.surfaceTint,
      inverseSurface: AppColors.inverseSurface,
      onInverseSurface: AppColors.inverseOnSurface,
    );

    return ThemeData(
      useMaterial3: true,
      fontFamily: AppTypography.fontPrimary,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.slateCanvas,
      textTheme: AppTypography.toTextTheme(),
      extensions: const [
        AppStatusColors.standard,
      ],

      // Topbar / AppBar
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.slateDeep,
        elevation: 0,
        scrolledUnderElevation: 0,
        shape: Border(
          bottom: BorderSide(color: AppColors.slateBorder, width: 1),
        ),
        titleTextStyle: AppTypography.titleMd,
        centerTitle: false,
      ),

      // Enterprise Card System
      cardTheme: const CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: AppColors.slateBorder, width: 1),
          borderRadius: AppRadius.roundedLg,
        ),
      ),

      // Primary Buttons (Signal Yellow #FCC41A with Deep Slate #0F172A text)
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.signalYellow,
          foregroundColor: AppColors.textOnYellow,
          elevation: 0,
          shadowColor: Colors.transparent,
          textStyle: AppTypography.labelLg.copyWith(
            fontWeight: FontWeight.w600,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: const RoundedRectangleBorder(
            borderRadius: AppRadius.rounded,
          ),
        ),
      ),

      // Outline / Ghost Buttons
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.slateStructural,
          backgroundColor: Colors.transparent,
          side: const BorderSide(color: AppColors.slateBorderSecondary, width: 1),
          textStyle: AppTypography.labelLg,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: const RoundedRectangleBorder(
            borderRadius: AppRadius.rounded,
          ),
        ),
      ),

      // Text Buttons
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.tertiaryAccent,
          textStyle: AppTypography.labelLg,
          shape: const RoundedRectangleBorder(
            borderRadius: AppRadius.rounded,
          ),
        ),
      ),

      // Input Fields
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        hintStyle: AppTypography.bodyMd.copyWith(color: AppColors.slatePlaceholder),
        labelStyle: AppTypography.labelMd.copyWith(color: AppColors.slateDark),
        border: const OutlineInputBorder(
          borderRadius: AppRadius.rounded,
          borderSide: BorderSide(color: AppColors.slateBorderSecondary, width: 1),
        ),
        enabledBorder: const OutlineInputBorder(
          borderRadius: AppRadius.rounded,
          borderSide: BorderSide(color: AppColors.slateBorderSecondary, width: 1),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: AppRadius.rounded,
          borderSide: BorderSide(color: AppColors.slateDeep, width: 1.5),
        ),
        errorBorder: const OutlineInputBorder(
          borderRadius: AppRadius.rounded,
          borderSide: BorderSide(color: AppColors.error, width: 1),
        ),
      ),

      // Tables
      dataTableTheme: DataTableThemeData(
        headingRowColor: WidgetStateProperty.all(AppColors.slateCanvas),
        headingTextStyle: AppTypography.labelMd.copyWith(
          color: AppColors.slateMuted,
          fontWeight: FontWeight.w600,
        ),
        dataRowColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.hovered)) {
            return AppColors.slateCanvas;
          }
          if (states.contains(WidgetState.selected)) {
            return AppColors.statusWarningSurface;
          }
          return Colors.white;
        }),
        dataTextStyle: AppTypography.bodyMd.copyWith(
          color: AppColors.slateDeep,
        ),
        dividerThickness: 1,
        horizontalMargin: AppSpacing.md,
        headingRowHeight: AppSpacing.tableHeaderHeight,
        dataRowMinHeight: AppSpacing.tableRowHeight,
        dataRowMaxHeight: AppSpacing.tableRowHeight,
      ),

      // Checkbox Theme
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.slateDeep;
          }
          return Colors.transparent;
        }),
        checkColor: WidgetStateProperty.all(AppColors.signalYellow),
        side: const BorderSide(color: AppColors.slatePlaceholder, width: 1.5),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(3)),
        ),
      ),

      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AppColors.slateBorder,
        thickness: 1,
        space: 1,
      ),
    );
  }
}

