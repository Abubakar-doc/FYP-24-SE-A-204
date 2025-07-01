import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/notification_controller.dart';
import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
import 'package:ntu_ride_pilot/screens/student/ride/view_ride.dart';
import 'package:ntu_ride_pilot/services/common/fcmService/fcm_service.dart';

class StudentHomeScreen extends StatefulWidget {
  const StudentHomeScreen({super.key});

  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {

  @override
  void initState() {
    super.initState();
    FCMService.instance.initialize();
    Get.put(ProfileController());
    Get.put(NotificationController());
  }

  @override
  Widget build(BuildContext context) {
    return ViewRideScreen();
  }
}
