import 'package:flutter/material.dart';
import '../../../../core/theme/theme.dart';
import '../../domain/entities/ink_entity.dart';

/// نافذة منبثقة لإضافة أو تعديل حبر في المخزون
class InkFormDialog extends StatefulWidget {
  final InkEntity? ink;

  const InkFormDialog({super.key, this.ink});

  static Future<InkEntity?> show(BuildContext context, {InkEntity? ink}) {
    return showDialog<InkEntity>(
      context: context,
      barrierDismissible: false,
      builder: (context) => InkFormDialog(ink: ink),
    );
  }

  @override
  State<InkFormDialog> createState() => _InkFormDialogState();
}

class _InkFormDialogState extends State<InkFormDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _modelController;
  late TextEditingController _quantityController;
  late TextEditingController _thresholdController;
  late TextEditingController _customBrandController;

  late String _selectedBrand;
  late InkColor _selectedColor;

  final List<String> _brands = const [
    'HP',
    'Canon',
    'Epson',
    'Xerox',
    'Brother',
    'Ricoh',
    'أخرى',
  ];

  @override
  void initState() {
    super.initState();
    final ink = widget.ink;
    _modelController = TextEditingController(text: ink?.model ?? '');
    _quantityController = TextEditingController(
      text: ink != null ? '${ink.quantity}' : '10',
    );
    _thresholdController = TextEditingController(
      text: ink != null ? '${ink.alertThreshold}' : '5',
    );
    _customBrandController = TextEditingController();

    if (ink != null && !_brands.contains(ink.brand)) {
      _selectedBrand = 'أخرى';
      _customBrandController.text = ink.brand;
    } else {
      _selectedBrand = ink?.brand ?? _brands.first;
    }

    _selectedColor = ink?.color ?? InkColor.black;
  }

  @override
  void dispose() {
    _modelController.dispose();
    _quantityController.dispose();
    _thresholdController.dispose();
    _customBrandController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final brand = _selectedBrand == 'أخرى'
        ? _customBrandController.text.trim()
        : _selectedBrand;

    final quantity = int.tryParse(_quantityController.text.trim()) ?? 0;
    final threshold = int.tryParse(_thresholdController.text.trim()) ?? 0;

    final newInk = InkEntity(
      id:
          widget.ink?.id ??
          'INK-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
      brand: brand,
      model: _modelController.text.trim(),
      color: _selectedColor,
      quantity: quantity,
      alertThreshold: threshold,
    );

    Navigator.of(context).pop(newInk);
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.ink != null;

    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 540,
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
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.signalYellow,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.format_color_fill,
                          color: AppColors.textOnYellow,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isEditing
                                ? 'تعديل بيانات الحبر'
                                : 'إضافة حبر جديد للمخزون',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF101828),
                            ),
                          ),
                          const Text(
                            'حدد ماركة الحبر، اللون، والكميات لتفعيل التنبيه التلقائي',
                            style: TextStyle(
                              fontSize: 12,
                              color: Color(0xFF667085),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.close,
                      size: 20,
                      color: Color(0xFF667085),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),

              const Divider(height: AppSpacing.xl, color: Color(0xFFEAECF0)),

              // 2. حقول الإدخال
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ماركة الحبر + موديل الحبر
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // ماركة الحبر (Select)
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('ماركة الحبر'),
                                DropdownButtonFormField<String>(
                                  value: _selectedBrand,
                                  isExpanded: true,
                                  decoration: const InputDecoration(),
                                  items: _brands
                                      .map(
                                        (b) => DropdownMenuItem(
                                          value: b,
                                          child: Text(
                                            b,
                                            style: const TextStyle(
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      )
                                      .toList(),
                                  onChanged: (val) {
                                    if (val != null)
                                      setState(() => _selectedBrand = val);
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          // موديل الحبر / الرمز
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel(
                                  'موديل الحبر / الرمز (Model / S/N)',
                                ),
                                TextFormField(
                                  controller: _modelController,
                                  decoration: const InputDecoration(
                                    hintText: 'مثال: HP 205A (CF530A)',
                                  ),
                                  validator: (v) =>
                                      (v == null || v.trim().isEmpty)
                                      ? 'الرجاء إدخال موديل الحبر'
                                      : null,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // إدخال يدوي للماركة إذا تم اختيار "أخرى"
                      if (_selectedBrand == 'أخرى') ...[
                        const SizedBox(height: AppSpacing.md),
                        _buildLabel('كتابة اسم الماركة يدوياً'),
                        TextFormField(
                          controller: _customBrandController,
                          decoration: const InputDecoration(
                            hintText: 'اكتب اسم الماركة هنا...',
                          ),
                          validator: (v) =>
                              (_selectedBrand == 'أخرى' &&
                                  (v == null || v.trim().isEmpty))
                              ? 'الرجاء إدخال اسم الماركة'
                              : null,
                        ),
                      ],

                      const SizedBox(height: AppSpacing.md),

                      // لون الحبر (الأسود K - السماوي C - الأرجواني M - الأصفر Y)
                      _buildLabel('لون الحبر (CMYK Color)'),
                      DropdownButtonFormField<InkColor>(
                        value: _selectedColor,
                        isExpanded: true,
                        decoration: const InputDecoration(),
                        items: InkColor.values.map((color) {
                          return DropdownMenuItem<InkColor>(
                            value: color,
                            child: Row(
                              children: [
                                Container(
                                  width: 14,
                                  height: 14,
                                  decoration: BoxDecoration(
                                    color: color.primaryColor,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: color == InkColor.yellow
                                          ? const Color(0xFFCA8A04)
                                          : Colors.transparent,
                                      width: 1,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  color.label,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF101828),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedColor = val);
                        },
                      ),

                      const SizedBox(height: AppSpacing.md),

                      // الكمية الحالية + حد التنبيه
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // الكمية الحالية المتوفرة
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('الكمية الحالية المتوفرة'),
                                TextFormField(
                                  controller: _quantityController,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    hintText: 'مثال: 15',
                                    suffixText: 'علبة / خرطوشة',
                                  ),
                                  validator: (v) {
                                    if (v == null || v.trim().isEmpty)
                                      return 'أدخل الكمية';
                                    if (int.tryParse(v.trim()) == null)
                                      return 'يجب أن يكون رقماً';
                                    return null;
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          // حد التنبيه
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('حد التنبيه (عند الوصول إليه)'),
                                TextFormField(
                                  controller: _thresholdController,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    hintText: 'مثال: 5',
                                    suffixText: 'علب كحد أدنى',
                                  ),
                                  validator: (v) {
                                    if (v == null || v.trim().isEmpty)
                                      return 'أدخل حد التنبيه';
                                    if (int.tryParse(v.trim()) == null)
                                      return 'يجب أن يكون رقماً';
                                    return null;
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: AppSpacing.sm),

                      // صندوق توضيحي لطريقة عمل التنبيه
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEFCE8),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: const Color(0xFFFEF08A),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.notifications_active_outlined,
                              size: 18,
                              color: Color(0xFF854D0E),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'تنبيه المخزون: عند انخفاض الكمية الحالية لتصل إلى أو تقل عن حد التنبيه، سيظهر مؤشر تحذيري فوري باللون الأحمر يلفت الانتباه لضرورة إعادة الطلب.',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.amber.shade900,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.xl),

              // 3. أزرار التحكم
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                    child: const Text('إلغاء'),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  ElevatedButton.icon(
                    onPressed: _submit,
                    icon: const Icon(Icons.check, size: 18),
                    label: Text(
                      isEditing ? 'حفظ التعديلات' : 'إضافة الحبر للمخزون',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.signalYellow,
                      foregroundColor: AppColors.textOnYellow,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
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
          color: Color(0xFF344054),
        ),
      ),
    );
  }
}
