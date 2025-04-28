import 'dart:async';
import 'dart:collection';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'package:ntu_ride_pilot/model/bus/bus.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/services/driver/driver_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:geolocator/geolocator.dart' as geo;

import 'live_location.dart';

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

  // Future<void> startRide(RideModel ride, RouteModel route, BuildContext context) async {
  //   try {
  //     // Update local ride status.
  //     ride.rideStatus = 'inProgress';
  //
  //     // Update Hive.
  //     final rideBox = await Hive.openBox<RideModel>('rides');
  //     await rideBox.put('currentRide', ride);
  //
  //     // Update Firestore.
  //     await _firestore
  //         .collection('rides')
  //         .doc(ride.rideId)
  //         .update({'ride_status': 'inProgress'});
  //
  //     // Log to check if the periodic updates are being triggered
  //     print("Starting periodic location updates for ride: ${ride.rideId}");
  //
  //     // Start periodic location updates and ETA calculations for the ride
  //     LiveLocationService liveLocationService = LiveLocationService(context);
  //
  //     // Call updateRideWithETA immediately to calculate the ETA
  //     await liveLocationService.updateRideWithETA(ride, route, context);
  //
  //     // Start periodic updates for ETA calculations
  //     liveLocationService.startPeriodicLocationUpdates(
  //       ride: ride,
  //       route: route,
  //       context: context,
  //     );
  //   } catch (e) {
  //     print("Error in startRide: $e");  // Log error in starting ride
  //     rethrow; // Let the caller handle errors/logging.
  //   }
  // }
  Future<void> startRide(RideModel ride, RouteModel route, BuildContext context) async {
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

      // Log to check if the periodic updates are being triggered
      print("Starting periodic location updates for ride: ${ride.rideId}");

      // Start periodic location updates and ETA calculations for the ride
      LiveLocationService liveLocationService = LiveLocationService(context);

      // Call updateRideWithETA immediately to calculate the ETA and update location
      await liveLocationService.updateRideWithETA(ride, route, context);

      // Start periodic updates for ETA calculations
      liveLocationService.startPeriodicLocationUpdates(
        ride: ride,
        route: route,
        context: context,
      );
    } catch (e) {
      print("Error in startRide: $e");  // Log error in starting ride
      rethrow; // Let the caller handle errors/logging.
    }
  }


  /// Cancel the ride: delete the Firestore doc, clear local ride box.
  // Future<void> cancelRide(RideModel ride) async {
  //   try {
  //     await _firestore.collection('rides').doc(ride.rideId).delete();
  //     final rideBox = await Hive.openBox<RideModel>('rides');
  //     await rideBox.clear();
  //   } catch (e) {
  //     rethrow;
  //   }
  // }
  // Future<void> endRide(RideModel ride, BuildContext context) async {
  //   try {
  //     // Update Firestore.
  //     await _firestore.collection('rides').doc(ride.rideId).update({
  //       'ride_status': 'completed',
  //       'ended_at': FieldValue.serverTimestamp(),
  //     });
  //
  //     // Stop the periodic location updates if the ride is completed
  //     LiveLocationService liveLocationService = LiveLocationService(context);
  //     liveLocationService.stopPeriodicLocationUpdates();
  //
  //     // Clear Hive box.
  //     final rideBox = await Hive.openBox<RideModel>('rides');
  //     await rideBox.clear();
  //   } catch (e) {
  //     rethrow;
  //   }
  // }

  Future<void> endRide(RideModel ride, BuildContext context) async {
    try {
      // Update Firestore.
      await _firestore.collection('rides').doc(ride.rideId).update({
        'ride_status': 'completed',
        'ended_at': FieldValue.serverTimestamp(),
      });

      // Stop the periodic location updates if the ride is completed
      LiveLocationService liveLocationService = LiveLocationService(context);
      await liveLocationService.stopPeriodicLocationUpdates();

      // Clear Hive box.
      final rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.clear();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> cancelRide(RideModel ride, BuildContext context) async {
    try {
      await _firestore.collection('rides').doc(ride.rideId).delete();

      // Stop the periodic location updates if the ride is cancelled
      LiveLocationService liveLocationService = LiveLocationService(context);
      await liveLocationService.stopPeriodicLocationUpdates();

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
            var docData =
                onlineSnapshot.docs.first.data() as Map<String, dynamic>;
            busId = docData['bus_id'] ?? '';
          } else if (offlineSnapshot.docs.isNotEmpty) {
            var docData =
                offlineSnapshot.docs.first.data() as Map<String, dynamic>;
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
        print(
            "Error processing upload queue task for rollNo ${task['rollNo']}: $e");
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
    DocumentReference rideDocRef =
        _firestore.collection("rides").doc(ride.rideId);

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

        // Ensure busStops is converted correctly from the Firestore array to the expected format
        var busStopsList = data['busStops'] as List<dynamic>?;
        List<Map<String, dynamic>> busStops = [];
        if (busStopsList != null) {
          busStops = busStopsList
              .map((busStop) => Map<String, dynamic>.from(busStop))
              .toList();
        }

        // Convert createdAt field from Timestamp to DateTime
        DateTime createdAt;
        if (data['createdAt'] is Timestamp) {
          createdAt = (data['createdAt'] as Timestamp)
              .toDate(); // Convert Timestamp to DateTime
        } else {
          createdAt = DateTime.parse(data['createdAt'] ??
              DateTime.now().toIso8601String()); // Fallback to current time
        }

        // Use the RouteModel and pass the parsed data
        return RouteModel(
          routeId: doc.id, // Use document ID as the route ID
          name: data['name'] ?? 'Unnamed Route',
          busStops: busStops, // Correctly parsed busStops
          createdAt: createdAt, // Correctly parsed createdAt
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
    required BuildContext context,
  }) async {
    try {
      // Fetch the current driver.
      DriverService driverService = DriverService();
      DriverModel? currentDriver = driverService.getCurrentDriver();

      if (currentDriver == null) {
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
            driverName =
                (driverSnapshot.data() as Map<String, dynamic>)['name'] ??
                    "Unknown Driver";
          }

          DocumentSnapshot routeSnapshot =
              await _firestore.collection('routes').doc(existingRouteId).get();
          String routeName = "Unknown Route";
          if (routeSnapshot.exists) {
            routeName =
                (routeSnapshot.data() as Map<String, dynamic>)['name'] ??
                    "Unknown Route";
          }

          // Throw custom exception.
          throw BusInUseException(driverName, routeName);
        }
      }

      // Get live location from LiveLocationService
      LiveLocationService liveLocationService = LiveLocationService(context);
      geo.Position? position = await liveLocationService.getCurrentLocation();

      if (position == null) {
        SnackbarUtil.showError('Error', 'Unable to fetch current location');
        return null;
      }

      // Prepare currentLocation map
      Map<String, String> currentLocation = {
        'longitude': position.longitude.toString(),
        'latitude': position.latitude.toString(),
      };

      // Bus is not in use; proceed to create a new ride.
      DocumentReference docRef = await _firestore.collection('rides').add({
        'route_id': route.routeId,
        'ride_status': 'idle',
        'bus_id': bus.busId,
        'driver_id': currentDriver.driverId,
        'created_at': FieldValue.serverTimestamp(),
        'onlineOnBoard': [],
        'offlineOnBoard': [],
        'currentLocation': currentLocation, // Add currentLocation here
      });

      // Create local RideModel with currentLocation
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
        currentLocation: currentLocation, // Add currentLocation here
      );

      // Store in Hive
      var rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.put('currentRide', ride);

      return ride;
    } catch (e) {
      // Rethrow the BusInUseException so it can be handled in validateAndNavigate.
      if (e is BusInUseException) {
        rethrow;
      }
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
