import 'dart:collection';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:collection/collection.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class RideService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final Queue<String> _uploadQueue = Queue<String>();
  bool _isUploading = false;
  final Connectivity _connectivity = Connectivity();
  bool _isOnline = true;

  static const String CARD_NOT_FOUND = "CARD_NOT_FOUND";
  static const String CARD_INACTIVE = "CARD_INACTIVE";
  static const String STUDENT_ALREADY_ONBOARD = "STUDENT_ALREADY_ONBOARD";
  static const String CARD_VERIFIED = "CARD_VERIFIED";
  static const String UNKNOWN_ERROR = "UNKNOWN_ERROR";

  RideService() {
    _connectivity.onConnectivityChanged.listen((result) {
      _isOnline = result != ConnectivityResult.none;
      if (_isOnline) {
        _processOfflineScans();
      }
    });
  }

  Future<void> _processOfflineScans() async {
    var offlineBox = await Hive.openBox<Map>('offline_scans');
    var onboardBox = await Hive.openBox<Map>('onboard_records');

    var offlineScans = offlineBox.values.toList();

    if (offlineScans.isNotEmpty) {
      for (var scan in offlineScans) {
        String rollNo = scan['rollNo'];

        // Check if student is already onboard in Hive
        if (onboardBox.containsKey(rollNo)) {
          handleCardInput(STUDENT_ALREADY_ONBOARD);
          continue;
        }
        _uploadQueue.add(rollNo);
        handleCardInput(CARD_VERIFIED);
      }

      // Process only valid roll numbers
      await processUploadQueue(isOffline: true);
      await offlineBox.clear();
    }

    await offlineBox.close();
    await onboardBox.close();
  }


  Future<RideServiceResponse> handleCardInput(String input) async {
    var box = await Hive.openBox<BusCardModel>('bus_cards');
    var offlineBox = await Hive.openBox<Map>('offline_scans');
    var onboardBox = await Hive.openBox<Map>('onboard_records');

    try {
      BusCardModel? matchingCard = box.values.firstWhereOrNull(
            (card) => card.busCardId == input,
      );

      if (matchingCard == null) {
        return RideServiceResponse(statusCode: CARD_NOT_FOUND);
      }

      if (!matchingCard.isActive) {
        return RideServiceResponse(statusCode: CARD_INACTIVE);
      }

      if (onboardBox.containsKey(matchingCard.rollNo)) {
        return RideServiceResponse(
          statusCode: STUDENT_ALREADY_ONBOARD,
          busNumber: onboardBox.get(matchingCard.rollNo)?['bus_id'],
          studentName: matchingCard.name,
          rollNo: matchingCard.rollNo,
        );
      }

      if (_isOnline) {
        String? busNumber = await isStudentAlreadyOnboard(matchingCard.rollNo);

        if (busNumber != null) {
          await onboardBox.put(matchingCard.rollNo, {
            'bus_id': busNumber,
            'timestamp': DateTime.now().toIso8601String(),
          });

          return RideServiceResponse(
            statusCode: STUDENT_ALREADY_ONBOARD,
            busNumber: busNumber,
            studentName: matchingCard.name,
            rollNo: matchingCard.rollNo,
          );
        }

        _uploadQueue.add(matchingCard.rollNo);
        processUploadQueue();
      } else {
        if (!offlineBox.values.any((scan) => scan['rollNo'] == matchingCard.rollNo)) {
          await offlineBox.add({
            'rollNo': matchingCard.rollNo,
            'status': 'offline',
            'timestamp': DateTime.now().toIso8601String(),
          });
        }
      }

      return RideServiceResponse(
        statusCode: CARD_VERIFIED,
        studentName: matchingCard.name,
        rollNo: matchingCard.rollNo,
      );
    } catch (e) {
      print('❌❌❌❌❌❌❌ $e');
      return RideServiceResponse(statusCode: UNKNOWN_ERROR);
    } finally {
      await box.close();
      await offlineBox.close();
      await onboardBox.close();
    }
  }

  Future<void> processUploadQueue({bool isOffline = false}) async {
    if (_isUploading) return;

    _isUploading = true;
    final String rideDocId = "3M4ebYvkNSatUqkP6Q1j";
    DocumentReference rideDocRef = _firestore.collection("rides").doc(rideDocId);

    while (_uploadQueue.isNotEmpty) {
      String rollNo = _uploadQueue.removeFirst();

      try {
        if (isOffline) {
          await rideDocRef.set({
            "onboard": FieldValue.arrayUnion([rollNo]),
            "status": "offline",
            "offline_timestamp": DateTime.now().toIso8601String(),
          }, SetOptions(merge: true));
        } else {
          DocumentSnapshot rideSnapshot = await rideDocRef.get();
          Map<String, dynamic>? rideData = rideSnapshot.data() as Map<String, dynamic>?;

          if (rideData == null || !rideData.containsKey("onboard")) {
            await rideDocRef.set({
              "onboard": [rollNo],
            }, SetOptions(merge: true));
          } else {
            List<dynamic> onboardList = rideData["onboard"] ?? [];
            if (onboardList.contains(rollNo)) {
              continue;
            }

            await rideDocRef.update({
              "onboard": FieldValue.arrayUnion([rollNo]),
            });
          }
        }

        var onboardBox = await Hive.openBox<Map>('onboard_records');
        await onboardBox.put(rollNo, {
          'bus_id': rideDocId,
          'timestamp': DateTime.now().toIso8601String(),
        });
        await onboardBox.close();
      } catch (e) {}
    }

    _isUploading = false;
  }

  Future<String?> isStudentAlreadyOnboard(String rollNo) async {
    DateTime threeHoursAgo = DateTime.now().subtract(Duration(hours: 3));
    DateTime now = DateTime.now();

    QuerySnapshot rideDocs = await _firestore
        .collection("rides")
        .where("created_at", isGreaterThanOrEqualTo: Timestamp.fromDate(threeHoursAgo))
        .where("created_at", isLessThanOrEqualTo: Timestamp.fromDate(now))
        .get();

    for (var doc in rideDocs.docs) {
      Map<String, dynamic>? rideData = doc.data() as Map<String, dynamic>?;
      if (rideData == null || !rideData.containsKey("onboard")) continue;

      List<dynamic> onboardList = rideData["onboard"] ?? [];
      if (onboardList.contains(rollNo)) {
        return rideData["bus_id"] ?? "Unknown Bus";
      }
    }

    return null;
  }

  Future<void> fetchAndStoreBusCards(Function(bool) setLoading) async {
    setLoading(true);

    try {
      var box = await Hive.openBox<BusCardModel>('bus_cards');
      var offlineBox = await Hive.openBox<Map>('offline_scans'); // Open offline scan storage
      var onboardBox = await Hive.openBox<Map>('onboard_records'); // Open onboard records

      DateTime now = DateTime.now();

      // **Delete any offline data before syncing**
      await offlineBox.clear();
      await onboardBox.clear();

      // **Fetch data from Firestore with timeout**
      List<QueryDocumentSnapshot> docs = [];
      try {
        QuerySnapshot snapshot = await _firestore
            .collection('bus_cards')
            .get()
            .timeout(const Duration(seconds: 20));
        docs = snapshot.docs;
      } catch (e) {
        // print("⚠️ Network Issue: Failed to retrieve data from Firestore: $e");
      }

      // **Handle Offline Mode**
      if (docs.isEmpty) {
        setLoading(false);
        return;
      }

      // **Convert Firestore Data to List of BusCardModel**
      Map<String, BusCardModel> firestoreCards = {
        for (var doc in docs)
          doc.id: BusCardModel(
            busCardId: doc.id,
            rollNo: (doc.data() as Map<String, dynamic>)['roll_no'] ?? '',
            isActive: (doc.data() as Map<String, dynamic>)['isActive'] ?? true,
            name: (doc.data() as Map<String, dynamic>)['name'] ?? '',
            updatedAt: now,
          )
      };

      // **Retrieve Existing Hive Data**
      Map<String, BusCardModel> existingHiveCards = {
        for (var card in box.values) card.busCardId: card
      };

      // **Identify New or Updated Cards**
      Map<String, BusCardModel> newOrUpdatedCards = {};
      for (var entry in firestoreCards.entries) {
        if (!existingHiveCards.containsKey(entry.key) ||
            existingHiveCards[entry.key]!.updatedAt.isBefore(entry.value.updatedAt)) {
          newOrUpdatedCards[entry.key] = entry.value;
        }
      }

      // **Identify Deleted Cards**
      List<String> deletedCardIds = existingHiveCards.keys
          .where((id) => !firestoreCards.containsKey(id))
          .toList();

      // **Apply Updates and Deletions**
      if (newOrUpdatedCards.isNotEmpty) {
        await box.putAll(newOrUpdatedCards);
      }

      if (deletedCardIds.isNotEmpty) {
        await box.deleteAll(deletedCardIds);
      }

      // **Close Hive boxes**
      await box.close();
      await offlineBox.close();
      await onboardBox.close();

    } catch (e) {
      // print("❌ Error fetching bus cards: $e");
    }

    setLoading(false);
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
