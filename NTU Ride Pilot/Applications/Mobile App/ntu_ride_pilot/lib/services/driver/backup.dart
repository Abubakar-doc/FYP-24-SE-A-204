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
    print("📢 Processing Offline Scans: Found ${offlineScans.length} entries.");

    if (offlineScans.isNotEmpty) {
      for (var scan in offlineScans) {
        String rollNo = scan['rollNo'];

        // Check if student is already onboard in Hive
        if (onboardBox.containsKey(rollNo)) {
          print("⚠️ Roll No: $rollNo is already onboard. Skipping...");
          handleCardInput(STUDENT_ALREADY_ONBOARD);
          continue;
        }

        // Ensure it's stored in offline_scans
        if (!offlineBox.containsKey(rollNo)) {
          await offlineBox.put(rollNo, scan);
        }

        print("📌 Adding Roll No: $rollNo to Upload Queue (Offline)");
        _uploadQueue.add(rollNo);
        handleCardInput(CARD_VERIFIED);
      }

      // ✅ Force offline processing, regardless of connectivity
      await processUploadQueue(isOffline: true);

      print("🗑️ Clearing offline scans after upload.");
      await offlineBox.clear();
    }
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
      print("❌❌❌❌$e");
      return RideServiceResponse(statusCode: UNKNOWN_ERROR);
    } finally {
      // await box.close();
      // await offlineBox.close();
      // await onboardBox.close();
    }
  }

  Future<void> processUploadQueue({bool isOffline = false}) async {
    if (_isUploading) return;

    _isUploading = true;
    print("🚀 Starting processUploadQueue - isOffline: $isOffline");

    final String rideDocId = "3M4ebYvkNSatUqkP6Q1j";
    DocumentReference rideDocRef = _firestore.collection("rides").doc(rideDocId);

    while (_uploadQueue.isNotEmpty) {
      String rollNo = _uploadQueue.removeFirst();
      String timestamp = DateTime.now().toIso8601String();
      String status = isOffline ? "offline" : "online";

      print("🔄 Processing Roll No: $rollNo");
      print("🕒 Timestamp: $timestamp");
      print("📡 Status being set: $status");

      try {
        DocumentSnapshot rideSnapshot = await rideDocRef.get();
        Map<String, dynamic>? rideData = rideSnapshot.data() as Map<String, dynamic>?;

        // **Ensure `offline_scans` is a Map**
        Map<String, dynamic> offlineScans = {};
        if (rideData != null && rideData.containsKey("offline_scans")) {
          var existingData = rideData["offline_scans"];
          if (existingData is Map) {
            offlineScans = Map<String, dynamic>.from(existingData);
          }
        }

        if (isOffline) {
          print("📝 Storing as OFFLINE scan for Roll No: $rollNo");

          offlineScans[rollNo] = {
            "status": "offline",
            "timestamp": timestamp,
          };

          await rideDocRef.set({
            "offline_scans": offlineScans
          }, SetOptions(merge: true));

          print("✅ Successfully stored in offline_scans");
        }

        // **Ensure `onboard` is a Map**
        Map<String, dynamic> onboard = {};
        if (rideData != null && rideData.containsKey("onboard")) {
          var existingOnboard = rideData["onboard"];
          if (existingOnboard is Map) {
            onboard = Map<String, dynamic>.from(existingOnboard);
          }
        }

        print("📋 Current onboard data before update: $onboard");

        if (!onboard.containsKey(rollNo)) {
          print("🚀 Adding Roll No: $rollNo to ONBOARD list");

          onboard[rollNo] = {
            "status": status,  // ⚠️ This might be causing the issue
            "timestamp": timestamp,
          };

          await rideDocRef.set({
            "onboard": onboard
          }, SetOptions(merge: true));

          print("✅ Successfully stored in onboard with status: $status");
        } else {
          print("⚠️ Roll No: $rollNo already exists in onboard, skipping update.");
        }

        // **Store in Local Hive Storage**
        var onboardBox = await Hive.openBox<Map>('onboard_records');
        await onboardBox.put(rollNo, {
          'bus_id': rideDocId,
          'timestamp': timestamp,
          'status': status,
        });

        print("📦 Stored in Hive onboard_records with status: $status");
        await onboardBox.close();

      } catch (e) {
        print("❌ Error uploading $rollNo: $e");
      }
    }

    print("✅ Finished processing upload queue.");
    _isUploading = false;
  }

  Future<String?> isStudentAlreadyOnboard(String rollNo) async {
    var onboardBox = await Hive.openBox<Map>('onboard_records');

    // **Check Locally in Hive Storage First**
    if (onboardBox.containsKey(rollNo)) {
      String? busId = onboardBox.get(rollNo)?['bus_id'];
      await onboardBox.close();
      return busId;
    }

    // **If Not Found in Hive, Check Firestore**
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

      Map<String, dynamic> onboardMap = rideData["onboard"] ?? {};

      // **Check if Student is Onboard in Firestore**
      if (onboardMap.containsKey(rollNo)) {
        String? busId = rideData["bus_id"] as String?;

        // **Store in Hive for Faster Access Next Time**
        if (busId != null) {
          await onboardBox.put(rollNo, {
            'bus_id': busId,
            'timestamp': DateTime.now().toIso8601String(),
          });
        }

        // await onboardBox.close();
        return busId;
      }
    }

    // await onboardBox.close();
    return null; // Student is not onboard
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
      // await box.clear();
      // await offlineBox.clear();
      // await onboardBox.clear();

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
