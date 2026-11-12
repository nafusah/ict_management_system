import 'package:flutter/material.dart';

class NavItem {
  final String title;
  final IconData icon;
  final String route;
  final int? badgeCount;

  const NavItem({
    required this.title,
    required this.icon,
    required this.route,
    this.badgeCount,
  });
}

