import 'package:flutter/material.dart';
import '../../../../core/theme/theme.dart';
import '../../domain/entities/device_entity.dart';
import '../widgets/device_form_dialog.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  String _searchQuery = '';
  DeviceClassification? _selectedFilter;

  // قائمة بيانات الأجهزة
  late List<DeviceEntity> _devices;

  @override
  void initState() {
    super.initState();
    _devices = [
      const DeviceEntity(
        id: 'DEV-001',
        name: 'ThinkPad X1 Carbon Gen 11',
        brand: 'Lenovo',
        deviceType: 'حاسوب محمول (Laptop)',
        serialNumber: 'PF-4X8910',
        department: 'إدارة تقنية المعلومات',
        employee: 'محمد الحملي',
        classification: DeviceClassification.personal,
      ),
      const DeviceEntity(
        id: 'DEV-002',
        name: 'MacBook Pro 16" M3 Pro',
        brand: 'Apple',
        deviceType: 'حاسوب محمول (Laptop)',
        serialNumber: 'C02G90XXMD6M',
        department: 'إدارة التحول الرقمي',
        employee: 'أحمد السعيد',
        classification: DeviceClassification.personal,
      ),
      const DeviceEntity(
        id: 'DEV-003',
        name: 'PowerEdge R750 Server',
        brand: 'Dell',
        deviceType: 'خادم شبكي (Server)',
        serialNumber: 'SERV-DELL-8823',
        department: 'مركز البيانات والشبكات',
        employee: 'فريق البنية التحتية',
        classification: DeviceClassification.shared,
      ),
      const DeviceEntity(
        id: 'DEV-004',
        name: 'LaserJet Enterprise M608',
        brand: 'HP',
        deviceType: 'طابعة شبكية (Printer)',
        serialNumber: 'HP-PRNT-99120',
        department: 'إدارة الشؤون المالية',
        employee: 'مشترك للموظفين',
        classification: DeviceClassification.shared,
      ),
      const DeviceEntity(
        id: 'DEV-005',
        name: 'OptiPlex 7090 Micro Desktop',
        brand: 'Dell',
        deviceType: 'حاسوب مكتبي (Desktop)',
        serialNumber: 'OPT-7090-4412',
        department: 'خدمة العملاء',
        employee: 'سارة خالد',
        classification: DeviceClassification.personal,
      ),
      const DeviceEntity(
        id: 'DEV-006',
        name: 'Catalyst 9300 Switch',
        brand: 'Cisco',
        deviceType: 'موزع شبكة (Switch)',
        serialNumber: 'CISCO-CAT-1102',
        department: 'إدارة تقنية المعلومات',
        employee: 'مشترك للشبكة الرئيسية',
        classification: DeviceClassification.shared,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    // تصفية الأجهزة بحسب البحث والتصنيف
    final filteredDevices = _devices.where((device) {
      final matchesSearch = _searchQuery.isEmpty ||
          device.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          device.serialNumber.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          device.employee.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          device.brand.toLowerCase().contains(_searchQuery.toLowerCase());

      final matchesClassification = _selectedFilter == null ||
          device.classification == _selectedFilter;

      return matchesSearch && matchesClassification;
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. رأس الصفحة (Page Header)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'سجل الأصول والأجهزة',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.slateDeep,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'إدارة ومتابعة كافة الأجهزة والعهد الإلكترونية المخصصة للموظفين والإدارات',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.slateMuted,
                    ),
                  ),
                ],
              ),

              // زر إضافة جهاز جديد
              ElevatedButton.icon(
                onPressed: () async {
                  final newDevice = await DeviceFormDialog.show(context);
                  if (newDevice != null) {
                    setState(() {
                      _devices.insert(0, newDevice);
                    });
                  }
                },
                icon: const Icon(Icons.add, size: 18),
                label: const Text('إضافة جهاز جديد'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.signalYellow,
                  foregroundColor: AppColors.textOnYellow,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: AppRadius.rounded,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.lg),

          // 2. شريط البحث والتصفية (Search & Filters Bar)
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: AppRadius.roundedLg,
              border: Border.all(color: AppColors.slateBorder, width: 1),
            ),
            child: Row(
              children: [
                // حقل البحث
                Expanded(
                  child: Container(
                    height: 40,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppColors.slateCanvas,
                      borderRadius: AppRadius.rounded,
                      border: Border.all(color: AppColors.slateBorder, width: 1),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search, size: 18, color: AppColors.slatePlaceholder),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            onChanged: (val) {
                              setState(() {
                                _searchQuery = val;
                              });
                            },
                            decoration: const InputDecoration(
                              hintText: 'بحث باسم الجهاز، السيريال، الماركة، أو الموظف...',
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                              fillColor: Colors.transparent,
                            ),
                            style: const TextStyle(fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(width: AppSpacing.md),

                // أزرار تصفية التصنيف (الكل / شخصي / جماعي)
                _buildFilterChip('الكل', null),
                const SizedBox(width: 6),
                _buildFilterChip('شخصي', DeviceClassification.personal),
                const SizedBox(width: 6),
                _buildFilterChip('جماعي', DeviceClassification.shared),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // 3. جدول الأجهزة (Devices Data Table)
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: AppRadius.roundedLg,
              border: Border.all(color: AppColors.slateBorder, width: 1),
            ),
            child: ClipRRect(
              borderRadius: AppRadius.roundedLg,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: ConstrainedBox(
                      // إجبار الجدول على أخذ كامل عرض الشاشة المتاح
                      constraints: BoxConstraints(minWidth: constraints.maxWidth),
                      child: DataTable(
                        horizontalMargin: 20,
                        columnSpacing: 24,
                        headingRowColor: WidgetStateProperty.all(AppColors.slateCanvas),
                        headingTextStyle: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          color: AppColors.slateDark,
                        ),
                        dataRowMinHeight: 52,
                        dataRowMaxHeight: 52,
                        dividerThickness: 1,
                        columns: const [
                          DataColumn(label: Text('#')),
                          DataColumn(label: Text('اسم الجهاز')),
                          DataColumn(label: Text('الماركة')),
                          DataColumn(label: Text('نوع الجهاز')),
                          DataColumn(label: Text('السيريال نمبر (S/N)')),
                          DataColumn(label: Text('الإدارة')),
                          DataColumn(label: Text('الموظف / المستلم')),
                          DataColumn(label: Text('التصنيف')),
                          DataColumn(label: Text('الإجراءات')),
                        ],
                  rows: filteredDevices.asMap().entries.map((entry) {
                    final index = entry.key + 1;
                    final device = entry.value;

                    return DataRow(
                      cells: [
                        DataCell(
                          Text(
                            '$index',
                            style: const TextStyle(
                              color: AppColors.slateMuted,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        // اسم الجهاز
                        DataCell(
                          Text(
                            device.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: AppColors.slateDeep,
                            ),
                          ),
                        ),
                        // الماركة
                        DataCell(
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.slateLight,
                              borderRadius: AppRadius.roundedSm,
                              border: Border.all(color: AppColors.slateBorder, width: 1),
                            ),
                            child: Text(
                              device.brand,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                                color: AppColors.slateDeep,
                              ),
                            ),
                          ),
                        ),
                        // نوع الجهاز
                        DataCell(
                          Text(
                            device.deviceType,
                            style: const TextStyle(fontSize: 12, color: AppColors.slateDark),
                          ),
                        ),
                        // السيريال نمبر بخط مونو
                        DataCell(
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.slateCanvas,
                              borderRadius: AppRadius.roundedSm,
                              border: Border.all(color: AppColors.slateBorderSecondary, width: 1),
                            ),
                            child: Text(
                              device.serialNumber,
                              style: const TextStyle(
                                fontFamily: 'JetBrains Mono',
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.tertiaryAccent,
                              ),
                            ),
                          ),
                        ),
                        // الإدارة
                        DataCell(
                          Text(
                            device.department,
                            style: const TextStyle(fontSize: 12, color: AppColors.slateDark),
                          ),
                        ),
                        // الموظف
                        DataCell(
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircleAvatar(
                                radius: 11,
                                backgroundColor: device.classification == DeviceClassification.personal
                                    ? AppColors.secondaryContainer
                                    : AppColors.statusActiveSurface,
                                child: Icon(
                                  device.classification == DeviceClassification.personal
                                      ? Icons.person_outline
                                      : Icons.group_outlined,
                                  size: 13,
                                  color: device.classification == DeviceClassification.personal
                                      ? AppColors.slateDeep
                                      : AppColors.statusActiveText,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                device.employee,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.slateDeep,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // التصنيف (شخصي / جماعي)
                        DataCell(
                          _buildClassificationBadge(device.classification),
                        ),
                        // الإجراءات
                        DataCell(
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.slateDark),
                                onPressed: () async {
                                  final updated = await DeviceFormDialog.show(context, device: device);
                                  if (updated != null) {
                                    setState(() {
                                      final idx = _devices.indexWhere((d) => d.id == device.id);
                                      if (idx != -1) {
                                        _devices[idx] = updated;
                                      }
                                    });
                                  }
                                },
                                tooltip: 'تعديل',
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
                                onPressed: () {
                                  setState(() {
                                    _devices.removeWhere((d) => d.id == device.id);
                                  });
                                },
                                tooltip: 'حذف',
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            );
          },
        ),
      ),
    ),
  ],
),
    );
  }

  /// زر تصفية سريع
  Widget _buildFilterChip(String label, DeviceClassification? value) {
    final isSelected = _selectedFilter == value;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedFilter = value;
        });
      },
      borderRadius: AppRadius.roundedFull,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.slateDeep : AppColors.slateCanvas,
          borderRadius: AppRadius.roundedFull,
          border: Border.all(
            color: isSelected ? AppColors.slateDeep : AppColors.slateBorder,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.slateDark,
          ),
        ),
      ),
    );
  }

  /// شارة تصنيف الجهاز (شخصي / جماعي)
  Widget _buildClassificationBadge(DeviceClassification classification) {
    final isPersonal = classification == DeviceClassification.personal;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isPersonal ? const Color(0xFFEFF6FF) : const Color(0xFFECFDF5),
        border: Border.all(
          color: isPersonal ? const Color(0xFFBFDBFE) : const Color(0xFFA7F3D0),
          width: 1,
        ),
        borderRadius: AppRadius.roundedFull,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isPersonal ? const Color(0xFF1E40AF) : const Color(0xFF065F46),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            classification.label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isPersonal ? const Color(0xFF1E40AF) : const Color(0xFF065F46),
            ),
          ),
        ],
      ),
    );
  }
}
