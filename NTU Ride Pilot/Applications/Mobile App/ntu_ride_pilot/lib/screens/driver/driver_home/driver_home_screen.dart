import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/controllers/notification_controller.dart';
import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/start_ride.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/services/common/fcmService/fcm_service.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  _DriverHomeScreenState createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  @override
  void initState() {
    super.initState();
    FCMService.instance.initialize();
    Get.put(ProfileController());
    Get.put(NotificationController());
  }

  @override
  Widget build(BuildContext context) {
    return StartRideScreen();
  }
}
