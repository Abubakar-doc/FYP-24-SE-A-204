import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/screens/driver/home/driver_home_screen.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class DriverAuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DriverService _driverService = DriverService();

  Future<void> signIn(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      Get.off(() => DriverHomeScreen());
      await _saveDriverToHive(email);
    } catch (e) {
      SnackbarUtil.showError("Authentication Error", e.toString());
    }
  }

  Future<void> _saveDriverToHive(String email) async {
    try {
      var driverDoc = await _driverService.getDriverByEmail(email);
      if (driverDoc != null) {
        final box = Hive.box<DriverModel>('driverBox');
        box.put('current_driver', driverDoc);
      } else {
        SnackbarUtil.showError("Sign-in Failed", "Driver not found.");
      }
    } catch (e) {
      SnackbarUtil.showError("Error Saving Driver", e.toString());
    }
  }

  DriverModel? getCurrentDriver() {
    final box = Hive.box('driverBox');
    return box.get('current_driver') as DriverModel?;
  }
}
