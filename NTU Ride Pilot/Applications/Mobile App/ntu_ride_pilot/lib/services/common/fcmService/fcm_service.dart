import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/common/notification/notification.dart';

/// Top-level background message handler
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await FCMService.instance._initLocalNotifications();
  FCMService.instance._showNotification(message);
}

/// Static entry point for background notification-tap events
@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse response) {
  // Payload is passed; handled when app foregrounds
}

class FCMService {
  FCMService._();
  static final FCMService instance = FCMService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  /// Call this from main() before runApp()
  Future<void> initialize() async {
    await Firebase.initializeApp();
    await _initLocalNotifications();

    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    print('FCM permission: ${settings.authorizationStatus}');

    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    FirebaseMessaging.onMessage.listen(_onMessageHandler);
    FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpenedApp);

    await _messaging.subscribeToTopic('announcements');
    print('Subscribed to announcements topic');
  }

  Future<void> _initLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    final initSettings = InitializationSettings(android: androidSettings);

    await _localNotificationsPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _handleNotificationResponse,
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );

    const channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'Used for important notifications.',
      importance: Importance.max,
    );

    await _localNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  void _onMessageHandler(RemoteMessage message) {
    print('Foreground message: ${message.messageId}');
    _showNotification(message);
  }

  void _onMessageOpenedApp(RemoteMessage message) {
    print('Notification tapped (app open): ${message.messageId}');
    Get.to(() => NotificationScreen());
  }

  void _handleNotificationResponse(NotificationResponse response) {
    print('Notification tapped with payload: ${response.payload}');
    Get.to(() => NotificationScreen());
  }


  Future<void> _showNotification(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;
    if (notification != null && android != null) {
      final details = NotificationDetails(
        android: AndroidNotificationDetails(
          'high_importance_channel',
          'High Importance Notifications',
          channelDescription: 'Used for important notifications.',
          importance: Importance.high,
          priority: Priority.high,
          icon: android.smallIcon,
        ),
      );

      await _localNotificationsPlugin.show(
        notification.hashCode,
        notification.title,
        notification.body,
        details,
        payload: message.data['payload'] ?? '',
      );
    }
  }
}
