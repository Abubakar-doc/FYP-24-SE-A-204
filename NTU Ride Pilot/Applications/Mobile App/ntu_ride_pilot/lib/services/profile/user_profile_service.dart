import 'package:firebase_auth/firebase_auth.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';
import 'package:ntu_ride_pilot/services/student/student_service.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';

class UserProfileService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final DriverService _driverService = DriverService();
  final StudentService _studentService = StudentService();

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

    // Check if the user is authenticated via Google.
    String? googleProfilePic = _getGoogleProfilePicture(user);

    // Retrieve the driver data from Hive
    DriverModel? currentDriver = await _driverService.getCurrentDriver();
    if (currentDriver != null) {
      return {
        'name': currentDriver.name.isNotEmpty ? currentDriver.name : 'Unknown Driver',
        'role': currentDriver.role,
        'email': currentDriver.email,
        'profilePic': currentDriver.profilePicLink,
      };
    }

    // Retrieve the student data from Hive if no driver is found
    StudentModel? currentStudent = await _studentService.getCurrentStudent();
    if (currentStudent != null) {
      return {
        'name': currentStudent.name.isNotEmpty ? currentStudent.name : 'Unknown Student',
        'role': currentStudent.role,
        'email': currentStudent.email,
        'profilePic': googleProfilePic ?? currentStudent.profilePicLink,  // Use Google profile pic if available
      };
    }

    // Fallback if no driver or student is found.
    return {
      'name': 'Guest',
      'role': '',
      'email': user.email!,
      'profilePic': googleProfilePic ?? null, // Use Google profile pic if available
    };
  }

  // Helper method to fetch Google profile picture
  String? _getGoogleProfilePicture(User user) {
    // Check if the user is authenticated via Google
    for (var info in user.providerData) {
      if (info.providerId == 'google.com') {
        // Return the Google profile picture URL
        print(info.photoURL);
        return info.photoURL;
      }
    }
    return null; // No Google profile picture available
  }
}
