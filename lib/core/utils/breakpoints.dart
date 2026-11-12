import 'package:flutter/material.dart';

/// نقاط التوقف القياسية للتجاوب (Responsive Breakpoints)
class Breakpoints {
  Breakpoints._();

  static const double mobile = 768.0;
  static const double tablet = 1024.0;

  /// فحص هل الشاشة هاتف صغير
  static bool isMobile(BuildContext context) =>
      MediaQuery.sizeOf(context).width < mobile;

  /// فحص هل الشاشة جهاز لوحي أو متوسطة
  static bool isTablet(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    return width >= mobile && width < tablet;
  }

  /// فحص هل الشاشة كمبيوتر / شاشة كبيرة
  static bool isDesktop(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= tablet;
}

