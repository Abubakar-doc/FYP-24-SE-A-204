import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:ntu_ride_pilot/screens/common/home/home_screen.dart';
import 'package:ntu_ride_pilot/services/common/authentication/common_auth.dart';
import 'package:ntu_ride_pilot/services/common/hive/hive_services.dart';
import 'package:ntu_ride_pilot/services/common/media/media_service.dart';
import 'package:ntu_ride_pilot/services/common/notification/notification_service.dart';
import 'package:ntu_ride_pilot/services/ride/live_location.dart';
import 'controllers/notification_controller.dart';
import 'controllers/theme_controller.dart';
import 'themes/light_theme.dart';
import 'themes/dark_theme.dart';
import 'package:flutter/services.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await GetStorage.init();
  await NotificationService().init();
  Get.put(AuthService());
  await HiveService.init();
  await LocationService.init();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  MyApp({super.key});

  final ThemeController themeController = Get.put(ThemeController());
  final NotificationController notificationController = Get.put(NotificationController());
  final MediaService mediaService = MediaService();

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      mediaService.preCacheImages(context);
    });
    return GetX<ThemeController>(
      builder: (controller) {
        return GetMaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'NTU RIDE PILOT',
          theme: lightTheme,
          darkTheme: darkTheme,
          themeMode: controller.themeMode.value,
          home: HomeScreen(),
        );
      },
    );
  }
}
