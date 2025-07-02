import 'package:get/get.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/services/common/notification/notificationRepository.dart';
import 'package:ntu_ride_pilot/services/common/notification/notification_service.dart';

class NotificationController extends GetxController {
  final NotificationRepository repository = NotificationRepository();
  RxList<NotificationModel> notifications = <NotificationModel>[].obs;
  RxInt unreadCount = 0.obs;
  bool hasMore = true;
  bool isInitialized = false;
  bool _isOnNotificationScreen = false;
  RxInt uiUnreadCount = 0.obs;
  final Set<String> _uiUnreadCountedIds = {};
  final RxSet<String> initialUnreadIds = <String>{}.obs;

  @override
  void onInit() {
    super.onInit();
    initialize();
    _listenForRealtimeUpdates();
  }

  Future<void> initialize() async {
    if (!isInitialized) {
      // print("Initializing repository...");
      await repository.init();
      print("Repository initialized: ${repository.isInitialized}");
      notifications.assignAll(repository.notifications);
      _calculateUnreadCount();
      hasMore = repository.hasMore;
      isInitialized = repository.isInitialized;
    }
  }

  Future<void> onNotificationScreenOpened() async {
    _isOnNotificationScreen = true;

    // 1) snapshot how many were unread
    uiUnreadCount.value = unreadCount.value;

    // 2) capture their IDs
    initialUnreadIds
      ..clear()
      ..addAll(
        notifications
            .where((n) => !n.read && !n.isDeleted)
            .map((n) => n.notificationId),
      );

    // 3) treat them as “counted” so that new arrivals still work
    _uiUnreadCountedIds
      ..clear()
      ..addAll(initialUnreadIds);

    // 4) now mark them read (in Firestore _and_ locally)
    if (initialUnreadIds.isNotEmpty) {
      final toMark = notifications
          .where((n) => initialUnreadIds.contains(n.notificationId))
          .toList();
      await _markNotificationsRead(toMark);
    }

    // 5) reset your backend unread‐count
    unreadCount.value = 0;
    // print("Total number of notifications: ${notifications.length}");
  }

  Future<void> onNotificationScreenClosed() async {
    _isOnNotificationScreen = false;

    // Mark newly arrived unread notifications as read
    if (uiUnreadCount.value > 0) {
      final toMark =
          notifications.where((n) => !n.read && !n.isDeleted).toList();
      if (toMark.isNotEmpty) {
        await _markNotificationsRead(toMark);
      }
    }

    // Recalculate unread count after marking notifications as read
    _calculateUnreadCount();

    // Reset UI-related unread count
    uiUnreadCount.value = 0;
    unreadCount.value = 0;

    // Clear the initial unread IDs and the set of counted IDs
    initialUnreadIds.clear();
    _uiUnreadCountedIds.clear();

    // Refresh notifications to ensure no stale states
    // notifications.refresh();
    // print("Total number of notifications: ${notifications.length}");
  }

  void _calculateUnreadCount() {
    unreadCount.value =
        notifications.where((n) => !n.read && !n.isDeleted).length;
  }

  Future<List<NotificationModel>> loadMore() async {
    if (!hasMore) return [];

    final newNotifications = await repository.loadMore();
    if (newNotifications.isNotEmpty) {
      notifications.addAll(newNotifications);
      hasMore = repository.hasMore;
      _calculateUnreadCount();
    } else {
      hasMore = false;
    }
    return newNotifications;
  }

  void _listenForRealtimeUpdates() {
    repository.getLatestNotificationsStream().listen((latestNotifications) {
      final existingIds = notifications.map((e) => e.notificationId).toSet();

      final newNotifications = latestNotifications
          .where((n) => !existingIds.contains(n.notificationId))
          .toList();

      if (newNotifications.isNotEmpty) {
        notifications.insertAll(0, newNotifications);

        // Filter unread notifications that haven't been counted yet
        final newlyUnread = newNotifications
            .where((n) =>
                !n.read && !_uiUnreadCountedIds.contains(n.notificationId))
            .toList();

        if (!_isOnNotificationScreen) {
          unreadCount.value += newlyUnread.length;
          uiUnreadCount.value += newlyUnread.length;
        } else {
          uiUnreadCount.value += newlyUnread.length;
        }

        // Add these new counted notification IDs to the set
        _uiUnreadCountedIds.addAll(newlyUnread.map((e) => e.notificationId));
      }

      // Handle the deletion of notifications
      _handleDeletedNotifications(latestNotifications);
    });
  }

  // void _handleDeletedNotifications(
  //     List<NotificationModel> latestNotifications) {
  //   final currentNotificationIds =
  //       notifications.map((n) => n.notificationId).toSet();
  //   final latestNotificationIds =
  //       latestNotifications.map((n) => n.notificationId).toSet();
  //
  //   // Identify deleted notifications
  //   final deletedNotificationIds =
  //       currentNotificationIds.difference(latestNotificationIds);
  //
  //   // Remove deleted notifications from the local list
  //   notifications.removeWhere(
  //       (notif) => deletedNotificationIds.contains(notif.notificationId));
  //
  //   // Remove deleted notifications from Firestore
  //   for (var id in deletedNotificationIds) {
  //     repository.deleteNotificationFromBox(
  //         id); // Ensure this deletes from Hive as well
  //   }
  //
  //   // Recalculate unread count
  //   _calculateUnreadCount();
  // }
  void _handleDeletedNotifications(
      List<NotificationModel> latestNotifications) {
    final currentNotificationIds = notifications
        .map((n) => n.notificationId)
        .toSet(); // Cached notifications
    final latestNotificationIds = latestNotifications
        .map((n) => n.notificationId)
        .toSet(); // Latest fetched notifications

    // Identify deleted notifications - notifications that are in the cache but not in the latest batch
    final deletedNotificationIds =
        currentNotificationIds.difference(latestNotificationIds);

    // Loop through all cached notifications to ensure we remove deleted ones, even if they're not in the latest 10
    notifications.removeWhere(
        (notif) => deletedNotificationIds.contains(notif.notificationId));

    // Delete from Firestore (and Hive if applicable)
    for (var id in deletedNotificationIds) {
      repository.deleteNotificationFromBox(
          id); // Ensure this deletes from Hive as well
    }

    // Recalculate unread count after deleting the old notifications
    _calculateUnreadCount();
  }

  Future<void> _markNotificationsRead(List<NotificationModel> notifs) async {
    for (var notif in notifs) {
      if (!notif.read) {
        notif.read = true;
        // Update Firestore read status
        await NotificationService()
            .updateReadStatus(notif.notificationId, true);
      }
    }
    // Update local list and Hive cache
    notifications.refresh();
    _calculateUnreadCount();
  }
}
