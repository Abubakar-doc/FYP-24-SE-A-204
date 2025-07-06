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
      return {
        'name': 'Guest',
        'role': '',
        'email': '',
        'profilePic': null,
      };
    }

    // Check for Google profile picture
    String? googleProfilePic = _getGoogleProfilePicture(user);

    // Try loading driver data first
    DriverModel? currentDriver = await _driverService.getCurrentDriver();
    if (currentDriver != null) {
      return {
        'name': currentDriver.name.isNotEmpty
            ? currentDriver.name
            : 'Unknown Driver',
        'role': currentDriver.role,
        'email': currentDriver.email,
        'profilePic':
        currentDriver.profilePicLink ?? googleProfilePic,
      };
    }

    // If no driver, fetch student from Firestore by email
    StudentModel? student =
    await _studentService.getStudentByEmail(user.email!);
    if (student != null) {
      return <String, dynamic>{
        'name': student.name.isNotEmpty
            ? student.name
            : 'Unknown Student',
        'rollNo': student.rollNo,
        'role': student.role,
        'email': student.email,
        'profilePic':
        googleProfilePic ?? student.profilePicLink,
        'bus_card_status': student.busCardStatus,
        'feeStatus': student.feePaid ? 'Paid' : 'Due',
      };
    }

    // Fallback user data
    return {
      'name': 'Guest',
      'role': '',
      'email': user.email!,
      'profilePic': googleProfilePic,
    };
  }

  // Helper to extract Google profile picture if available
  String? _getGoogleProfilePicture(User user) {
    for (var info in user.providerData) {
      if (info.providerId == 'google.com') {
        return info.photoURL;
      }
    }
    return null;
  }
}
