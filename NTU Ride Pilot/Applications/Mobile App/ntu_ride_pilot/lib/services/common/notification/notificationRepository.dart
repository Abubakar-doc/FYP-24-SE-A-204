import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/services/common/notification/notification_service.dart';

class NotificationRepository {
  static final NotificationRepository _instance =
  NotificationRepository._internal();
  factory NotificationRepository() => _instance;
  NotificationRepository._internal();
  final NotificationService _notificationService = NotificationService();
  late Box<NotificationModel> _notificationBox;
  List<NotificationModel> notifications = [];
  bool hasMore = true;
  bool isInitialized = false;

  Stream<List<NotificationModel>> getLatestNotificationsStream() {
    return _notificationService.getLatestNotificationsStream();
  }

  Future<void> init() async {
    if (isInitialized) return;

    _notificationBox = await Hive.openBox<NotificationModel>('notificationBox');

    // Load cached notifications
    notifications = _notificationBox.values.toList();

    // Initialize hasMore based on cached data count
    hasMore = notifications.length >= 10;

    // Fetch fresh notifications but merge without duplicates
    final fresh = await _notificationService.fetchInitialNotifications();

    final existingIds = notifications.map((e) => e.notificationId).toSet();
    final newUnique =
    fresh.where((n) => !existingIds.contains(n.notificationId)).toList();

    if (newUnique.isNotEmpty) {
      notifications.addAll(newUnique);
      hasMore = fresh.length >= 10;
      await _notificationBox.addAll(newUnique);
    }

    isInitialized = true;
  }

  Future<List<NotificationModel>> loadMore() async {
    if (!hasMore) return [];

    final newNotifications =
    await _notificationService.fetchNextNotifications();
    if (newNotifications.isNotEmpty) {
      notifications.addAll(newNotifications);
      hasMore = newNotifications.length >= 10;
      await _notificationBox.addAll(newNotifications);
    } else {
      hasMore = false;
    }
    return newNotifications;
  }

  Future<void> deleteNotificationFromBox(String notificationId) async {
    final keyToDelete = _notificationBox.keys.firstWhere(
          (key) {
        final notification = _notificationBox.get(key);
        return notification?.notificationId == notificationId;
      },
      orElse: () => null,
    );

    if (keyToDelete != null) {
      print("Deleting notification with ID $notificationId from Hive");
      await _notificationBox.delete(keyToDelete);
    } else {
      print("Notification with ID $notificationId not found in Hive");
    }
  }
}