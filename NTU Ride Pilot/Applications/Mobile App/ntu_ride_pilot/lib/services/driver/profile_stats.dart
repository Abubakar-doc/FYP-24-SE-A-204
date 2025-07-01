import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';

class ProfileStatsService {
  final DriverService _driverService = DriverService();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<Map<String, dynamic>> fetchRideStats() async {
    // Get the current driver.
    DriverModel? driver = await _driverService.getCurrentDriver();
    if (driver == null) {
      return {'totalRides': 0, 'totalHours': "0.0"};
    }

    // Query rides for this driver.
    final querySnapshot = await _firestore
        .collection('rides')
        .where('driver_id', isEqualTo: driver.driverId)
        .get();

    int rides = 0;
    double hours = 0.0;
    for (var doc in querySnapshot.docs) {
      rides++;
      final data = doc.data();
      if (data.containsKey('created_at') &&
          data.containsKey('ended_at') &&
          data['created_at'] != null &&
          data['ended_at'] != null) {
        Timestamp createdAtTs = data['created_at'];
        Timestamp endedAtTs = data['ended_at'];
        final duration = endedAtTs.toDate().difference(createdAtTs.toDate());
        hours += duration.inMinutes / 60;
      }
    }

    return {
      'totalRides': rides,
      'totalHours': hours.toStringAsFixed(1),
    };
  }
}
