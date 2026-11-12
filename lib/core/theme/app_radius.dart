import 'package:flutter/material.dart';

/// Kinetic Amber Enterprise Radius Tokens
class AppRadius {
  AppRadius._();

  static const double sm = 2.0; // 0.125rem
  static const double base = 4.0; // 0.25rem - Inputs, Checkboxes, Inner Badges
  static const double md = 6.0; // 0.375rem
  static const double lg = 8.0; // 0.5rem - Cards, Modals, Tables, Panels
  static const double xl = 12.0; // 0.75rem
  static const double full = 9999.0; // Pills & Status Chips

  static const BorderRadius roundedSm = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius rounded = BorderRadius.all(Radius.circular(base));
  static const BorderRadius roundedMd = BorderRadius.all(Radius.circular(md));
  static const BorderRadius roundedLg = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius roundedXl = BorderRadius.all(Radius.circular(xl));
  static const BorderRadius roundedFull = BorderRadius.all(Radius.circular(full));
}

