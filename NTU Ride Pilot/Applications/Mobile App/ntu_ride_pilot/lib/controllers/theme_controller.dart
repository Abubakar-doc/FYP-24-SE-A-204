import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:get_storage/get_storage.dart';

class ThemeController extends GetxController {
  final _box = GetStorage();
  var themeMode = ThemeMode.system.obs; // Default to system theme

  @override
  void onInit() {
    super.onInit();
    _loadTheme();
  }

  void _loadTheme() {
    String? savedTheme = _box.read('themeMode');
    if (savedTheme == 'light') {
      themeMode.value = ThemeMode.light;
    } else if (savedTheme == 'dark') {
      themeMode.value = ThemeMode.dark;
    } else {
      themeMode.value = ThemeMode.system; // Default to system
    }
  }

  void setTheme(ThemeMode mode) async {
    themeMode.value = mode;
    await _box.write('themeMode', mode.toString().split('.').last);
    Get.changeThemeMode(mode);
  }
}
