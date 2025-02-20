import 'dart:async';
import 'dart:collection';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:collection/collection.dart';
import 'package:hive/hive.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';

class RideService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final Connectivity _connectivity = Connectivity();
  bool _isOnline = true;
  final Queue<Map<String, dynamic>> _verificationQueue = Queue();
  late Timer _queueProcessor;

  static const String CARD_NOT_FOUND = "CARD_NOT_FOUND";
  static const String CARD_INACTIVE = "CARD_INACTIVE";
  static const String STUDENT_ALREADY_ONBOARD = "STUDENT_ALREADY_ONBOARD";
  static const String CARD_VERIFIED = "CARD_VERIFIED";
  static const String UNKNOWN_ERROR = "UNKNOWN_ERROR";
  static const String NETWORK_ERROR = "NETWORK_ERROR";

  RideService() {
    _connectivity.onConnectivityChanged.listen((result) {
      _isOnline = result != ConnectivityResult.none;
      if (_isOnline) {
        _processQueue();
      }
    });

    // Start processing the queue every 5 seconds
    _queueProcessor = Timer.periodic(Duration(seconds: 5), (_) => _processQueue());
  }

  /// Handles card input and verifies the card locally.
  Future<RideServiceResponse> handleCardInput(String input) async {
    var busCardBox = await Hive.openBox<BusCardModel>('bus_cards');
    var onboardBox = await Hive.openBox<Map>('onboard_records');

    try {
      BusCardModel? matchingCard = busCardBox.values.firstWhereOrNull(
            (card) => card.busCardId == input,
      );

      if (matchingCard == null) {
        return RideServiceResponse(statusCode: CARD_NOT_FOUND);
      }

      if (!matchingCard.isActive) {
        return RideServiceResponse(statusCode: CARD_INACTIVE);
      }

      // Check if the student is already onboard in the current  ride
      if (onboardBox.containsKey(matchingCard.rollNo)) {
        return RideServiceResponse(
          statusCode: STUDENT_ALREADY_ONBOARD,
          busNumber: onboardBox.get(matchingCard.rollNo)?['bus_id'],
          studentName: matchingCard.name,
          rollNo: matchingCard.rollNo,
        );
      }

      // Add the card verification task to the queue
      _verificationQueue.add({
        'rollNo': matchingCard.rollNo,
        'name': matchingCard.name,
        'processingMode': _isOnline ? 'online' : 'offline',
      });

      // Register the student in the onboard box temporarily
      await onboardBox.put(matchingCard.rollNo, {
        'bus_id': "current_bus_id", // Replace with the actual bus ID
        'timestamp': DateTime.now().toIso8601String(),
        'status': _isOnline ? 'online' : 'offline',
      });

      return RideServiceResponse(
        statusCode: CARD_VERIFIED,
        studentName: matchingCard.name,
        rollNo: matchingCard.rollNo,
      );
    } catch (e) {
      print("Error handling card input ❌❌❌❌❌❌❌❌: $e");
      return RideServiceResponse(statusCode: UNKNOWN_ERROR);
    }
  }

  /// Processes the verification queue in the background.
  Future<void> _processQueue() async {
    if (!_isOnline) return; // Skip processing if offline

    while (_verificationQueue.isNotEmpty) {
      var task = _verificationQueue.removeFirst();
      String rollNo = task['rollNo'];
      String name = task['name'];
      String processingMode = task['processingMode'];

      try {
        await _updateOnboardStatus(rollNo, processingMode: processingMode);
      } catch (e) {
        print("Error processing queue task: $e");
        // Re-add the task to the queue if it fails
        _verificationQueue.add(task);
      }
    }
  }

  /// Updates the onboard status of a student in Firestore and Hive.
  Future<void> _updateOnboardStatus(String rollNo, {required String processingMode}) async {
    var onboardBox = await Hive.openBox<Map>('onboard_records');
    final String rideDocId = "3M4ebYvkNSatUqkP6Q1j";
    DocumentReference rideDocRef = _firestore.collection("rides").doc(rideDocId);

    String timestamp = DateTime.now().toIso8601String();

    try {
      // Update Firestore
      await rideDocRef.set({
        'onboard': {
          rollNo: {
            "status": processingMode,
            "timestamp": timestamp,
          }
        }
      }, SetOptions(merge: true));

      // Update Hive
      await onboardBox.put(rollNo, {
        'bus_id': rideDocId,
        'timestamp': timestamp,
        'status': processingMode,
      });
    } catch (e) {
      print("Error updating onboard status: $e");
      rethrow; // Propagate the error to handle it in the calling function
    }
  }

  /// Fetches and stores bus cards from Firestore to Hive.
  Future<void> fetchAndStoreBusCards(Function(bool) setLoading) async {
    setLoading(true);

    try {
      var busCardBox = await Hive.openBox<BusCardModel>('bus_cards');
      var offlineBox = await Hive.openBox<Map>('offline_scans');
      var onboardBox = await Hive.openBox<Map>('onboard_records');

      // Clear old data
      await offlineBox.clear();
      await onboardBox.clear();

      // Fetch data from Firestore with a timeout
      QuerySnapshot snapshot = await _firestore.collection('bus_cards').get().timeout(Duration(seconds: 10));
      Map<String, BusCardModel> firestoreCards = {
        for (var doc in snapshot.docs)
          doc.id: BusCardModel(
            busCardId: doc.id,
            rollNo: (doc.data() as Map<String, dynamic>)['roll_no'] ?? '',
            isActive: (doc.data() as Map<String, dynamic>)['isActive'] ?? true,
            name: (doc.data() as Map<String, dynamic>)['name'] ?? '',
            updatedAt: DateTime.now(),
          )
      };

      // Update Hive with new or updated cards
      await busCardBox.putAll(firestoreCards);
    } on TimeoutException {
      print("Network timeout while fetching bus cards.");
    } catch (e) {
      print("Error fetching bus cards: $e");
    } finally {
      setLoading(false);
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