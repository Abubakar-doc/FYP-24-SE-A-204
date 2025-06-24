import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'dart:async';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  DocumentSnapshot? _lastDocument;
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();
  NotificationService._internal();

  Future<void> init() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    final InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  }

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

  Future<void> showProgressNotification(int id, int progress) async {
    final androidDetails = AndroidNotificationDetails(
      'download_channel',
      'Image Downloads',
      channelDescription: 'Notifications for image download progress',
      importance: Importance.low,
      priority: Priority.low,
      onlyAlertOnce: true,
      showProgress: true,
      maxProgress: 100,
      progress: progress,
    );

    final details = NotificationDetails(android: androidDetails);

    await flutterLocalNotificationsPlugin.show(
      id,
      'Downloading Image',
      'Download in progress: $progress%',
      details,
      payload: 'download_progress',
    );
  }

  Future<void> showDownloadCompleteNotification(int id) async {
    final androidDetails = AndroidNotificationDetails(
      'download_channel',
      'Image Downloads',
      channelDescription: 'Notifications for image download progress',
      importance: Importance.high,
      priority: Priority.high,
    );

    final details = NotificationDetails(android: androidDetails);

    await flutterLocalNotificationsPlugin.show(
      id,
      'Download Complete',
      'Image has been downloaded successfully!',
      details,
      payload: 'download_complete',
    );
  }

  Future<void> cancelNotification(int id) async {
    await flutterLocalNotificationsPlugin.cancel(id);
  }

  Future<void> updateReadStatus(String notificationId, bool readStatus) async {
    await _firestore.collection('announcements').doc(notificationId).update({
      'read': readStatus,
    });
  }
}
