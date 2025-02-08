import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class UserProfileService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<Map<String, dynamic>> loadUserData() async {
    // Get the current user
    User? user = _auth.currentUser;

    if (user == null || user.email == null) {
      print("ERROR: No authenticated user found.");
      return {'name': 'Guest', 'role': '', 'email': '', 'profilePic': null};
    }

    String email = user.email!;

    return await _fetchFirestoreData(email);
  }

  Future<Map<String, dynamic>> _fetchFirestoreData(String email) async {
    try {
      // Check both driver and student collections
      var driverDoc = await _firestore
          .collection('users')
          .doc('user_roles')
          .collection('drivers')
          .doc(email)
          .get();

      if (driverDoc.exists) {
        var data = driverDoc.data() as Map<String, dynamic>;
        return {
          'name': data['name'] ?? 'Unknown Driver',
          'role': 'driver',
          'profilePic': data['profile_pic'],
        };
      }

      var studentDoc = await _firestore
          .collection('users')
          .doc('user_roles')
          .collection('students')
          .doc(email)
          .get();

      if (studentDoc.exists) {
        var data = studentDoc.data() as Map<String, dynamic>;
        return {
          'name': data['name'] ?? 'Unknown Student',
          'role': 'student',
          'profilePic': data['profile_pic'],
        };
      }
    } catch (e) {
      print("Error fetching user data: $e");
    }

    return {'name': 'Guest', 'role': '', 'profilePic': null};
  }
}
