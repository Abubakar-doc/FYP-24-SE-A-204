import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class DriverService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<DriverModel?> getDriverByEmail(String email) async {
    try {
      QuerySnapshot querySnapshot = await _firestore
          .collection('users')
          .doc('user_roles')
          .collection('drivers')
          .where('email', isEqualTo: email)
          .limit(1)
          .get();

      if (querySnapshot.docs.isNotEmpty) {
        var doc = querySnapshot.docs.first;
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        return DriverModel(
          driverId: doc.id,
          email: data['email'] ?? email,
          name: data['name'] ?? '',
          contactNo: data['contactNo'] ?? '',
          profilePicLink: data['profilePicLink'],
        );
      }
    } catch (e) {
      // print("Error fetching driver: $e");
    }
    return null;
  }

  Future<bool> saveDriverToHive(String email) async {
    try {
      final driverDoc = await getDriverByEmail(email);
      if (driverDoc != null) {
        // Check if the box is opened already, if not, open it
        final box = await _getDriverBox();
        box.put('current_driver', driverDoc);
        return true;
      } else {
        // No such driver in Firestore
        // SnackbarUtil.showError("Sign-in Failed", "No record found.");
        return false;
      }
    } catch (e) {
      SnackbarUtil.showError("Error Saving Driver", e.toString());
      return false;
    }
  }

// Helper method to open or get the Hive box for driver
  Future<Box<DriverModel>> _getDriverBox() async {
    if (!Hive.isBoxOpen('driverBox')) {
      await Hive.openBox<DriverModel>('driverBox');
    }
    return Hive.box<DriverModel>('driverBox');
  }

  Future<DriverModel?> getCurrentDriver() async {
    try {
      // Check if the box is opened, if not, open it
      final box = await _getDriverBox();
      return box.get('current_driver');
    } catch (e) {
      SnackbarUtil.showError("Error Fetching Driver", e.toString());
      return null;
    }
  }
}
