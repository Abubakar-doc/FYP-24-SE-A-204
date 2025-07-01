import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:ntu_ride_pilot/screens/student/student_home/student_home_screen.dart';
import 'package:ntu_ride_pilot/services/student/student_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class StudentAuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final StudentService _studentService = StudentService();

  Future<void> signIn(String email, String password) async {
    try {
      // Authenticate the user with Firebase
      await _auth.signInWithEmailAndPassword(email: email, password: password);

      // First, check if the student exists in Firestore
      bool studentExists =
          await _studentService.checkStudentExistsInFirestore(email);

      if (studentExists) {
        // Proceed to save the student data in Hive
        bool isStudentSaved = await _studentService.saveStudentToHive(email);

        // If the student is successfully saved in Hive, navigate to the home screen
        if (isStudentSaved) {
          Get.off(() => StudentHomeScreen());
        } else {
          SnackbarUtil.showError(
              "Sign-in Failed", "Student record could not be saved.");
        }
      } else {
        SnackbarUtil.showError(
            "Sign-in Failed", "Student account does not exist.");
      }
    } catch (e) {
      SnackbarUtil.showError("Authentication Error", e.toString());
    }
  }

  // Sign in with Google
  Future<void> signInWithGoogle(BuildContext context) async {
    try {
      // Trigger the Google sign-in flow
      final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();

      if (googleUser == null) {
        SnackbarUtil.showInfo("Error", "Google sign-in was cancelled.");
        return;
      }

      // Obtain the authentication details from Google
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Create an AuthCredential from the Google credentials
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Once signed in, sign in with the credential
      final UserCredential userCredential = await _auth.signInWithCredential(credential);

      final email = userCredential.user?.email;
      if (email != null) {
        // Check if the student exists and save to Hive
        final found = await _studentService.saveStudentToHive(email);
        if (found) {
          Get.offAll(() => StudentHomeScreen());
        } else {
          await _auth.signOut();
          await GoogleSignIn().signOut();
          SnackbarUtil.showError("Sorry", "Account doesn't exist!");
        }
      }
    } on FirebaseAuthException catch (e) {
      SnackbarUtil.showError("Authentication Error", e.message ?? "Unknown error");
    }
  }
}
