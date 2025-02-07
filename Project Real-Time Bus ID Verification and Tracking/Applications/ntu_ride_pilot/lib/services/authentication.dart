import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/services/user.dart';
import 'package:ntu_ride_pilot/screens/common/authentication/signIn.dart';
import 'package:ntu_ride_pilot/screens/common/welcome/welcome.dart';
import 'package:ntu_ride_pilot/screens/driver/driver_home/driver_home_screen.dart';
import 'package:ntu_ride_pilot/screens/student/student_home/student_home_screen.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:ntu_ride_pilot/model/user.dart';

class AuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final UserService _userService = UserService();

  /// Checks if a user is signed in and navigates accordingly.
  Future<void> isSignedIn() async {
    try {
      User? user = _auth.currentUser;

      if (user != null) {
        await user.reload();
        user = _auth.currentUser;

        if (user == null) {
          throw FirebaseAuthException(code: 'user-not-found');
        }

        await _navigateBasedOnRole(user.email!);
      } else {
        Get.off(() => WelcomeScreen());
      }
    } on FirebaseAuthException catch (e) {
      if (e.code == 'user-not-found' || e.code == 'user-disabled') {
        await logout();
        SnackbarUtil.showError("Sign-in Error", e.code);
      } else {
        SnackbarUtil.showError("Sign-in Error", e.code);
      }
    } catch (e) {
      SnackbarUtil.showError("Sign-in Error", "Unexpected error occurred: ${e.toString()}");
    }
  }

  /// Signs in the user with email and password.
  Future<void> signIn(String email, String password) async {
    try {
      UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      User? user = userCredential.user;

      if (user != null) {
        await _navigateBasedOnRole(user.email!);
      } else {
        SnackbarUtil.showError("Sign-in Failed", "User authentication failed.");
      }
    } on FirebaseAuthException catch (e) {
      SnackbarUtil.showError("Authentication Error", e.code);
    } catch (e) {
      SnackbarUtil.showError("Sign-in Failed", "Unexpected error: ${e.toString()}");
    }
  }

  /// Navigates the user based on their role.
  Future<void> _navigateBasedOnRole(String email) async {
    try {
      var userBox = await Hive.openBox<UserModel>('userBox');
      UserModel? storedUser = userBox.get('user');

      if (storedUser != null && storedUser.email == email) {
        _navigateToHome(storedUser.role);
      } else {
        var userDoc = await _userService.getUserByEmail(email);

        if (userDoc != null && userDoc.exists) {
          var userModel = _userService.mapToUserModel(userDoc.data()!);
          _navigateToHome(userModel.role);

          // Store user data in Hive asynchronously after navigation
          Future(() async => await userBox.put('user', userModel));
        } else {
          SnackbarUtil.showError("Sign-in Failed", "User data not found in Firestore.");
        }
      }
    } catch (e) {
      SnackbarUtil.showError("Sign-in Failed", "Error fetching user data: ${e.toString()}");
    }
  }

  /// Navigates to the appropriate home screen based on the user’s role.
  void _navigateToHome(String role) {
    switch (role) {
      case "student":
        Get.off(() => StudentHomeScreen());
        break;
      case "driver":
        Get.off(() => DriverHomeScreen());
        break;
      default:
        SnackbarUtil.showError("Sign-in Failed", "Invalid user role.");
        break;
    }
  }

  /// Logs out the user, clears stored data, and redirects to the sign-in screen.
  Future<void> logout() async {
    try {
      await _auth.signOut();
      var userBox = await Hive.openBox<UserModel>('userBox');
      // await userBox.clear();
      Get.off(() => SignInScreen());
    } catch (e) {
      SnackbarUtil.showError("Logout Failed", "Error: ${e.toString()}");
    }
  }

  Future<void> resetPassword(String email) async {
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
      SnackbarUtil.showSuccess("Email Sent", "Check your inbox for password reset instructions.");
      Get.off(() => SignInScreen());

    } on FirebaseAuthException catch (e) {
      print(e);
      SnackbarUtil.showError("Error", e.message ?? "Something went wrong.");
    } catch (e) {
      print(e);
      SnackbarUtil.showError("Error", "Unexpected error: ${e.toString()}");
    }
  }




}
