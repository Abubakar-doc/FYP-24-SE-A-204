import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'dart:async';

class NotificationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  DocumentSnapshot? _lastDocument;

  Future<List<NotificationModel>> fetchInitialNotifications() async {
    final query = _firestore
        .collection('announcements')
        .orderBy('created_at', descending: true)
        .limit(10);

    final snapshot = await query.get();
    if (snapshot.docs.isNotEmpty) {
      _lastDocument = snapshot.docs.last;
    }

    return snapshot.docs
        .map((doc) => NotificationModel.fromMap(
            doc.data() as Map<String, dynamic>, doc.id))
        .toList();
  }

  Future<List<NotificationModel>> fetchNextNotifications() async {
    if (_lastDocument == null) return [];

    final query = _firestore
        .collection('announcements')
        .orderBy('created_at', descending: true)
        .startAfterDocument(_lastDocument!)
        .limit(10);

    final snapshot = await query.get();
    if (snapshot.docs.isNotEmpty) {
      _lastDocument = snapshot.docs.last;
    } else {
      _lastDocument = null;
    }

    return snapshot.docs
        .map((doc) => NotificationModel.fromMap(
            doc.data() as Map<String, dynamic>, doc.id))
        .toList();
  }

  Stream<List<NotificationModel>> getLatestNotificationsStream() {
    return _firestore
        .collection('announcements')
        .orderBy('created_at', descending: true)
        .limit(10) // Important to limit real-time updates to latest only
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => NotificationModel.fromMap(
              doc.data() as Map<String, dynamic>, doc.id))
          .toList();
    });
  }


}
