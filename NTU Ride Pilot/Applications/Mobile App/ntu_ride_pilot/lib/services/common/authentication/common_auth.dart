import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';
import 'package:ntu_ride_pilot/screens/common/welcome/welcome.dart';
import 'package:ntu_ride_pilot/screens/driver/home/driver_home_screen.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/ride_control.dart';
import 'package:ntu_ride_pilot/screens/student/student_home/student_home_screen.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';
import 'package:ntu_ride_pilot/services/student/student_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class AuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? get currentUserEmail => FirebaseAuth.instance.currentUser?.email;

  Future<void> isSignedIn(BuildContext context) async {
    try {
      User? user = _auth.currentUser;

      if (user == null) {
        Get.offAll(() => WelcomeScreen());
        return;
      }

      await user.reload();
      user = _auth.currentUser;

      if (user == null) {
        throw FirebaseAuthException(code: 'user-not-found');
      }

      final driverBox = Hive.box<DriverModel>('driverBox');
      final studentBox = Hive.box<StudentModel>('studentBox');

      // If a driver is already logged in, check if there's an active ride.
      if (driverBox.containsKey('current_driver')) {
        var rideBox = await Hive.openBox<RideModel>('rides');
        if (rideBox.containsKey('currentRide')) {
          Get.offAll(() => RideControlScreen());
        } else {
          Get.offAll(() => DriverHomeScreen());
        }
        return;
      } else if (studentBox.containsKey('current_student')) {
        Get.offAll(() => StudentHomeScreen());
        return;
      }

      String email = user.email ?? "";
      final DriverService driverService = DriverService();
      final StudentService studentService = StudentService();

      DriverModel? driver = await driverService.getDriverByEmail(email);
      if (driver != null) {
        driverBox.put('current_driver', driver);
        var rideBox = await Hive.openBox<RideModel>('rides');
        if (rideBox.containsKey('currentRide')) {
          Get.offAll(() => RideControlScreen());
        } else {
          Get.offAll(() => DriverHomeScreen());
        }
        return;
      }

      StudentModel? student = await studentService.getStudentByEmail(email);
      if (student != null) {
        studentBox.put('current_student', student);
        Get.offAll(() => StudentHomeScreen());
        return;
      }
      SnackbarUtil.showError(
          "Login Issue", "User role not found. Please log in again.");
    } on FirebaseAuthException catch (e) {
      if (e.code == 'user-disabled') {
        SnackbarUtil.showError(
            "Account Disabled", "Your account has been disabled by an admin.");
      } else if (e.code == 'user-not-found') {
        SnackbarUtil.showError(
            "Account Not Found", "This account no longer exists.");
      } else {
        SnackbarUtil.showError(
            "Authentication Error", e.message ?? "Something went wrong.");
      }
    } catch (e) {
      // SnackbarUtil.showError(
      //     "Sign-in Check Error", "Unexpected error: ${e.toString()}");
    }
  }

  Future<void> logout(BuildContext context) async {
    try {
      // Delete the 'rides' box if it exists.
      if (Hive.isBoxOpen('rides')) {
        final rideBox = Hive.box<RideModel>('rides');
        await rideBox.clear();
        // await rideBox.close();
        await Hive.deleteBoxFromDisk('rides');
      } else if (await Hive.boxExists('rides')) {
        final rideBox = await Hive.openBox<RideModel>('rides');
        await rideBox.clear();
        // await rideBox.close();
        await Hive.deleteBoxFromDisk('rides');
      }

      // Delete the 'bus_cards' box if it exists.
      if (Hive.isBoxOpen('bus_cards')) {
        final busCardBox = Hive.box<BusCardModel>('bus_cards');
        await busCardBox.clear();
        // await busCardBox.close();
        await Hive.deleteBoxFromDisk('bus_cards');
      } else if (await Hive.boxExists('bus_cards')) {
        final busCardBox = await Hive.openBox<BusCardModel>('bus_cards');
        await busCardBox.clear();
        // await busCardBox.close();
        await Hive.deleteBoxFromDisk('bus_cards');
      }

      // Sign out from Firebase and navigate to the welcome screen.
      await FirebaseAuth.instance.signOut();
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => WelcomeScreen()),
        (Route<dynamic> route) => false, // This removes all previous routes
      );
    } catch (e) {
      SnackbarUtil.showError(
          "Logout Error", "Unexpected error: ${e.toString()}");
    }
  }

  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
      // Get.back();
    } on FirebaseAuthException catch (e) {
      SnackbarUtil.showError("Error", e.message ?? "Something went wrong.");
    } catch (e) {
      SnackbarUtil.showError("Error", "Unexpected error: ${e.toString()}");
    }
  }
}
