import 'package:firebase_auth/firebase_auth.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';

class UserProfileService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DriverService _driverService = DriverService();

  Future<Map<String, dynamic>> loadUserData() async {
    // Get the current authenticated user.
    User? user = _auth.currentUser;
    if (user == null || user.email == null) {
      print("ERROR: No authenticated user found.");
      return {
        'name': 'Name',
        'role': 'Role',
        'email': '',
        'profilePic': null,
      };
    }

    // Update Hive with the latest driver data from Firestore.
    await _driverService.saveDriverToHive(user.email!);

    // Retrieve the updated driver from Hive.
    DriverModel? currentDriver = _driverService.getCurrentDriver();
    if (currentDriver != null) {
      return {
        'name': currentDriver.name.isNotEmpty ? currentDriver.name : 'Unknown Driver',
        'role': currentDriver.role,
        'email': currentDriver.email,
        'profilePic': currentDriver.profilePicLink,
      };
    }

    // Fallback if no driver is found.
    return {
      'name': 'Guest',
      'role': '',
      'email': user.email!,
      'profilePic': null,
    };
  }

}

