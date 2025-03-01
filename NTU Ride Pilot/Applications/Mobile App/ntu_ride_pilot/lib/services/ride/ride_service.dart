import 'dart:async';
import 'dart:collection';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:hive/hive.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'package:ntu_ride_pilot/model/bus/bus.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';

class RideService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  // Use InternetConnectionChecker for reliable connectivity status.
  final InternetConnectionChecker _connectionChecker =
  InternetConnectionChecker.createInstance();
  bool _isOnline = true;
  // Queue to hold onboard tasks for later uploading to Firestore.
  final Queue<Map<String, dynamic>> _uploadQueue = Queue();
  late Timer _queueProcessor;

  // Response status constants.
  static const String CARD_NOT_FOUND = "CARD_NOT_FOUND";
  static const String CARD_INACTIVE = "CARD_INACTIVE";
  static const String STUDENT_ALREADY_ONBOARD = "STUDENT_ALREADY_ONBOARD";
  static const String CARD_VERIFIED = "CARD_VERIFIED";
  static const String UNKNOWN_ERROR = "UNKNOWN_ERROR";

  RideService() {
    // Listen to connectivity changes using InternetConnectionChecker.
    _connectionChecker.onStatusChange.listen((status) {
      _isOnline = (status == InternetConnectionStatus.connected);
      if (_isOnline) {
        _processQueue();
      }
    });

    // Process the upload queue periodically (every 5 seconds).
    _queueProcessor =
        Timer.periodic(const Duration(seconds: 5), (_) => _processQueue());
  }

  /// ─────────────────────────────────────────────────────────────────────────
  /// Ride Status Updates
  /// ─────────────────────────────────────────────────────────────────────────

  /// Start the ride: update Firestore, update local Hive, etc.
  Future<void> startRide(RideModel ride) async {
    try {
      // Update local ride status.
      ride.rideStatus = 'inProgress';

      // Update Hive.
      final rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.put('currentRide', ride);

      // Update Firestore.
      await _firestore
          .collection('rides')
          .doc(ride.rideId)
          .update({'ride_status': 'inProgress'});
    } catch (e) {
      rethrow; // Let the caller handle errors/logging.
    }
  }

  /// End the ride: update Firestore, clear local ride box, etc.
  Future<void> endRide(RideModel ride) async {
    try {
      // Update Firestore.
      await _firestore.collection('rides').doc(ride.rideId).update({
        'ride_status': 'completed',
        'ended_at': FieldValue.serverTimestamp(),
      });

      // Clear Hive box.
      final rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.clear();
    } catch (e) {
      rethrow;
    }
  }

  /// Cancel the ride: delete the Firestore doc, clear local ride box.
  Future<void> cancelRide(RideModel ride) async {
    try {
      await _firestore.collection('rides').doc(ride.rideId).delete();
      final rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.clear();
    } catch (e) {
      rethrow;
    }
  }

  /// Retrieve the current ride from Hive (if any).
  Future<RideModel?> fetchRideFromHive() async {
    try {
      var rideBox = await Hive.openBox<RideModel>('rides');
      return rideBox.get('currentRide');
    } catch (e) {
      return null;
    }
  }

  /// ─────────────────────────────────────────────────────────────────────────
  /// Card Input / Onboard Logic
  /// ─────────────────────────────────────────────────────────────────────────

  Future<RideServiceResponse> handleCardInput(String input) async {
    try {
      // 1. Open necessary Hive boxes.
      var busCardBox = await Hive.openBox<BusCardModel>('bus_cards');
      var rideBox = await Hive.openBox<RideModel>('rides');

      // 2. Look up matching bus card.
      BusCardModel? matchingCard = busCardBox.values.firstWhereOrNull(
            (card) => card.busCardId == input,
      );

      if (matchingCard == null) {
        return RideServiceResponse(statusCode: CARD_NOT_FOUND);
      }
      if (!matchingCard.isActive) {
        return RideServiceResponse(statusCode: CARD_INACTIVE);
      }

      // 3. Retrieve the ride from Hive.
      RideModel? currentRide = rideBox.get('currentRide');
      if (currentRide == null) {
        return RideServiceResponse(statusCode: "RIDE_NOT_FOUND");
      }

      // 4. Check if the card is already onboard in the local ride.
      if (currentRide.onlineOnBoard.contains(matchingCard.rollNo) ||
          currentRide.offlineOnBoard.contains(matchingCard.rollNo)) {
        return RideServiceResponse(
          statusCode: STUDENT_ALREADY_ONBOARD,
          busNumber: currentRide.busId,
          studentName: matchingCard.name,
          rollNo: matchingCard.rollNo,
        );
      }

      if (_isOnline) {
        DateTime threeHoursAgo = DateTime.now().subtract(Duration(hours: 3));
        Timestamp threeHoursAgoTimestamp = Timestamp.fromDate(threeHoursAgo);

        QuerySnapshot onlineSnapshot = await _firestore
            .collection('rides')
            .where('onlineOnBoard', arrayContains: matchingCard.rollNo)
            .where('ride_status', whereIn: ['idle', 'inProgress'])
            .where('created_at', isGreaterThanOrEqualTo: threeHoursAgoTimestamp)
            .get();

        QuerySnapshot offlineSnapshot = await _firestore
            .collection('rides')
            .where('offlineOnBoard', arrayContains: matchingCard.rollNo)
            .where('ride_status', whereIn: ['idle', 'inProgress'])
            .where('created_at', isGreaterThanOrEqualTo: threeHoursAgoTimestamp)
            .get();

        if (onlineSnapshot.docs.isNotEmpty || offlineSnapshot.docs.isNotEmpty) {
          String busId = '';
          if (onlineSnapshot.docs.isNotEmpty) {
            var docData = onlineSnapshot.docs.first.data() as Map<String, dynamic>;
            busId = docData['bus_id'] ?? '';
          } else if (offlineSnapshot.docs.isNotEmpty) {
            var docData = offlineSnapshot.docs.first.data() as Map<String, dynamic>;
            busId = docData['bus_id'] ?? '';
          }
          return RideServiceResponse(
            statusCode: STUDENT_ALREADY_ONBOARD,
            busNumber: busId,
            studentName: matchingCard.name,
            rollNo: matchingCard.rollNo,
          );
        }
      }


      String processingMode = _isOnline ? 'online' : 'offline';
      String timestamp = DateTime.now().toIso8601String();

      // 7. Update onboard information in the local RideModel immediately.
      if (processingMode == 'online') {
        currentRide.onlineOnBoard.add(matchingCard.rollNo);
      } else {
        currentRide.offlineOnBoard.add(matchingCard.rollNo);
      }
      await rideBox.put('currentRide', currentRide);

      // 8. Dispatch Firestore update in parallel if online.
      if (_isOnline) {
        updateOnboardStatus(
          rollNo: matchingCard.rollNo,
          processingMode: processingMode,
          timestamp: timestamp,
          ride: currentRide,
        ).catchError((e) => print("Error updating Firestore in parallel: $e"));
      }

      // 9. Add to the upload queue for background processing.
      _uploadQueue.add({
        'rollNo': matchingCard.rollNo,
        'processingMode': processingMode,
        'timestamp': timestamp,
      });

      // 10. Return success result.
      return RideServiceResponse(
        statusCode: CARD_VERIFIED,
        studentName: matchingCard.name,
        rollNo: matchingCard.rollNo,
      );
    } catch (e) {
      print("Error handling card input: $e");
      return RideServiceResponse(statusCode: UNKNOWN_ERROR);
    }
  }

  /// ─────────────────────────────────────────────────────────────────────────
  /// Background Queue Processing
  /// ─────────────────────────────────────────────────────────────────────────

  Future<void> _processQueue() async {
    if (!_isOnline) return;

    var rideBox = await Hive.openBox<RideModel>('rides');
    RideModel? currentRide = rideBox.get('currentRide');
    if (currentRide == null) return;

    while (_uploadQueue.isNotEmpty) {
      var task = _uploadQueue.removeFirst();
      try {
        await updateOnboardStatus(
          rollNo: task['rollNo'],
          processingMode: task['processingMode'],
          timestamp: task['timestamp'],
          ride: currentRide,
        );
      } catch (e) {
        print("Error processing upload queue task for rollNo ${task['rollNo']}: $e");
        _uploadQueue.add(task);
        break;
      }
    }
  }

  Future<void> updateOnboardStatus({
    required String rollNo,
    required String processingMode,
    required String timestamp,
    required RideModel ride,
  }) async {
    DocumentReference rideDocRef = _firestore.collection("rides").doc(ride.rideId);

    // Update the appropriate onboard array using FieldValue.arrayUnion.
    if (processingMode == 'online') {
      await rideDocRef.set({
        'onlineOnBoard': FieldValue.arrayUnion([rollNo]),
      }, SetOptions(merge: true));
    } else {
      await rideDocRef.set({
        'offlineOnBoard': FieldValue.arrayUnion([rollNo]),
      }, SetOptions(merge: true));
    }
  }


  /// ─────────────────────────────────────────────────────────────────────────
  /// Firestore Sync Utility Methods
  /// ─────────────────────────────────────────────────────────────────────────
  Future<void> fetchAndStoreBusCards() async {
    try {
      // Open the persistent bus cards box and temporary boxes.
      var box = await Hive.openBox<BusCardModel>('bus_cards');

      // Fetch data from Firestore with a timeout.
      List<QueryDocumentSnapshot> docs = [];
      try {
        QuerySnapshot snapshot = await _firestore
            .collection('bus_cards')
            .get()
            .timeout(const Duration(seconds: 20));
        docs = snapshot.docs;
      } catch (e) {
        // Handle network issues if necessary.
      }

      if (docs.isEmpty) {
        return;
      }

      // Convert Firestore data to a Map of BusCardModel.
      Map<String, BusCardModel> firestoreCards = {
        for (var doc in docs)
          doc.id: BusCardModel(
            busCardId: doc.id,
            rollNo: (doc.data() as Map<String, dynamic>)['roll_no'] ?? '',
            isActive: (doc.data() as Map<String, dynamic>)['isActive'] ?? true,
            name: (doc.data() as Map<String, dynamic>)['name'] ?? '',
          )
      };

      // Clear the local bus cards box and store the fetched cards.
      await box.clear();
      await box.putAll(firestoreCards);
    } catch (e) {
      // Handle errors if needed.
    }
  }

  Future<List<BusModel>> fetchBuses() async {
    try {
      QuerySnapshot busSnapshot = await _firestore.collection('buses').get();
      return busSnapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        // Merge the document ID as the busId into the data map.
        return BusModel.fromMap({
          'bus_id': doc.id,
          ...data,
        });
      }).toList();
    } catch (e) {
      print("Error fetching buses: $e");
      return [];
    }
  }

  Future<List<RouteModel>> fetchRoutes() async {
    try {
      QuerySnapshot routeSnapshot = await _firestore.collection('routes').get();
      return routeSnapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        return RouteModel(
          routeId: doc.id, // Use document ID as the route ID.
          name: data['name'] ?? 'Unnamed Route',
          busStopId: Map<String, String>.from(data['bus_stop_id'] ?? {}),
        );
      }).toList();
    } catch (e) {
      print("Error fetching routes: $e");
      return [];
    }
  }

  Future<RideModel?> createNewRide({
    required BusModel bus,
    required RouteModel route,
  }) async {
    try {
      // Fetch the current driver.
      DriverService driverService = DriverService();
      DriverModel? currentDriver = driverService.getCurrentDriver();

      if (currentDriver == null) {
        // print("Error: No current driver found in Hive.");
        return null;
      }

      // Validation: Check if the selected bus is already in use.
      DateTime threeHoursAgo = DateTime.now().subtract(Duration(hours: 3));
      Timestamp threeHoursAgoTimestamp = Timestamp.fromDate(threeHoursAgo);

      QuerySnapshot rideQuerySnapshot = await _firestore
          .collection('rides')
          .where('ride_status', whereIn: ['idle', 'inProgress'])
          .where('created_at', isGreaterThanOrEqualTo: threeHoursAgoTimestamp)
          .get();

      for (var doc in rideQuerySnapshot.docs) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        if (data['bus_id'] == bus.busId) {
          // Bus is in use. Fetch driver and route details.
          String existingDriverId = data['driver_id'];
          String existingRouteId = data['route_id'];

          DocumentSnapshot driverSnapshot = await _firestore
              .collection('users')
              .doc('user_roles')
              .collection('drivers')
              .doc(existingDriverId)
              .get();
          String driverName = "Unknown Driver";
          if (driverSnapshot.exists) {
            driverName = (driverSnapshot.data() as Map<String, dynamic>)['name'] ?? "Unknown Driver";
          }

          DocumentSnapshot routeSnapshot =
          await _firestore.collection('routes').doc(existingRouteId).get();
          String routeName = "Unknown Route";
          if (routeSnapshot.exists) {
            routeName = (routeSnapshot.data() as Map<String, dynamic>)['name'] ?? "Unknown Route";
          }

          // Throw custom exception.
          throw BusInUseException(driverName, routeName);
        }
      }

      // Bus is not in use; proceed to create a new ride.
      DocumentReference docRef = await _firestore.collection('rides').add({
        'route_id': route.routeId,
        'ride_status': 'idle',
        'bus_id': bus.busId,
        'driver_id': currentDriver.driverId,
        'created_at': FieldValue.serverTimestamp(),
        'onlineOnBoard': [],
        'offlineOnBoard': [],
      });

      // Create local RideModel.
      RideModel ride = RideModel(
        rideId: docRef.id,
        routeId: route.routeId,
        rideStatus: 'idle',
        busId: bus.busId,
        driverId: currentDriver.driverId,
        onlineOnBoard: [],
        offlineOnBoard: [],
        etaNextStop: DateTime.now().add(const Duration(minutes: 15)),
        createdAt: DateTime.now(),
      );

      // Store in Hive.
      var rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.put('currentRide', ride);

      return ride;
    } catch (e) {
      // Rethrow the BusInUseException so it can be handled in validateAndNavigate.
      if (e is BusInUseException) {
        rethrow;
      }
      // print("Error creating new ride: $e");
      return null;
    }
  }



}

class RideServiceResponse {
  final String statusCode;
  final String? busNumber;
  final String? studentName;
  final String? rollNo;

  RideServiceResponse({
    required this.statusCode,
    this.busNumber,
    this.studentName,
    this.rollNo,
  });
}


class BusInUseException implements Exception {
  static const String BUS_IN_USE = "BUS_IN_USE";
  final String driverName;
  final String routeName;

  BusInUseException(this.driverName, this.routeName);

  @override
  String toString() => BUS_IN_USE;
}
