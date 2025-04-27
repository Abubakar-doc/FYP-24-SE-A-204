import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';

class RouteService {
  final CollectionReference _collection =
  FirebaseFirestore.instance.collection('routes');

  // Future<RouteModel?> getRouteById(String routeId) async {
  //   try {
  //     final docSnap = await _collection.doc(routeId).get();
  //
  //     // If the document doesn't exist, return null
  //     if (!docSnap.exists) {
  //       return null;
  //     }
  //
  //     // Safely retrieve the data as a Map
  //     final data = docSnap.data() as Map<String, dynamic>?;
  //     if (data == null) {
  //       return null;
  //     }
  //
  //     // Convert the map into a RouteModel
  //     return RouteModel.fromMap(data);
  //   } catch (e) {
  //     // Optionally handle/log the error
  //     return null;
  //   }
  // }
  Future<RouteModel?> getRouteById(String routeId) async {
    try {
      final docSnap = await _collection.doc(routeId).get();

      // If the document doesn't exist, return null
      if (!docSnap.exists) {
        return null;
      }

      // Safely retrieve the data as a Map
      final data = docSnap.data() as Map<String, dynamic>?;

      if (data == null) {
        return null;
      }

      // Convert the map into a RouteModel by passing both data and the document ID
      return RouteModel.fromMap(data, docSnap.id); // Pass the docSnap.id here

    } catch (e) {
      // Optionally handle/log the error
      print("Error fetching route by ID: $e");
      return null;
    }
  }

}
