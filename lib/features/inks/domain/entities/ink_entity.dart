import 'package:flutter/material.dart';

/// ألوان الأحبار الأساسية (CMYK)
enum InkColor {
  black(
    'الأسود (Black - K)',
    'K',
    Color(0xFF182230),
    Color(0xFFF2F4F7),
    Color(0xFFD0D5DD),
  ),
  cyan(
    'السماوي (Cyan - C)',
    'C',
    Color(0xFF0284C7),
    Color(0xFFE0F2FE),
    Color(0xFFBAE6FD),
  ),
  magenta(
    'الأرجواني (Magenta - M)',
    'M',
    Color(0xFFDB2777),
    Color(0xFFFCE7F3),
    Color(0xFFFBCFE8),
  ),
  yellow(
    'الأصفر (Yellow - Y)',
    'Y',
    Color(0xFFCA8A04),
    Color(0xFFFEF9C3),
    Color(0xFFFEF08A),
  );

  final String label;
  final String code;
  final Color primaryColor;
  final Color backgroundColor;
  final Color borderColor;

  const InkColor(
    this.label,
    this.code,
    this.primaryColor,
    this.backgroundColor,
    this.borderColor,
  );
}

/// كيان بيانات الحبر
class InkEntity {
  final String id;
  final String brand;
  final String model;
  final InkColor color;
  final int quantity;
  final int alertThreshold;

  const InkEntity({
    required this.id,
    required this.brand,
    required this.model,
    required this.color,
    required this.quantity,
    required this.alertThreshold,
  });

  /// فحص هل وصل المخزون إلى حد التنبيه أو أقل
  bool get isLowStock => quantity <= alertThreshold;

  InkEntity copyWith({
    String? id,
    String? brand,
    String? model,
    InkColor? color,
    int? quantity,
    int? alertThreshold,
  }) {
    return InkEntity(
      id: id ?? this.id,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      color: color ?? this.color,
      quantity: quantity ?? this.quantity,
      alertThreshold: alertThreshold ?? this.alertThreshold,
    );
  }
}

