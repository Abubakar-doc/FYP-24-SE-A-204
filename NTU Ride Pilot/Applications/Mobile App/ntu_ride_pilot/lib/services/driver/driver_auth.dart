import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/driver/home/driver_home_screen.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class DriverAuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DriverService _driverService = DriverService();

  Future<void> signIn(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      await _driverService.saveDriverToHive(email);
      Get.off(() => DriverHomeScreen(),
          transition: Transition.rightToLeft);
    } catch (e) {
      SnackbarUtil.showError("Authentication Error", e.toString());
    }
  }
}
