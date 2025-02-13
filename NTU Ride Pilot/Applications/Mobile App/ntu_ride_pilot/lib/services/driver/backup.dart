import 'dart:collection';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:collection/collection.dart';

class RideService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final Queue<String> _uploadQueue = Queue<String>();
  bool _isUploading = false;
  static const String CARD_NOT_FOUND = "CARD_NOT_FOUND";
  static const String CARD_INACTIVE = "CARD_INACTIVE";
  static const String STUDENT_ALREADY_ONBOARD = "STUDENT_ALREADY_ONBOARD";
  static const String CARD_VERIFIED = "CARD_VERIFIED";
  static const String UNKNOWN_ERROR = "UNKNOWN_ERROR";


  Future<void> fetchAndStoreBusCards(Function(bool) setLoading) async {
    setLoading(true);

    try {
      var box = await Hive.openBox<BusCardModel>('bus_cards');
      DateTime now = DateTime.now();

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
        // print("⚠️ Using Local Hive Data (No Internet or Timeout)");
        // SnackbarUtil.showInfo("Offline Mode", "Using locally stored bus cards.");
        setLoading(false);
        return;
      }

      // print("✅ Retrieved ${docs.length} bus cards from Firestore.");

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
        // print("✅ Updated ${newOrUpdatedCards.length} bus cards in Hive.");
      }

      if (deletedCardIds.isNotEmpty) {
        await box.deleteAll(deletedCardIds);
        // print("🗑 Deleted ${deletedCardIds.length} bus cards from Hive.");
      }



      // **Step 3: Find Specific Bus Card (if needed)**
      // String targetRollNo = "00-NTU-CS-0392"; // Change this to test different roll numbers
      //
      // BusCardModel? matchingCard = box.values.firstWhere(
      //       (card) => card.rollNo == targetRollNo,
      //   orElse: () => BusCardModel(
      //     busCardId: "N/A",
      //     rollNo: "N/A",
      //     isActive: false,
      //     name: "Unknown",
      //     updatedAt: DateTime.now(),
      //   ),
      // );
      //
      // if (matchingCard.rollNo != "N/A") {
      //   print("Found Bus Card: ${matchingCard.rollNo}, Name: ${matchingCard.busCardId}");
      // } else {
      //   print("Bus Card with roll number $targetRollNo not found in Hive.");
      // }



      // print("📊 Total Bus Cards in Hive: ${box.length}");
      // SnackbarUtil.showSuccess("✅ Data Synced", "Bus cards have been refreshed.");

    } catch (e) {
      // SnackbarUtil.showError("❌ Error", "Failed to update bus cards. $e");
      // print("❌ Error fetching bus cards: $e");
    }

    setLoading(false);
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

  Future<void> processUploadQueue() async {
    if (_isUploading) return;

    _isUploading = true;
    final String rideDocId = "3M4ebYvkNSatUqkP6Q1j";
    DocumentReference rideDocRef = _firestore.collection("rides").doc(rideDocId);

    while (_uploadQueue.isNotEmpty) {
      String rollNo = _uploadQueue.removeFirst();

      try {
        DocumentSnapshot rideSnapshot = await rideDocRef.get();

        if (!rideSnapshot.exists) {
          await rideDocRef.set({"onboard": [rollNo]});
          // print("✅ Created 'onboard' field & stored roll number $rollNo.");
        } else {
          Map<String, dynamic>? rideData = rideSnapshot.data() as Map<String, dynamic>?;
          if (rideData == null || !rideData.containsKey("onboard")) {
            await rideDocRef.set({"onboard": [rollNo]}, SetOptions(merge: true));
          } else {
            await rideDocRef.update({
              "onboard": FieldValue.arrayUnion([rollNo]),
            });
          }
        }
      } catch (e) {
        // print("❌ Failed to store roll number $rollNo: $e");
      }

    }

    _isUploading = false;
  }

  Future<RideServiceResponse> handleCardInput(String input) async {
    var box = await Hive.openBox<BusCardModel>('bus_cards');

    try {
      BusCardModel? matchingCard = box.values.firstWhereOrNull(
            (card) => card.busCardId == input,
      );

      if (matchingCard == null) {
        return RideServiceResponse(statusCode: CARD_NOT_FOUND); // Card not found
      }

      if (!matchingCard.isActive) {
        return RideServiceResponse(statusCode: CARD_INACTIVE); // Card inactive
      }

      String? busNumber = await isStudentAlreadyOnboard(matchingCard.rollNo);

      if (busNumber != null) {
        return RideServiceResponse(
          statusCode: STUDENT_ALREADY_ONBOARD,
          busNumber: busNumber,
          studentName: matchingCard.name,
          rollNo: matchingCard.rollNo,
        );
      }

      _uploadQueue.add(matchingCard.rollNo);
      processUploadQueue();

      return RideServiceResponse(
        statusCode: CARD_VERIFIED,
        studentName: matchingCard.name,
        rollNo: matchingCard.rollNo,
      );
    } catch (e) {
      return RideServiceResponse(statusCode: UNKNOWN_ERROR); // Unknown error
    } finally {
      await box.close();
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