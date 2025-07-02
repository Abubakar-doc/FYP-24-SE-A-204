import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:ntu_ride_pilot/screens/driver/driver_home/driver_home_screen.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class DriverAuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DriverService _driverService = DriverService();

  Future<void> signIn(
      String email, String password, BuildContext context) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      final found = await _driverService.saveDriverToHive(email);
      if (found) {
        Get.offAll(() => DriverHomeScreen());
      } else {
        await GoogleSignIn().signOut();
        await _auth.signOut();
      }
    } catch (e) {
      SnackbarUtil.showError("Authentication Error", e.toString());
    }
  }

  Future<void> signInWithGoogle(BuildContext context) async {
    try {
      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();

      if (googleUser == null) {
        // SnackbarUtil.showInfo("Error", "Google sign-in was cancelled.");
        return;
      }

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Create a new credential
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Once signed in, sign in with the credential
      final UserCredential userCredential =
          await _auth.signInWithCredential(credential);

      final email = userCredential.user?.email;
      if (email != null) {
        final found = await _driverService.saveDriverToHive(email);
        if (found) {
          Get.offAll(() => DriverHomeScreen());
        } else {
          await _auth.signOut();
          await GoogleSignIn().signOut();
          SnackbarUtil.showError("Sorry", "Account doesn't exists!");
        }
      }
    } on FirebaseAuthException catch (e) {
      SnackbarUtil.showError(
          "Authentication Error", e.message ?? "Unknown error");
    }
  }
}
