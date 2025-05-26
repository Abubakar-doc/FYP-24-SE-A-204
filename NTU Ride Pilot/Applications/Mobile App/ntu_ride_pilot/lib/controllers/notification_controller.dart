import 'package:get/get.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/services/common/notification/notificationRepository.dart';

class NotificationController extends GetxController {
  final RxSet<String> _newIdsSnapshot = <String>{}.obs;
  final RxSet<String> _currentlyNewNotificationIds = <String>{}.obs;
  Set<String> get newIdsSnapshot => _newIdsSnapshot;
  Set<String> get currentlyNewNotificationIds => _currentlyNewNotificationIds;
  final NotificationRepository _repository = NotificationRepository();
  final RxList<NotificationModel> notifications = <NotificationModel>[].obs;
  final RxInt unreadCount = 0.obs;
  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;
  bool hasMore = true;

  @override
  void onInit() {
    super.onInit();
    _init();
  }

  Set<String> get unionNewIds =>
      {..._newIdsSnapshot, ..._currentlyNewNotificationIds};

  void captureNewSnapshot() {
    _newIdsSnapshot.clear();
    _newIdsSnapshot.addAll(
        notifications.where((n) => !n.read).map((n) => n.notificationId));
  }

  void clearNewSnapshot() {
    _newIdsSnapshot.clear();
    _currentlyNewNotificationIds.clear();
  }

  void _handleNewNotifications(List<NotificationModel> updatedList) {
    final newUnread = updatedList.where((n) => !n.read).toList();

    final currentUnreadCount = notifications.where((n) => !n.read).length;

    if (currentUnreadCount == 0 && newUnread.isNotEmpty) {
      // All read previously, new unread arrived → reset snapshot and currentlyNew sets
      _newIdsSnapshot.clear();
      _currentlyNewNotificationIds.clear();

      _newIdsSnapshot.addAll(newUnread.map((n) => n.notificationId));
    } else {
      // Normal update: add only new unread IDs arriving after screen open
      for (var notif in newUnread) {
        if (!_currentlyNewNotificationIds.contains(notif.notificationId) &&
            !_newIdsSnapshot.contains(notif.notificationId)) {
          _currentlyNewNotificationIds.add(notif.notificationId);
        }
      }
    }

    // Do NOT remove IDs from _newIdsSnapshot on read, so snapshot stays intact

    // Remove read notifications only from currentlyNewNotificationIds so new ones disappear as read
    _currentlyNewNotificationIds.removeWhere(
        (id) => notifications.any((n) => n.notificationId == id && n.read));
  }

  Future<void> _init() async {
    if (_isInitialized) return;
    await _repository.init();

    notifications.assignAll(_repository.notifications);
    _updateUnreadCount();

    // Initially add all unread notifications to currentlyNew set
    addCurrentlyNew(notifications.where((n) => !n.read).toList());

    _repository.getLatestNotificationsStream().listen((updatedList) {
      notifications.assignAll(updatedList);
      _updateUnreadCount();

      final newUnread = updatedList.where((n) => !n.read).toList();

      // Add any new unread notification IDs to currentlyNewNotificationIds (don't clear to keep old unread)
      for (var notif in newUnread) {
        if (!_currentlyNewNotificationIds.contains(notif.notificationId)) {
          _currentlyNewNotificationIds.add(notif.notificationId);
        }
      }

      // Remove IDs from currentlyNewNotificationIds if notification is read
      _currentlyNewNotificationIds.removeWhere(
          (id) => notifications.any((n) => n.notificationId == id && n.read));

      // Trigger UI update
      notifications.refresh();
    });

    _isInitialized = true;
  }

  // void _updateUnreadCount() {
  //   unreadCount.value = notifications.where((n) => !n.read).length;
  //
  //   if (unreadCount.value == 0) {
  //     // No unread notifications → clear the "currently new" set to avoid stale IDs
  //     resetCurrentlyNew();
  //   }
  // }
  void _updateUnreadCount() {
    unreadCount.value = unionNewIds.length;

    if (unreadCount.value == 0) {
      resetCurrentlyNew();
    }
  }


  Future<void> markAsRead(String notificationId) async {
    await _repository.markAsRead(notificationId);

    int idx =
        notifications.indexWhere((n) => n.notificationId == notificationId);
    if (idx != -1 && !notifications[idx].read) {
      notifications[idx].read = true;
      notifications.refresh();
      _updateUnreadCount();

      // But DO NOT remove from currentlyNew here to keep "New" until screen closes
      // removeCurrentlyNew(notificationId); // <-- Don't call here
    }
  }

  Future<void> markAsUnread(String notificationId) async {
    await _repository.markAsUnread(notificationId);
    int idx =
        notifications.indexWhere((n) => n.notificationId == notificationId);
    if (idx != -1) {
      notifications[idx].read = false;
      notifications.refresh();
      _updateUnreadCount();
    }
  }

  Future<List<NotificationModel>> loadMore() async {
    if (!hasMore) return [];
    final newNotifications = await _repository.loadMore();
    if (newNotifications.isEmpty) {
      hasMore = false;
    } else {
      notifications.addAll(newNotifications);
    }
    return newNotifications;
  }

  void resetCurrentlyNew() {
    _currentlyNewNotificationIds.clear();
  }

  void addCurrentlyNew(List<NotificationModel> newNotifications) {
    _currentlyNewNotificationIds
        .addAll(newNotifications.map((n) => n.notificationId));
  }

  void removeCurrentlyNew(String notificationId) {
    _currentlyNewNotificationIds.remove(notificationId);
  }

  void onScreenOpened() {
    // Capture unread snapshot at open
    _newIdsSnapshot.clear();
    _newIdsSnapshot.addAll(notifications.where((n) => !n.read).map((n) => n.notificationId));

    // Reset currently new set to empty at open
    _currentlyNewNotificationIds.clear();

    _updateUnreadCount();
  }

  void onScreenClosed() {
    // Clear all new notification tracking when leaving the screen
    _newIdsSnapshot.clear();
    _currentlyNewNotificationIds.clear();

    _updateUnreadCount();
  }

}
