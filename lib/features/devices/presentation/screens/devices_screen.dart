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
  final Set<String> _selectedIds = {};

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

  Future<void> _openAddDeviceDialog() async {
    final newDevice = await DeviceFormDialog.show(context);
    if (newDevice != null) {
      setState(() {
        _devices.insert(0, newDevice);
      });
    }
  }

  Future<void> _openEditDeviceDialog(DeviceEntity device) async {
    final updated = await DeviceFormDialog.show(context, device: device);
    if (updated != null) {
      setState(() {
        final idx = _devices.indexWhere((d) => d.id == device.id);
        if (idx != -1) {
          _devices[idx] = updated;
        }
      });
    }
  }

  void _deleteDevice(DeviceEntity device) {
    setState(() {
      _devices.removeWhere((d) => d.id == device.id);
      _selectedIds.remove(device.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    // تصفية الأجهزة بحسب البحث والتصنيف
    final filteredDevices = _devices.where((device) {
      final matchesSearch =
          _searchQuery.isEmpty ||
          device.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          device.serialNumber.toLowerCase().contains(
            _searchQuery.toLowerCase(),
          ) ||
          device.employee.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          device.brand.toLowerCase().contains(_searchQuery.toLowerCase());

      final matchesClassification =
          _selectedFilter == null || device.classification == _selectedFilter;

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
                  const Text(
                    'إدارة ومتابعة كافة الأجهزة والعهد الإلكترونية المخصصة للموظفين والإدارات',
                    style: TextStyle(fontSize: 13, color: AppColors.slateMuted),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: _openAddDeviceDialog,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('إضافة جهاز جديد'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.signalYellow,
                  foregroundColor: AppColors.textOnYellow,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
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
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFEAECF0), width: 1),
            ),
            child: Row(
              children: [
                // حقل البحث
                Expanded(
                  child: Container(
                    height: 40,
                    padding: const EdgeInsets.symmetric(horizontal: 12),

                    child: Row(
                      children: [
                        const Icon(
                          Icons.search,
                          size: 18,
                          color: Color(0xFF667085),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(

                            onChanged: (val) {
                              setState(() {
                                _searchQuery = val;
                              });
                            },
                            decoration: const InputDecoration(
                              hintText:
                                  'بحث باسم الجهاز، السيريال، الماركة، أو الموظف...',
                              hintStyle: TextStyle(
                                color: Color(0xFF667085),
                                fontSize: 13,
                              ),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.all(10),
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

              ],
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // 3. كارد جدول الأجهزة (Untitled UI Modern Data Table)
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFEAECF0), width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // رأس الجدول داخل الكارد (Untitled UI Table Card Header)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'قائمة الأجهزة',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF101828),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF2F4F7),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              '${_devices.length} أجهزة',
                              style: const TextStyle(
                                color: Color(0xFF344054),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          if (_selectedIds.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF8FF),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                'تم تحديد ${_selectedIds.length}',
                                style: const TextStyle(
                                  color: Color(0xFF175CD3),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),

                const Divider(height: 1, color: Color(0xFFEAECF0)),

                // الجدول المتجاوب
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isAllSelected =
                        filteredDevices.isNotEmpty &&
                        filteredDevices.every(
                          (d) => _selectedIds.contains(d.id),
                        );
                    final isIndeterminate =
                        filteredDevices.any(
                          (d) => _selectedIds.contains(d.id),
                        ) &&
                        !isAllSelected;

                    return SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          minWidth: constraints.maxWidth,
                        ),
                        child: DataTable(
                          horizontalMargin: 20,
                          columnSpacing: 24,
                          headingRowHeight: 44,
                          dataRowMinHeight: 68,
                          dataRowMaxHeight: 68,
                          headingRowColor: WidgetStateProperty.all(
                            const Color(0xFFF9FAFB),
                          ),
                          dividerThickness: 1,
                          showCheckboxColumn: false,
                          columns: [
                            DataColumn(
                              label: SizedBox(
                                width: 24,
                                height: 24,
                                child: Checkbox(
                                  value: isAllSelected
                                      ? true
                                      : (isIndeterminate ? null : false),
                                  tristate: true,
                                  onChanged: (val) {
                                    setState(() {
                                      if (isAllSelected) {
                                        _selectedIds.clear();
                                      } else {
                                        _selectedIds.addAll(
                                          filteredDevices.map((d) => d.id),
                                        );
                                      }
                                    });
                                  },
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  side: const BorderSide(
                                    color: Color(0xFFD0D5DD),
                                    width: 1.5,
                                  ),
                                  activeColor: const Color(0xFF0F172A),
                                ),
                              ),
                            ),
                            const DataColumn(
                              label: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'اسم الجهاز والموديل',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                      color: Color(0xFF475467),
                                    ),
                                  ),
                                  SizedBox(width: 4),
                                  Icon(
                                    Icons.arrow_downward,
                                    size: 14,
                                    color: Color(0xFF475467),
                                  ),
                                ],
                              ),
                            ),
                            const DataColumn(
                              label: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'الحالة',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                      color: Color(0xFF475467),
                                    ),
                                  ),
                                  SizedBox(width: 4),
                                  Icon(
                                    Icons.arrow_downward,
                                    size: 14,
                                    color: Color(0xFF475467),
                                  ),
                                ],
                              ),
                            ),
                            const DataColumn(
                              label: Text(
                                'السيريال نمبر',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: Color(0xFF475467),
                                ),
                              ),
                            ),
                            const DataColumn(
                              label: Text(
                                'الموظف / الإدارة',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: Color(0xFF475467),
                                ),
                              ),
                            ),
                            const DataColumn(
                              label: Text(
                                'التصنيفات والوسوم',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: Color(0xFF475467),
                                ),
                              ),
                            ),
                            const DataColumn(
                              label: Text(
                                'الإجراءات',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: Color(0xFF475467),
                                ),
                              ),
                            ),
                          ],
                          rows: filteredDevices.map((device) {
                            final isRowSelected = _selectedIds.contains(
                              device.id,
                            );

                            return DataRow(
                              color: WidgetStateProperty.resolveWith<Color?>((
                                states,
                              ) {
                                if (states.contains(WidgetState.hovered)) {
                                  return const Color(0xFFF9FAFB);
                                }
                                if (isRowSelected) {
                                  return const Color(0xFFF9FAFB);
                                }
                                return Colors.white;
                              }),
                              cells: [
                                // خانة الاختيار Checkbox
                                DataCell(
                                  SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: Checkbox(
                                      value: isRowSelected,
                                      onChanged: (val) {
                                        setState(() {
                                          if (val == true) {
                                            _selectedIds.add(device.id);
                                          } else {
                                            _selectedIds.remove(device.id);
                                          }
                                        });
                                      },
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      side: const BorderSide(
                                        color: Color(0xFFD0D5DD),
                                        width: 1.5,
                                      ),
                                      activeColor: const Color(0xFF0F172A),
                                    ),
                                  ),
                                ),
                                // اسم الجهاز مع الأيقونة والوصف
                                DataCell(
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF2F4F7),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: const Color(0xFFEAECF0),
                                            width: 1,
                                          ),
                                        ),
                                        child: Icon(
                                          _getDeviceIcon(device.deviceType),
                                          size: 20,
                                          color: const Color(0xFF344054),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            device.name,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14,
                                              color: Color(0xFF101828),
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '@${device.brand.toLowerCase()} • ${device.deviceType.split('(').first.trim()}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: Color(0xFF667085),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                // الحالة (Pill Badge with Dot)
                                DataCell(
                                  _buildStatusPill(device.classification),
                                ),
                                // السيريال نمبر
                                DataCell(
                                  Text(
                                    device.serialNumber,
                                    style: const TextStyle(
                                      fontFamily: 'JetBrains Mono',
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF475467),
                                    ),
                                  ),
                                ),
                                // الموظف والإدارة
                                DataCell(
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        device.employee,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF344054),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        device.department,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF667085),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // الوسوم والتصنيفات (Pastel Tags مثل Teams)
                                DataCell(
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _buildTypeTag(device.deviceType),
                                      const SizedBox(width: 6),
                                      _buildBrandTag(device.brand),
                                    ],
                                  ),
                                ),
                                // الإجراءات (حذف وتعديل)
                                DataCell(
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      IconButton(
                                        icon: const Icon(
                                          Icons.delete_outline,
                                          size: 19,
                                          color: Color(0xFF667085),
                                        ),
                                        onPressed: () => _deleteDevice(device),
                                        tooltip: 'حذف',
                                      ),
                                      IconButton(
                                        icon: const Icon(
                                          Icons.edit_outlined,
                                          size: 19,
                                          color: Color(0xFF667085),
                                        ),
                                        onPressed: () =>
                                            _openEditDeviceDialog(device),
                                        tooltip: 'تعديل',
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

                const Divider(height: 1, color: Color(0xFFEAECF0)),

                // شريط الترقيم السفلي (Footer Pagination)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'عرض ${filteredDevices.length} من أصل ${_devices.length} أجهزة',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF475467),
                        ),
                      ),
                      Row(
                        children: [
                          OutlinedButton(
                            onPressed: () {},
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFFD0D5DD)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 8,
                              ),
                            ),
                            child: const Text(
                              'السابق',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF344054),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: () {},
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFFD0D5DD)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 8,
                              ),
                            ),
                            child: const Text(
                              'التالي',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF344054),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
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
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF0F172A)
                : const Color(0xFFD0D5DD),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF344054),
          ),
        ),
      ),
    );
  }

  /// تحديد أيقونة الجهاز بحسب نوعه
  IconData _getDeviceIcon(String type) {
    final lower = type.toLowerCase();
    if (type.contains('محمول') || lower.contains('laptop')) {
      return Icons.laptop_mac_rounded;
    } else if (type.contains('مكتبي') || lower.contains('desktop')) {
      return Icons.desktop_windows_rounded;
    } else if (type.contains('خادم') || lower.contains('server')) {
      return Icons.dns_rounded;
    } else if (type.contains('طابعة') || lower.contains('printer')) {
      return Icons.print_rounded;
    } else if (type.contains('موزع') || lower.contains('switch')) {
      return Icons.router_rounded;
    } else if (type.contains('شاشة') || lower.contains('monitor')) {
      return Icons.tv_rounded;
    }
    return Icons.devices_other_rounded;
  }

  /// شارة الحالة بنمط Untitled UI مع نقطة ملونة
  Widget _buildStatusPill(DeviceClassification classification) {
    final isPersonal = classification == DeviceClassification.personal;
    final bg = isPersonal ? const Color(0xFFECFDF3) : const Color(0xFFF9F5FF);
    final border = isPersonal
        ? const Color(0xFFABEFC6)
        : const Color(0xFFE9D7FE);
    final textColor = isPersonal
        ? const Color(0xFF027A48)
        : const Color(0xFF6941C6);
    final dotColor = isPersonal
        ? const Color(0xFF12B76A)
        : const Color(0xFF7F56D9);
    final label = isPersonal ? 'نشط • عهدة شخصية' : 'مشترك • عهدة قسم';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: border, width: 1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(shape: BoxShape.circle, color: dotColor),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  /// شارات الوسوم الملونة والباستيل (Untitled UI Tags)
  Widget _buildTag(
    String text, {
    required Color bg,
    required Color textColor,
    required Color border,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: border, width: 1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildBrandTag(String brand) {
    Color bg;
    Color text;
    Color border;

    switch (brand.toLowerCase()) {
      case 'apple':
        bg = const Color(0xFFF8F9FA);
        text = const Color(0xFF344054);
        border = const Color(0xFFD0D5DD);
        break;
      case 'dell':
        bg = const Color(0xFFEFF8FF);
        text = const Color(0xFF175CD3);
        border = const Color(0xFFB2DDFF);
        break;
      case 'hp':
        bg = const Color(0xFFF0FDF9);
        text = const Color(0xFF0E7090);
        border = const Color(0xFFA5F3FC);
        break;
      case 'lenovo':
        bg = const Color(0xFFF9F5FF);
        text = const Color(0xFF6941C6);
        border = const Color(0xFFE9D7FE);
        break;
      case 'cisco':
        bg = const Color(0xFFEEF4FF);
        text = const Color(0xFF3538CD);
        border = const Color(0xFFC7D7FE);
        break;
      default:
        bg = const Color(0xFFFEF6EE);
        text = const Color(0xFFB54708);
        border = const Color(0xFFF9DBAF);
    }
    return _buildTag(brand, bg: bg, textColor: text, border: border);
  }

  Widget _buildTypeTag(String type) {
    Color bg;
    Color text;
    Color border;

    final cleanType = type.split('(').first.trim();

    if (type.contains('محمول') || type.toLowerCase().contains('laptop')) {
      bg = const Color(0xFFFDF2FA);
      text = const Color(0xFFC11574);
      border = const Color(0xFFFCCEEE);
    } else if (type.contains('مكتبي') ||
        type.toLowerCase().contains('desktop')) {
      bg = const Color(0xFFECFDF3);
      text = const Color(0xFF027A48);
      border = const Color(0xFFABEFC6);
    } else if (type.contains('خادم') || type.toLowerCase().contains('server')) {
      bg = const Color(0xFFFEF0C7);
      text = const Color(0xFFB54708);
      border = const Color(0xFFFEDF89);
    } else if (type.contains('طابعة') ||
        type.toLowerCase().contains('printer')) {
      bg = const Color(0xFFF0FDF9);
      text = const Color(0xFF0E7090);
      border = const Color(0xFFA5F3FC);
    } else if (type.contains('موزع') || type.toLowerCase().contains('switch')) {
      bg = const Color(0xFFF4F3FF);
      text = const Color(0xFF5925DC);
      border = const Color(0xFFD9D6FE);
    } else {
      bg = const Color(0xFFEFF8FF);
      text = const Color(0xFF175CD3);
      border = const Color(0xFFB2DDFF);
    }

    return _buildTag(cleanType, bg: bg, textColor: text, border: border);
  }
}
