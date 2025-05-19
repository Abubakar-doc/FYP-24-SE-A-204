import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/screens/common/notification/widget/notifcation_widgets.dart';
import 'package:ntu_ride_pilot/services/common/notification.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:url_launcher/url_launcher.dart';
import 'notification.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final NotificationService _notificationService = NotificationService();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  List<NotificationModel> _notifications = [];
  Map<String, List<NotificationModel>> groupedNotifications = {};

  @override
  void initState() {
    super.initState();
    _loadInitialNotifications();
    _scrollController.addListener(_scrollListener);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  // Fetch initial notifications and listen to changes
  Future<void> _loadInitialNotifications() async {
    try {
      final notifications =
      await _notificationService.fetchInitialNotifications();
      setState(() {
        _notifications = notifications;
        _groupNotifications();
      });

      // Subscribe to real-time updates for notifications
      _notificationService.getLatestNotificationsStream().listen((newNotifications) {
        setState(() {
          _notifications = newNotifications;
          _groupNotifications();
        });
      });

      await _precacheImages(notifications);
    } catch (e) {
      debugPrint('Error loading notifications: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Fetch more notifications on scroll
  Future<void> _loadMoreNotifications() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final newNotifications =
      await _notificationService.fetchNextNotifications();
      setState(() {
        _notifications.addAll(newNotifications);
        _hasMore = newNotifications.isNotEmpty;
        _groupNotifications();
      });
      await _precacheImages(newNotifications);
    } catch (e) {
      debugPrint('Error loading more notifications: $e');
    } finally {
      setState(() {
        _isLoadingMore = false;
      });
    }
  }

  // Group notifications by date
  void _groupNotifications() {
    groupedNotifications = {};
    for (var notification in _notifications) {
      final date = formatDate(notification.createdAt);
      if (!groupedNotifications.containsKey(date)) {
        groupedNotifications[date] = [];
      }
      groupedNotifications[date]?.add(notification);
    }
  }

  // Scroll listener to fetch more notifications
  void _scrollListener() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      _loadMoreNotifications();
    }
  }

  String formatTimestamp(DateTime timestamp) {
    return DateFormat('h:mm a').format(timestamp);
  }

  String formatDate(DateTime timestamp) {
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

  Future<void> _precacheImages(List<NotificationModel> notifications) async {
    for (var notification in notifications) {
      final mediaLinks = notification.mediaLinks ?? [];
      for (var link in mediaLinks) {
        try {
          if (link.toString().endsWith('.jpg') ||
              link.toString().endsWith('.png')) {
            debugPrint('Pre-caching image: $link');
            await precacheImage(CachedNetworkImageProvider(link), context);
          }
        } catch (e) {
          debugPrint('Failed to precache image: $link, error: $e');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Notifications',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _notifications.isEmpty
              ? Center(child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/pictures/noNotification.png',
              ),
            ],
          ))
              : NotificationList(
            scrollController: _scrollController,
            groupedNotifications: groupedNotifications,
            isLoadingMore: _isLoadingMore,
            hasMore: _hasMore,
            theme: theme,
            isLoading: _isLoading,
            formatTimestamp: formatTimestamp,
          ),
        ),
      ),
    );
  }
}


