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

  @override
  void onInit() {
    super.onInit();
    _initialize();
    _listenForRealtimeUpdates();
  }

  Future<void> _initialize() async {
    await repository.init();
    notifications.assignAll(repository.notifications);
    _calculateUnreadCount();
    hasMore = repository.hasMore;
    isInitialized = repository.isInitialized;
  }

  void _calculateUnreadCount() {
    unreadCount.value =
        notifications.where((n) => !n.read && !n.isDeleted).length;
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
    });
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

  Future<void> onNotificationScreenOpened() async {
    _isOnNotificationScreen = true;

    // Initialize UI unread count from actual unread count
    uiUnreadCount.value = unreadCount.value;

    // Add all current unread notification IDs to the counted set
    _uiUnreadCountedIds.clear();
    final currentUnreadNotifs =
        notifications.where((n) => !n.read && !n.isDeleted).toList();
    _uiUnreadCountedIds
        .addAll(currentUnreadNotifs.map((e) => e.notificationId));

    // Mark all unread as read
    if (currentUnreadNotifs.isNotEmpty) {
      await _markNotificationsRead(currentUnreadNotifs);
    }

    unreadCount.value = 0;

    // Do NOT clear _uiUnreadCountedIds here because you want to track new incoming messages correctly
  }

  Future<void> onNotificationScreenClosed() async {
    _isOnNotificationScreen = false;

    uiUnreadCount.value = 0;
    unreadCount.value = 0;

    // Also clear the tracking set on close if you want
    _uiUnreadCountedIds.clear();
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
}
