import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/driver/home/driver_home_screen.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class DriverAuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DriverService _driverService = DriverService();

  Future<void> signIn(String email, String password, BuildContext context) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);

      final found = await _driverService.saveDriverToHive(email);
      if (found) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => DriverHomeScreen()),
              (Route<dynamic> route) => false,
        );
      } else {
        // Roll back the auth state since we don't have a driver record
        await _auth.signOut();
      }
    } catch (e) {
      SnackbarUtil.showError("Authentication Error", e.toString());
    }
  }

}
