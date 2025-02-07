import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:rtbivt/model/user.dart';
import 'package:rtbivt/screens/driver/driver_main.dart';
import 'controllers/theme_controller.dart';
import 'themes/light_theme.dart';
import 'themes/dark_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await GetStorage.init();
  await Hive.initFlutter();
  Hive.registerAdapter(UserModelAdapter());

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
          home: DriverMain(),
        );
      },
    );
  }
}
