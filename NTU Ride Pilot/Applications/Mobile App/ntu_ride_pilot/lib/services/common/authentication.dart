import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';
import 'package:ntu_ride_pilot/screens/common/welcome/welcome.dart';
import 'package:ntu_ride_pilot/screens/driver/home/driver_home_screen.dart';
import 'package:ntu_ride_pilot/screens/student/student_home/student_home_screen.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';
import 'package:ntu_ride_pilot/services/student/student_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class AuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<void> isSignedIn() async {
    try {
      User? user = _auth.currentUser;

      if (user == null) {
        Get.off(() => WelcomeScreen());
        return;
      }

      await user.reload();
      user = _auth.currentUser;

      if (user == null) {
        throw FirebaseAuthException(code: 'user-not-found');
      }

      final driverBox = Hive.box<DriverModel>('driverBox');
      final studentBox = Hive.box<StudentModel>('studentBox');

      if (driverBox.containsKey('current_driver')) {
        Get.off(() => DriverHomeScreen());
        return;
      } else if (studentBox.containsKey('current_student')) {
        Get.off(() => StudentHomeScreen());
        return;
      }

      String email = user.email ?? "";
      final DriverService driverService = DriverService();
      final StudentService studentService = StudentService();

      DriverModel? driver = await driverService.getDriverByEmail(email);
      if (driver != null) {
        driverBox.put('current_driver', driver);
        Get.off(() => DriverHomeScreen());
        return;
      }

      StudentModel? student = await studentService.getStudentByEmail(email);
      if (student != null) {
        studentBox.put('current_student', student);
        Get.off(() => StudentHomeScreen());
        return;
      }

      // If no role found in Firestore, force logout
      SnackbarUtil.showError("Login Issue", "User role not found. Please log in again.");
      await logout();

    } on FirebaseAuthException catch (e) {
      if (e.code == 'user-disabled') {
        SnackbarUtil.showError("Account Disabled", "Your account has been disabled by an admin.");
      } else if (e.code == 'user-not-found') {
        SnackbarUtil.showError("Account Not Found", "This account no longer exists.");
      } else {
        SnackbarUtil.showError("Authentication Error", e.message ?? "Something went wrong.");
      }
      await logout();
    } catch (e) {
      SnackbarUtil.showError("Sign-in Check Error", "Unexpected error: ${e.toString()}");
      await logout();
    }
  }


  Future<void> logout() async {
    try {
      final driverBox = Hive.box<DriverModel>('driverBox');
      final studentBox = Hive.box<StudentModel>('studentBox');

      if (driverBox.containsKey('current_driver')) {
        driverBox.delete('current_driver');
      } else if (studentBox.containsKey('current_student')) {
        studentBox.delete('current_student');
      }

      await _auth.signOut();
      Get.off(() => WelcomeScreen());
    } catch (e) {
      SnackbarUtil.showError("Logout Error", "Unexpected error: ${e.toString()}");
    }
  }

  /// Reset password via Firebase
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
