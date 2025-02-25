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
      // 1. Open the necessary Hive boxes.
      print("Opening bus_cards box...");
      var busCardBox = await Hive.openBox<BusCardModel>('bus_cards');
      print("Opening rides box...");
      var rideBox = await Hive.openBox<RideModel>('rides');

      // 2. Look up the matching bus card.
      print("Searching for bus card with busCardId: $input");
      BusCardModel? matchingCard = busCardBox.values.firstWhereOrNull(
            (card) => card.busCardId == input,
      );

      if (matchingCard == null) {
        print("No matching bus card found for busCardId: $input");
        return RideServiceResponse(statusCode: CARD_NOT_FOUND);
      }
      if (!matchingCard.isActive) {
        print("Bus card found but is INACTIVE for busCardId: $input");
        return RideServiceResponse(statusCode: CARD_INACTIVE);
      }

      // 3. Retrieve the ride from Hive using the "currentRide" key.
      print("Attempting to retrieve ride with key: currentRide");
      RideModel? currentRide = rideBox.get('currentRide');
      if (currentRide == null) {
        print("No ride found in Hive with the key: currentRide");
        return RideServiceResponse(statusCode: "RIDE_NOT_FOUND");
      } else {
        print("Successfully retrieved ride: ${currentRide.rideId}");
      }

      // 4. Check if the card is already onboard in the local ride.
      if (currentRide.onboard.containsKey(matchingCard.rollNo)) {
        print("Student with rollNo ${matchingCard.rollNo} is already onboard.");
        return RideServiceResponse(
          statusCode: STUDENT_ALREADY_ONBOARD,
          busNumber: currentRide.busId,
          studentName: matchingCard.name,
          rollNo: matchingCard.rollNo,
        );
      }

      // 5. If online, also check Firestore for duplicate onboard.
      if (_isOnline) {
        print("Checking Firestore for duplicate onboard status...");
        QuerySnapshot querySnapshot = await _firestore
            .collection('rides')
            .where('onboard.${matchingCard.rollNo}', isNull: false)
            .get();

        if (querySnapshot.docs.isNotEmpty) {
          var docData = querySnapshot.docs.first.data() as Map<String, dynamic>;
          String busId = docData['bus_id'] ?? '';
          print("Student with rollNo ${matchingCard.rollNo} is already onboard another ride in Firestore.");
          return RideServiceResponse(
            statusCode: STUDENT_ALREADY_ONBOARD,
            busNumber: busId,
            studentName: matchingCard.name,
            rollNo: matchingCard.rollNo,
          );
        }
      }

      // 6. Determine processing mode and timestamp.
      String processingMode = _isOnline ? 'online' : 'offline';
      String timestamp = DateTime.now().toIso8601String();

      // 7. Update onboard information in the local RideModel immediately.
      print("Adding student with rollNo ${matchingCard.rollNo} to onboard list...");
      currentRide.onboard[matchingCard.rollNo] = {
        'processingMode': processingMode,
        'timestamp': timestamp,
      };
      await rideBox.put('currentRide', currentRide);

      // 8. Dispatch Firestore update in parallel if online (do not await).
      if (_isOnline) {
        print("Updating Firestore with onboard data for rollNo ${matchingCard.rollNo}...");
        _updateOnboardStatus(
          rollNo: matchingCard.rollNo,
          processingMode: processingMode,
          timestamp: timestamp,
          ride: currentRide,
        ).catchError((e) => print("Error updating Firestore in parallel: $e"));
      }

      // 9. Add to the upload queue for background processing.
      print("Adding rollNo ${matchingCard.rollNo} to the upload queue...");
      _uploadQueue.add({
        'rollNo': matchingCard.rollNo,
        'processingMode': processingMode,
        'timestamp': timestamp,
      });

      // 10. Return success result.
      print("Card verified successfully for rollNo ${matchingCard.rollNo}.");
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
        await _updateOnboardStatus(
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

  Future<void> _updateOnboardStatus({
    required String rollNo,
    required String processingMode,
    required String timestamp,
    required RideModel ride,
  }) async {
    DocumentReference rideDocRef = _firestore.collection("rides").doc(ride.rideId);
    await rideDocRef.set({
      'onboard': {
        rollNo: {
          'processingMode': processingMode,
          'timestamp': timestamp,
        }
      }
    }, SetOptions(merge: true));
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

  Future<RideModel?> createNewRide({required BusModel bus, required RouteModel route,}) async {
    try {
      // Fetch the current driver
      DriverService driverService = DriverService();
      DriverModel? currentDriver = driverService.getCurrentDriver();

      if (currentDriver == null) {
        print("Error: No current driver found in Hive.");
        return null;
      }

      // Create the ride doc in Firestore.
      DocumentReference docRef = await _firestore.collection('rides').add({
        'route_id': route.routeId,
        'ride_status': 'idle',
        'bus_id': bus.busId,
        'driver_id': currentDriver.driverId,
        'created_at': FieldValue.serverTimestamp(),
        'onboard': {},
      });

      // Create local model.
      RideModel ride = RideModel(
        rideId: docRef.id,
        routeId: route.routeId,
        rideStatus: 'idle',
        busId: bus.busId,
        driverId: currentDriver.driverId,
        onboard: {},
        etaNextStop: DateTime.now().add(const Duration(minutes: 15)),
        createdAt: DateTime.now(),
      );

      // Store in Hive.
      var rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.put('currentRide', ride);

      return ride;
    } catch (e) {
      print("Error creating new ride: $e");
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
