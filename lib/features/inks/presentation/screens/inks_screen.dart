import 'package:flutter/material.dart';
import '../../../../core/theme/theme.dart';
import '../../domain/entities/ink_entity.dart';
import '../widgets/ink_form_dialog.dart';

class InksScreen extends StatefulWidget {
  const InksScreen({super.key});

  @override
  State<InksScreen> createState() => _InksScreenState();
}

class _InksScreenState extends State<InksScreen> {
  String _searchQuery = '';
  InkColor? _selectedColorFilter;
  bool _onlyAlertsFilter = false;
  final Set<String> _selectedIds = {};

  late List<InkEntity> _inks;

  @override
  void initState() {
    super.initState();
    _inks = [
      const InkEntity(
        id: 'INK-001',
        brand: 'HP',
        model: 'HP LaserJet 205A (CF530A)',
        color: InkColor.black,
        quantity: 3,
        alertThreshold: 5,
      ),
      const InkEntity(
        id: 'INK-002',
        brand: 'HP',
        model: 'HP LaserJet 205A (CF531A)',
        color: InkColor.cyan,
        quantity: 8,
        alertThreshold: 4,
      ),
      const InkEntity(
        id: 'INK-003',
        brand: 'HP',
        model: 'HP LaserJet 205A (CF533A)',
        color: InkColor.magenta,
        quantity: 2,
        alertThreshold: 4,
      ),
      const InkEntity(
        id: 'INK-004',
        brand: 'HP',
        model: 'HP LaserJet 205A (CF532A)',
        color: InkColor.yellow,
        quantity: 6,
        alertThreshold: 4,
      ),
      const InkEntity(
        id: 'INK-005',
        brand: 'Canon',
        model: 'Canon 054 H High Yield',
        color: InkColor.black,
        quantity: 12,
        alertThreshold: 5,
      ),
      const InkEntity(
        id: 'INK-006',
        brand: 'Canon',
        model: 'Canon 054 Cyan',
        color: InkColor.cyan,
        quantity: 1,
        alertThreshold: 3,
      ),
      const InkEntity(
        id: 'INK-007',
        brand: 'Epson',
        model: 'EcoTank 103 Magenta',
        color: InkColor.magenta,
        quantity: 15,
        alertThreshold: 6,
      ),
      const InkEntity(
        id: 'INK-008',
        brand: 'Xerox',
        model: 'VersaLink C400 Yellow',
        color: InkColor.yellow,
        quantity: 7,
        alertThreshold: 3,
      ),
    ];
  }

  Future<void> _openAddInkDialog() async {
    final newInk = await InkFormDialog.show(context);
    if (newInk != null) {
      setState(() {
        _inks.insert(0, newInk);
      });
    }
  }

  Future<void> _openEditInkDialog(InkEntity ink) async {
    final updated = await InkFormDialog.show(context, ink: ink);
    if (updated != null) {
      setState(() {
        final idx = _inks.indexWhere((i) => i.id == ink.id);
        if (idx != -1) {
          _inks[idx] = updated;
        }
      });
    }
  }

  void _deleteInk(InkEntity ink) {
    setState(() {
      _inks.removeWhere((i) => i.id == ink.id);
      _selectedIds.remove(ink.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    // تصفية الأحبار بحسب البحث واللون وحالة التنبيه
    final filteredInks = _inks.where((ink) {
      final matchesSearch = _searchQuery.isEmpty ||
          ink.model.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          ink.brand.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          ink.color.label.toLowerCase().contains(_searchQuery.toLowerCase());

      final matchesColor =
          _selectedColorFilter == null || ink.color == _selectedColorFilter;

      final matchesAlert = !_onlyAlertsFilter || ink.isLowStock;

      return matchesSearch && matchesColor && matchesAlert;
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
                    'مخزون وإدارة الأحبار',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.slateDeep,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'متابعة كميات الأحبار الأساسية (CMYK) وتنبيهات انخفاض المخزون عن الحد الأدنى',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.slateMuted,
                    ),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: _openAddInkDialog,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('إضافة حبر جديد'),
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
                                  'بحث باسم الحبر، الموديل، الماركة، أو اللون...',
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

                // أزرار تصفية الألوان والتنبيهات
                _buildFilterChip('الكل', null),
                const SizedBox(width: 6),
                _buildFilterChip('الأسود (K)', InkColor.black),
                const SizedBox(width: 6),
                _buildFilterChip('السماوي (C)', InkColor.cyan),
                const SizedBox(width: 6),
                _buildFilterChip('الأرجواني (M)', InkColor.magenta),
                const SizedBox(width: 6),
                _buildFilterChip('الأصفر (Y)', InkColor.yellow),
                const SizedBox(width: 6),
                _buildAlertFilterChip('تنبيه منخفض'),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // 3. كارد جدول الأحبار (Untitled UI Modern Data Table)
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
                // رأس الجدول داخل الكارد
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
                            'سجل خراطيش الأحبار',
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
                              '${_inks.length} أحبار',
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
                        filteredInks.isNotEmpty &&
                        filteredInks.every((i) => _selectedIds.contains(i.id));
                    final isIndeterminate =
                        filteredInks.any((i) => _selectedIds.contains(i.id)) &&
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
                                          filteredInks.map((i) => i.id),
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
                                    'ماركة وموديل الحبر',
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
                                'الكمية المتوفرة',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                  color: Color(0xFF475467),
                                ),
                              ),
                            ),
                            const DataColumn(
                              label: Text(
                                'حد التنبيه (الأدنى)',
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
                          rows: filteredInks.map((ink) {
                            final isRowSelected = _selectedIds.contains(ink.id);

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
                                // Checkbox
                                DataCell(
                                  SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: Checkbox(
                                      value: isRowSelected,
                                      onChanged: (val) {
                                        setState(() {
                                          if (val == true) {
                                            _selectedIds.add(ink.id);
                                          } else {
                                            _selectedIds.remove(ink.id);
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
                                // ماركة وموديل الحبر
                                DataCell(
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: ink.color.backgroundColor,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: ink.color.borderColor,
                                            width: 1.5,
                                          ),
                                        ),
                                        child: Center(
                                          child: Text(
                                            ink.color.code,
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                              color: ink.color.primaryColor,
                                            ),
                                          ),
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
                                            ink.model,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14,
                                              color: Color(0xFF101828),
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '@${ink.brand.toLowerCase()} • ${ink.color.label.split('(').first.trim()}',
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
                                  _buildStatusPill(ink),
                                ),
                                // الكمية المتوفرة
                                DataCell(
                                  Text(
                                    '${ink.quantity} علبة',
                                    style: TextStyle(
                                      fontFamily: 'JetBrains Mono',
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: ink.isLowStock
                                          ? const Color(0xFFB42318)
                                          : const Color(0xFF475467),
                                    ),
                                  ),
                                ),
                                // حد التنبيه
                                DataCell(
                                  Text(
                                    '${ink.alertThreshold} علب كحد أدنى',
                                    style: const TextStyle(
                                      fontFamily: 'JetBrains Mono',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF667085),
                                    ),
                                  ),
                                ),
                                // الوسوم والتصنيفات (Pastel Tags مثل Teams)
                                DataCell(
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _buildColorTag(ink.color),
                                      const SizedBox(width: 6),
                                      _buildBrandTag(ink.brand),
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
                                        onPressed: () => _deleteInk(ink),
                                        tooltip: 'حذف',
                                      ),
                                      IconButton(
                                        icon: const Icon(
                                          Icons.edit_outlined,
                                          size: 19,
                                          color: Color(0xFF667085),
                                        ),
                                        onPressed: () => _openEditInkDialog(ink),
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
                        'عرض ${filteredInks.length} من أصل ${_inks.length} أحبار',
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

  /// زر تصفية سريع للألوان
  Widget _buildFilterChip(String label, InkColor? value) {
    final isSelected = _selectedColorFilter == value && !_onlyAlertsFilter;
    return InkWell(
      onTap: () {
        setState(() {
          _onlyAlertsFilter = false;
          _selectedColorFilter = value;
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFD0D5DD),
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

  /// زر تصفية التنبيهات
  Widget _buildAlertFilterChip(String label) {
    final isSelected = _onlyAlertsFilter;
    return InkWell(
      onTap: () {
        setState(() {
          _onlyAlertsFilter = !_onlyAlertsFilter;
          _selectedColorFilter = null;
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFD0D5DD),
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

  /// شارة الحالة بنمط Untitled UI مع نقطة ملونة
  Widget _buildStatusPill(InkEntity ink) {
    final isLow = ink.isLowStock;
    final bg = isLow ? const Color(0xFFFEF3F2) : const Color(0xFFECFDF3);
    final border = isLow ? const Color(0xFFFECDCA) : const Color(0xFFABEFC6);
    final textColor = isLow ? const Color(0xFFB42318) : const Color(0xFF027A48);
    final dotColor = isLow ? const Color(0xFFF04438) : const Color(0xFF12B76A);
    final label = isLow ? 'تنبيه • مخزون منخفض' : 'نشط • متوفر كافي';

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
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: dotColor,
            ),
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

  /// وسم لون الحبر بنمط الباستيل
  Widget _buildColorTag(InkColor color) {
    Color bg;
    Color text;
    Color border;

    switch (color) {
      case InkColor.black:
        bg = const Color(0xFFF8F9FA);
        text = const Color(0xFF344054);
        border = const Color(0xFFD0D5DD);
        break;
      case InkColor.cyan:
        bg = const Color(0xFFEFF8FF);
        text = const Color(0xFF0284C7);
        border = const Color(0xFFBAE6FD);
        break;
      case InkColor.magenta:
        bg = const Color(0xFFFDF2FA);
        text = const Color(0xFFC11574);
        border = const Color(0xFFFCCEEE);
        break;
      case InkColor.yellow:
        bg = const Color(0xFFFEFCE8);
        text = const Color(0xFFCA8A04);
        border = const Color(0xFFFEF08A);
        break;
    }

    return _buildTag(color.label, bg: bg, textColor: text, border: border);
  }

  /// وسم الماركة بنمط الباستيل
  Widget _buildBrandTag(String brand) {
    Color bg;
    Color text;
    Color border;

    switch (brand.toLowerCase()) {
      case 'hp':
        bg = const Color(0xFFF0FDF9);
        text = const Color(0xFF0E7090);
        border = const Color(0xFFA5F3FC);
        break;
      case 'canon':
        bg = const Color(0xFFEFF8FF);
        text = const Color(0xFF175CD3);
        border = const Color(0xFFB2DDFF);
        break;
      case 'epson':
        bg = const Color(0xFFEEF4FF);
        text = const Color(0xFF3538CD);
        border = const Color(0xFFC7D7FE);
        break;
      case 'xerox':
        bg = const Color(0xFFF9F5FF);
        text = const Color(0xFF6941C6);
        border = const Color(0xFFE9D7FE);
        break;
      case 'brother':
        bg = const Color(0xFFF4F3FF);
        text = const Color(0xFF5925DC);
        border = const Color(0xFFD9D6FE);
        break;
      default:
        bg = const Color(0xFFFEF6EE);
        text = const Color(0xFFB54708);
        border = const Color(0xFFF9DBAF);
    }
    return _buildTag(brand, bg: bg, textColor: text, border: border);
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
}
