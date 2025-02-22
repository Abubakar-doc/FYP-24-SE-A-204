import 'dart:async';
import 'dart:collection';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:hive/hive.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';

class RideService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  // Use InternetConnectionChecker for reliable connectivity status.
  final InternetConnectionChecker _connectionChecker = InternetConnectionChecker.createInstance();
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
    _queueProcessor = Timer.periodic(Duration(seconds: 5), (_) => _processQueue());
  }

  /// Handles a card input. Depending on connectivity, the method:
  /// - Checks the local ride (from the "rides" box) for duplicate onboard entries.
  /// - If online, checks Firestore for duplicate onboard entries on other rides.
  /// - Boards the card in the local RideModel with the appropriate processing mode ("online" or "offline")
  ///   along with a timestamp.
  /// - Dispatches the Firestore update in parallel (without awaiting it) and adds the task to a background queue.
  Future<RideServiceResponse> handleCardInput(String input) async {
    try {
      var busCardBox = await Hive.openBox<BusCardModel>('bus_cards');
      var rideBox = await Hive.openBox<RideModel>('rides');

      // Find the matching bus card.
      BusCardModel? matchingCard = busCardBox.values.firstWhereOrNull(
            (card) => card.busCardId == input,
      );

      if (matchingCard == null) {
        return RideServiceResponse(statusCode: CARD_NOT_FOUND);
      }
      if (!matchingCard.isActive) {
        return RideServiceResponse(statusCode: CARD_INACTIVE);
      }

      // Retrieve or create the current ride.
      RideModel? currentRide = rideBox.get('currentRide');
      if (currentRide == null) {
        currentRide = RideModel(
          rideId: '3M4ebYvkNSatUqkP6Q1j', // Replace with your ID generation logic.
          routeId: 'current_route_id',
          rideStatus: 'idle',
          busId: '101',
          driverId: 'current_driver_id',
          onboard: {}, // Nested map for onboard details.
          etaNextStop: DateTime.now().add(Duration(minutes: 15)),
        );
        await rideBox.put('currentRide', currentRide);
      }

      // Check if the card is already onboard in the local ride.
      if (currentRide.onboard.containsKey(matchingCard.rollNo)) {
        return RideServiceResponse(
          statusCode: STUDENT_ALREADY_ONBOARD,
          busNumber: currentRide.busId,
          studentName: matchingCard.name,
          rollNo: matchingCard.rollNo,
        );
      }

      // Online scenario: Check Firestore for duplicate onboard.
      if (_isOnline) {
        QuerySnapshot querySnapshot = await _firestore
            .collection('rides')
            .where('onboard.${matchingCard.rollNo}', isNull: false)
            .get();

        if (querySnapshot.docs.isNotEmpty) {
          var docData = querySnapshot.docs.first.data() as Map<String, dynamic>;
          String busId = docData['bus_id'] ?? '';
          return RideServiceResponse(
            statusCode: STUDENT_ALREADY_ONBOARD,
            busNumber: busId,
            studentName: matchingCard.name,
            rollNo: matchingCard.rollNo,
          );
        }
      }

      // Determine processing mode based on connectivity.
      String processingMode = _isOnline ? 'online' : 'offline';
      String timestamp = DateTime.now().toIso8601String();

      // Update the local RideModel immediately.
      currentRide.onboard[matchingCard.rollNo] = {
        'processingMode': processingMode,
        'timestamp': timestamp,
      };
      await rideBox.put('currentRide', currentRide);

      // Dispatch Firestore update in parallel (if online) without awaiting.
      if (_isOnline) {
        _updateOnboardStatus(
          rollNo: matchingCard.rollNo,
          processingMode: processingMode,
          timestamp: timestamp,
          ride: currentRide,
        ).catchError((e) => print("Error updating Firestore in parallel: $e"));
      }

      // Add the card to the upload queue for background processing.
      _uploadQueue.add({
        'rollNo': matchingCard.rollNo,
        'processingMode': processingMode,
        'timestamp': timestamp,
      });

      // Return the verification result immediately.
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

  /// Processes the upload queue.
  /// Each queued task is attempted to be uploaded to Firestore.
  /// Offline items are retried when connectivity returns.
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

  /// Updates the onboard status for a given card in Firestore.
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

  /// Fetches and stores bus cards from Firestore to Hive.
  /// Also clears temporary boxes (offline scans and current ride).
  Future<void> fetchAndStoreBusCards() async {
    try {
      // Open the persistent bus cards box and temporary boxes.
      var box = await Hive.openBox<BusCardModel>('bus_cards');
      var offlineBox = await Hive.openBox<Map>('offline_scans'); // Temporary storage.
      var rideBox = await Hive.openBox<RideModel>('rides');         // Current ride details.

      // Clear out temporary boxes.
      await offlineBox.clear();
      await rideBox.clear();

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


  Future<List<String>> fetchBuses() async {
    try {
      QuerySnapshot busSnapshot = await _firestore.collection('buses').get();
      return busSnapshot.docs.map((doc) => doc.id).toList();
    } catch (e) {
      print("Error fetching buses: $e");
      return [];
    }
  }

  Future<List<String>> fetchRoutes() async {
    try {
      QuerySnapshot routeSnapshot = await _firestore.collection('routes').get();
      return routeSnapshot.docs.map((doc) => (doc.data() as Map<String, dynamic>)['name'] as String).toList();
    } catch (e) {
      print("Error fetching routes: $e");
      return [];
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
