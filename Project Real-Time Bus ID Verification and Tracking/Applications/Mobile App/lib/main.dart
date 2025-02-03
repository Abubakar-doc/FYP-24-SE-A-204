import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:rtbivt/screens/driver/driver_home/driver_home_screen.dart';
import 'controllers/theme_controller.dart';
import 'themes/light_theme.dart';
import 'themes/dark_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await GetStorage.init();

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  MyApp({super.key});

  final ThemeController themeController = Get.put(ThemeController());

  @override
  Widget build(BuildContext context) {
    return GetX<ThemeController>(
      builder: (controller) {
        return GetMaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Flutter GetX Theme',
          theme: lightTheme,
          darkTheme: darkTheme,
          themeMode:
              controller.themeMode.value,
          home: DriverHomeScreen(),
        );
      },
    );
  }
}
