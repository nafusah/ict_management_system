/// تصنيف الجهاز: إما شخصي أو جماعي
enum DeviceClassification {
  personal('شخصي'),
  shared('جماعي');

  final String label;
  const DeviceClassification(this.label);
}

/// كيان الجهاز في طبقة الـ Domain
class DeviceEntity {
  final String id;
  final String name;             // اسم الجهاز
  final String serialNumber;      // السيريال نمبر
  final String deviceType;        // نوع الجهاز (لابتوب، مكتبي، سيرفر...)
  final String brand;             // ماركة الجهاز (Dell, HP, Apple, Lenovo...)
  final String department;        // الإدارة
  final String employee;          // الموظف
  final DeviceClassification classification; // شخصي أو جماعي

  const DeviceEntity({
    required this.id,
    required this.name,
    required this.serialNumber,
    required this.deviceType,
    required this.brand,
    required this.department,
    required this.employee,
    required this.classification,
  });
}
