import 'package:flutter/material.dart';
import '../theme/theme.dart';
import '../utils/breakpoints.dart';

class MainLayout extends StatefulWidget {
  final Widget child;

  const MainLayout({
    super.key,
    required this.child,
  });

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _selectedIndex = 0;

  // قائمة عناصر التنقل الأساسية
  final List<({String title, IconData icon})> _navItems = const [
    // (title: 'لوحة التحكم', icon: Icons.dashboard_outlined),
    (title: 'الأصول والأجهزة', icon: Icons.devices_outlined),
    // (title: 'الخوادم والبنية التحتية', icon: Icons.dns_outlined),
    // (title: 'تذاكر الدعم', icon: Icons.confirmation_number_outlined),
    // (title: 'إعدادات النظام', icon: Icons.settings_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = Breakpoints.isDesktop(context);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.slateCanvas,

      // في الشاشات الصغيرة والمتوسطة: تصبح القائمة الجانبية Drawer منسدل
      drawer: isDesktop
          ? null
          : Drawer(
              child: _buildSidebar(),
            ),

      body: Row(
        children: [
          // 1. القائمة الجانبية الثابتة (تظهر فقط في شاشات الـ Desktop)
          if (isDesktop) ...[
            _buildSidebar(),
          ],

          // 2. مساحة العمل الرئيسية (Topbar + المحتوى)
          Expanded(
            child: Column(
              children: [
                // الشريط العلوي (Topbar)
                Container(
                  height: AppSpacing.topbarHeight, // 64px
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(
                      bottom: BorderSide(color: AppColors.slateBorder, width: 1),
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: Row(
                    children: [
                      // زر القائمة (يظهر فقط في الشاشات الصغيرة لفتح الـ Drawer)
                      if (!isDesktop) ...[
                        IconButton(
                          icon: const Icon(Icons.menu, color: AppColors.slateDeep),
                          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                          tooltip: 'فتح القائمة',
                        ),
                        const SizedBox(width: AppSpacing.sm),
                      ],

                      // عنوان الصفحة الحالية
                      Text(
                        _navItems[_selectedIndex].title,
                        style: const TextStyle(
                          color: AppColors.slateDeep,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),

                      const Spacer(),

                      // شريط البحث السريع (يظهر في الشاشات المتوسطة والكبيرة)
                      if (!Breakpoints.isMobile(context)) ...[
                        Container(
                          width: 260,
                          height: 38,
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          decoration: BoxDecoration(
                            color: AppColors.slateLight,
                            borderRadius: AppRadius.rounded,
                            border: Border.all(color: AppColors.slateBorderSecondary, width: 1),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.search,
                                size: 18,
                                color: AppColors.slatePlaceholder,
                              ),
                              const SizedBox(width: 8),
                              const Expanded(
                                child: Text(
                                  'بحث سريع في الأجهزة...',
                                  style: TextStyle(
                                    color: AppColors.slatePlaceholder,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  border: Border.all(color: AppColors.slateBorder, width: 1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  '⌘K',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.slateMuted,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                      ],

                      // جرس التنبيهات مع نقطة التنبيه
                      Stack(
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.notifications_none_outlined,
                              color: AppColors.slateDark,
                              size: 22,
                            ),
                            onPressed: () {},
                            tooltip: 'الإشعارات',
                          ),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: AppSpacing.sm),

                      // بطاقة الملف الشخصي (Profile Chip)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.slateCanvas,
                          borderRadius: AppRadius.roundedFull,
                          border: Border.all(color: AppColors.slateBorder, width: 1),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 13,
                              backgroundColor: AppColors.slateDeep,
                              child: const Text(
                                'IT',
                                style: TextStyle(
                                  color: AppColors.signalYellow,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                            if (isDesktop) ...[
                              const SizedBox(width: 8),
                              const Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'مدير النظام',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: AppColors.slateDeep,
                                    ),
                                  ),
                                  Text(
                                    'Admin',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: AppColors.slateMuted,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.keyboard_arrow_down,
                                size: 16,
                                color: AppColors.slateMuted,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // محتوى الصفحة الحالية (Content Area)
                Expanded(
                  child: widget.child,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// ودجت بناء القائمة الجانبية (Sidebar)
  Widget _buildSidebar() {
    return Container(
      width: AppSpacing.sidebarWidth, // 260px
      clipBehavior: Clip.antiAlias,
      decoration: const BoxDecoration(
        color: AppColors.slateDeep, // #0F172A
        // إضافة راديوس (Radius) للطرف الداخلي من السايد بار المواجه للمحتوى
        borderRadius: BorderRadiusDirectional.only(
          topEnd: Radius.circular(16),
          bottomEnd: Radius.circular(16),
        ),
        border: BorderDirectional(
          end: BorderSide(color: AppColors.slateStructural, width: 1),
        ),
      ),
      child: Column(
        children: [
          // رأس القائمة الجانبية (Brand Header)
          Container(
            height: AppSpacing.topbarHeight, // 64px
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AppColors.slateStructural, width: 1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.signalYellow,
                    borderRadius: AppRadius.rounded,
                  ),
                  child: const Icon(
                    Icons.bolt,
                    color: AppColors.textOnYellow,
                    size: 20,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                const Expanded(
                  child: Text(
                    'KINETIC AMBER',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.sm),

          // عناصر التنقل (Navigation Items)
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemCount: _navItems.length,
              separatorBuilder: (_, __) => const SizedBox(height: 2),
              itemBuilder: (context, index) {
                final item = _navItems[index];
                final isSelected = _selectedIndex == index;

                return InkWell(
                  onTap: () {
                    setState(() {
                      _selectedIndex = index;
                    });
                    // إغلاق الـ Drawer إذا كنا في وضع الموبايل
                    if (!Breakpoints.isDesktop(context)) {
                      Navigator.of(context).pop();
                    }
                  },
                  child: Container(
                    height: 44,
                    margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.slateStructural : Colors.transparent,
                      borderRadius: AppRadius.roundedLg, // 8px
                    ),
                    child: Row(
                      children: [
                        // مؤشر التحديد الرأسي باللون الأصفر الإشاري (3px)
                        Container(
                          width: 3,
                          height: 24,
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.signalYellow : Colors.transparent,
                            borderRadius: AppRadius.roundedSm,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Icon(
                          item.icon,
                          size: 20,
                          color: isSelected ? Colors.white : AppColors.slatePlaceholder,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            item.title,
                            style: TextStyle(
                              color: isSelected ? Colors.white : AppColors.slatePlaceholder,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                              fontSize: 13,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // تذييل القائمة الجانبية (System Status Footer)
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: AppColors.slateStructural, width: 1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981), // أخضر مؤشر التشغيل
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                const Expanded(
                  child: Text(
                    'الخوادم تعمل (99.9%)',
                    style: TextStyle(
                      color: AppColors.slatePlaceholder,
                      fontSize: 11,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
