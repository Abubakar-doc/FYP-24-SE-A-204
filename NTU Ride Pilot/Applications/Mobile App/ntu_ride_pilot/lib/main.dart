import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';
import 'package:ntu_ride_pilot/screens/common/home/home_screen.dart';
import 'package:ntu_ride_pilot/services/common/common_auth.dart';
import 'controllers/theme_controller.dart';
import 'themes/light_theme.dart';
import 'themes/dark_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await GetStorage.init();
  Get.put(AuthService());
  await Hive.initFlutter();
  Hive.registerAdapter(DriverModelAdapter());
  Hive.registerAdapter(StudentModelAdapter());
  Hive.registerAdapter(BusCardModelAdapter());
  Hive.registerAdapter(RideModelAdapter());
  if (!Hive.isBoxOpen('driverBox')) {
    await Hive.openBox<DriverModel>('driverBox');
  }
  if (!Hive.isBoxOpen('studentBox')) {
    await Hive.openBox<StudentModel>('studentBox');
  }
  if (!Hive.isBoxOpen('bus_cardsBox')) {
    await Hive.openBox<BusCardModel>('bus_cardsBox');
  }
  if (!Hive.isBoxOpen('rideBox')) {
    await Hive.openBox<RideModel>('rideBox');
  }
  await mapbox_setup();
  runApp(MyApp());
}

Future<void> mapbox_setup() async {
  MapboxOptions.setAccessToken("pk.eyJ1IjoiYTEzdTEzYWthciIsImEiOiJjbTZ1enk1OWQwMmk0MmpzY2hvZW9hdm1yIn0.MUvJhxa9kuRSvus6oclMMw");
}



class MyApp extends StatelessWidget {
  MyApp({super.key});

  final ThemeController themeController = Get.put(ThemeController());

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      preCacheImages(context);
    });
    return GetX<ThemeController>(
      builder: (controller) {
        return GetMaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'NTU RIDE PILOT',
          theme: lightTheme,
          darkTheme: darkTheme,
          themeMode:
              controller.themeMode.value,
          home: HomeScreen(),
        );
      },
    );
  }
  void preCacheImages(BuildContext context) {
    precacheImage(AssetImage('assets/pictures/logoDark.jpg'), context);
    precacheImage(AssetImage('assets/pictures/logoLight.jpg'), context);
  }
}
