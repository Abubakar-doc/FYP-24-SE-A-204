import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ntu_ride_pilot/controllers/notification_controller.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/screens/common/notification/widget/notifcation_list.dart';
import 'package:ntu_ride_pilot/screens/common/notification/widget/notification_list_loading_placeholder.dart';
import 'package:ntu_ride_pilot/services/common/permission/notification_permission.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;
  final NotificationController controller = Get.find();
  final ScrollController _scrollController = ScrollController();
  final NotificationPermission _notificationPermission =
      NotificationPermission();
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    controller.onNotificationScreenOpened();
    _requestNotificationPermission();
    _scrollController.addListener(_scrollListener);
  }

  @override
  void dispose() {
    controller.onNotificationScreenClosed();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _requestNotificationPermission() async {
    await _notificationPermission.requestPermission();
  }

  void _scrollListener() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        controller.hasMore) {
      _loadMoreNotifications();
    }
  }

  Future<void> _loadMoreNotifications() async {
    if (_isLoadingMore || !controller.hasMore) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final newNotifications = await controller.loadMore();
      if (newNotifications.isNotEmpty) {
        // Grouping and UI update will happen automatically because `notifications` is reactive
      }
    } catch (e) {
      // debugPrint('Error loading more notifications: $e');
      controller.hasMore = false;
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    }
  }

  String _formatDate(DateTime timestamp) {
    final today = DateTime.now();
    final yesterday = today.subtract(const Duration(days: 1));

    if (timestamp.year == today.year &&
        timestamp.month == today.month &&
        timestamp.day == today.day) {
      return 'Today';
    } else if (timestamp.year == yesterday.year &&
        timestamp.month == yesterday.month &&
        timestamp.day == yesterday.day) {
      return 'Yesterday';
    } else {
      return DateFormat('dd MMMM, yyyy').format(timestamp);
    }
  }

  Map<String, List<NotificationModel>> _groupNotifications(
      List<NotificationModel> notifications) {
    final grouped = <String, List<NotificationModel>>{};

    for (var n in notifications) {
      final date = _formatDate(n.createdAt);
      grouped.putIfAbsent(date, () => []).add(n);
    }

    grouped.forEach((key, list) {
      list.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    });

    return grouped;
  }

  String _formatTimestamp(DateTime timestamp) {
    return DateFormat('h:mm a').format(timestamp);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    final theme = Theme.of(context);

    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Notifications',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        ),
        body: Obx(() {
          final notifications = controller.notifications;

          if (notifications.isEmpty) {
            if (controller.isInitialized) {
              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Center(
                    child: Image.asset('assets/pictures/noNotification.png')),
              );
            } else {
              return const NotificationListLoadingPlaceholder();
            }
          }

          final groupedNotifications =
              _groupNotifications(controller.notifications);

          return Padding(
              padding: const EdgeInsets.all(16.0),
              child: NotificationList(
                scrollController: _scrollController,
                groupedNotifications: groupedNotifications,
                isLoadingMore: _isLoadingMore,
                hasMore: controller.hasMore,
                theme: theme,
                isLoading: false,
                formatTimestamp: _formatTimestamp,
                unreadCount: controller.uiUnreadCount.value,
                initialUnreadIds: controller.initialUnreadIds,
              ));
        }),
      ),
    );
  }
}
