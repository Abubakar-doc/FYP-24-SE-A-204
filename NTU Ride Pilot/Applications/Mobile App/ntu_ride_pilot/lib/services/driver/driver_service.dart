import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';

class DriverService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<DriverModel?> getDriverByEmail(String email) async {
    try {
      DocumentSnapshot doc = await _firestore
          .collection('users')
          .doc('user_roles')
          .collection('drivers')
          .doc(email)
          .get();

      if (doc.exists) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        return DriverModel(
          email: email,
          name: data['name'] ?? '',
          contactNo: data['contact_no'] ?? '',
          profilePic: data['profile_pic'],
        );
      }
    } catch (e) {
      print("Error fetching driver: $e");
    }
    return null;
  }
}
