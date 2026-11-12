import 'package:flutter/material.dart';
import '../../../../core/theme/theme.dart';
import '../../domain/entities/device_entity.dart';

/// نافذة منبثقة لإضافة أو تعديل جهاز (Device Form Dialog)
class DeviceFormDialog extends StatefulWidget {
  final DeviceEntity? device;

  const DeviceFormDialog({super.key, this.device});

  static Future<DeviceEntity?> show(BuildContext context, {DeviceEntity? device}) {
    return showDialog<DeviceEntity>(
      context: context,
      barrierDismissible: false,
      builder: (context) => DeviceFormDialog(device: device),
    );
  }

  @override
  State<DeviceFormDialog> createState() => _DeviceFormDialogState();
}

class _DeviceFormDialogState extends State<DeviceFormDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _serialController;
  late TextEditingController _departmentController;
  late TextEditingController _employeeController;

  late String _selectedBrand;
  late String _selectedType;
  late DeviceClassification _classification;

  final List<String> _brands = const ['Dell', 'HP', 'Lenovo', 'Apple', 'Cisco', 'Samsung', 'أخرى'];
  final List<String> _types = const [
    'حاسوب محمول (Laptop)',
    'حاسوب مكتبي (Desktop)',
    'خادم شبكي (Server)',
    'طابعة شبكية (Printer)',
    'موزع شبكة (Switch)',
    'شاشة عرض (Monitor)',
    'أخرى',
  ];

  @override
  void initState() {
    super.initState();
    final d = widget.device;
    _nameController = TextEditingController(text: d?.name ?? '');
    _serialController = TextEditingController(text: d?.serialNumber ?? '');
    _departmentController = TextEditingController(text: d?.department ?? '');
    _employeeController = TextEditingController(text: d?.employee ?? '');

    _selectedBrand = d?.brand ?? _brands.first;
    _selectedType = d?.deviceType ?? _types.first;
    _classification = d?.classification ?? DeviceClassification.personal;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _serialController.dispose();
    _departmentController.dispose();
    _employeeController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final newDevice = DeviceEntity(
      id: widget.device?.id ?? 'DEV-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
      name: _nameController.text.trim(),
      serialNumber: _serialController.text.trim(),
      deviceType: _selectedType,
      brand: _selectedBrand,
      department: _departmentController.text.trim(),
      employee: _employeeController.text.trim(),
      classification: _classification,
    );

    Navigator.of(context).pop(newDevice);
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.device != null;

    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.roundedLg,
      ),
      child: Container(
        width: 580,
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. رأس النافذة
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.signalYellow,
                          borderRadius: AppRadius.rounded,
                        ),
                        child: Icon(
                          isEditing ? Icons.edit_note : Icons.add_to_queue,
                          color: AppColors.textOnYellow,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        isEditing ? 'تعديل بيانات الجهاز' : 'إضافة جهاز جديد للسجل',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.slateDeep,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20, color: AppColors.slateMuted),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'أدخل تفاصيل الجهاز والمواصفات والإدارة المسند إليها بدقة',
                style: TextStyle(fontSize: 12, color: AppColors.slateMuted),
              ),

              const Divider(height: AppSpacing.xl, color: AppColors.slateBorder),

              // 2. حقول الإدخال
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // اسم الجهاز
                      _buildLabel('اسم الجهاز والموديل'),
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          hintText: 'مثال: ThinkPad X1 Carbon Gen 11',
                        ),
                        validator: (v) => (v == null || v.trim().isEmpty) ? 'الرجاء إدخال اسم الجهاز' : null,
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // الماركة + نوع الجهاز (في سطر واحد)
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('ماركة الجهاز'),
                                DropdownButtonFormField<String>(
                                  value: _selectedBrand,
                                  decoration: const InputDecoration(),
                                  items: _brands.map((b) => DropdownMenuItem(value: b, child: Text(b))).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _selectedBrand = val);
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('نوع الجهاز'),
                                DropdownButtonFormField<String>(
                                  value: _selectedType,
                                  decoration: const InputDecoration(),
                                  items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 12)))).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _selectedType = val);
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // السيريال نمبر
                      _buildLabel('الرقم التسلسلي (Serial Number)'),
                      TextFormField(
                        controller: _serialController,
                        style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 13),
                        decoration: const InputDecoration(
                          hintText: 'مثال: PF-4X8910',
                        ),
                        validator: (v) => (v == null || v.trim().isEmpty) ? 'الرجاء إدخال السيريال نمبر' : null,
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // الإدارة + الموظف المستلم
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('الإدارة التابع لها'),
                                TextFormField(
                                  controller: _departmentController,
                                  decoration: const InputDecoration(
                                    hintText: 'مثال: إدارة تقنية المعلومات',
                                  ),
                                  validator: (v) => (v == null || v.trim().isEmpty) ? 'الرجاء إدخال الإدارة' : null,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('الموظف / المستلم'),
                                TextFormField(
                                  controller: _employeeController,
                                  decoration: const InputDecoration(
                                    hintText: 'مثال: محمد الحملي (أو مشترك)',
                                  ),
                                  validator: (v) => (v == null || v.trim().isEmpty) ? 'الرجاء تحديد المستلم' : null,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // تصنيف الجهاز (شخصي / جماعي)
                      _buildLabel('تصنيف استخدام الجهاز'),
                      Row(
                        children: [
                          Expanded(
                            child: _buildClassificationOption(
                              title: 'جهاز شخصي (عهدة فردية)',
                              subtitle: 'مخصص لموظف واحد فقط',
                              value: DeviceClassification.personal,
                              icon: Icons.person_outline,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: _buildClassificationOption(
                              title: 'جهاز جماعي (مشترك)',
                              subtitle: 'مخصص لقسم أو سيرفر أو طابعة مشتركة',
                              value: DeviceClassification.shared,
                              icon: Icons.group_outlined,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.xl),

              // 3. أزرار التحكم في أسفل النافذة
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                    child: const Text('إلغاء'),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  ElevatedButton.icon(
                    onPressed: _submit,
                    icon: const Icon(Icons.check, size: 18),
                    label: Text(isEditing ? 'حفظ التعديلات' : 'إضافة الجهاز'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.signalYellow,
                      foregroundColor: AppColors.textOnYellow,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      elevation: 0,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: AppColors.slateDark,
        ),
      ),
    );
  }

  Widget _buildClassificationOption({
    required String title,
    required String subtitle,
    required DeviceClassification value,
    required IconData icon,
  }) {
    final isSelected = _classification == value;
    return InkWell(
      onTap: () => setState(() => _classification = value),
      borderRadius: AppRadius.rounded,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFEFCE8) : AppColors.slateCanvas,
          borderRadius: AppRadius.rounded,
          border: Border.all(
            color: isSelected ? AppColors.signalYellow : AppColors.slateBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? AppColors.slateDeep : AppColors.slateMuted,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                      color: AppColors.slateDeep,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 10, color: AppColors.slateMuted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
