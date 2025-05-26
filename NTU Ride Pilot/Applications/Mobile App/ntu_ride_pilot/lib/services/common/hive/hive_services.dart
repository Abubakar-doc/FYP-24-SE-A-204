import 'package:hive_flutter/hive_flutter.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';

class HiveService {
  static Future<void> init() async {
    await Hive.initFlutter();

    // Register adapters
    Hive.registerAdapter(DriverModelAdapter());
    Hive.registerAdapter(StudentModelAdapter());
    Hive.registerAdapter(BusCardModelAdapter());
    Hive.registerAdapter(RideModelAdapter());
    Hive.registerAdapter(NotificationModelAdapter());

    // Open boxes and clear notifications on start
    await Hive.openBox<NotificationModel>('notificationBox');
    await Hive.box<NotificationModel>('notificationBox').clear();

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
  }
}
