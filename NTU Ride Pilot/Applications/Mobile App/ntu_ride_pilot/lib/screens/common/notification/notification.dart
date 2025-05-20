import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/screens/common/notification/widget/notifcation_widgets.dart';
import 'package:ntu_ride_pilot/services/common/notification/notificationRepository.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  StreamSubscription<List<NotificationModel>>? _streamSubscription;
  final NotificationRepository _repository = NotificationRepository();

  final ScrollController _scrollController = ScrollController();

  bool _isLoading = true;
  bool _isLoadingMore = false;

  Map<String, List<NotificationModel>> groupedNotifications = {};

  @override
  void initState() {
    super.initState();
    _init();
    _scrollController.addListener(_scrollListener);
  }

  @override
  void dispose() {
    _streamSubscription?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    await _repository.init();
    _setupStream();
    setState(() {
      _isLoading = false;
      _groupNotifications();
    });
  }

  void _setupStream() {
    _streamSubscription = _repository
        .getLatestNotificationsStream()
        .listen((updatedNotifications) async {
      if (updatedNotifications.isNotEmpty) {
        // Updated notifications received from Firestore, replace local list

        // Extract IDs from incoming stream
        final updatedIds =
            updatedNotifications.map((n) => n.notificationId).toSet();

        // Remove local notifications NOT present in updated stream
        _repository.notifications.removeWhere(
            (localNotif) => !updatedIds.contains(localNotif.notificationId));

        // Add or update notifications from stream
        for (var notification in updatedNotifications) {
          final index = _repository.notifications.indexWhere(
              (n) => n.notificationId == notification.notificationId);
          if (index != -1) {
            // Update existing notification
            if (_repository.notifications[index] != notification) {
              _repository.notifications[index] = notification;
            }
          } else {
            // Add new notification
            _repository.notifications.insert(0, notification);
          }
        }

        if (mounted) {
          setState(() {
            _groupNotifications();
          });
        }
      } else {
        // Clear all notifications locally if stream is empty
        if (_repository.notifications.isNotEmpty && mounted) {
          _repository.notifications.clear();
          setState(() {
            _groupNotifications();
          });
        }
      }
    });
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

  void _groupNotifications() {
    final grouped = <String, List<NotificationModel>>{};
    for (final n in _repository.notifications) {
      final date = _formatDate(n.createdAt);
      grouped.putIfAbsent(date, () => []).add(n);
    }
    grouped.forEach((key, list) {
      list.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    });
    groupedNotifications = grouped;
  }

  void _scrollListener() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreNotifications();
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    return DateFormat('h:mm a').format(timestamp);
  }

  Future<void> _loadMoreNotifications() async {
    if (_isLoadingMore || !_repository.hasMore) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final newNotifications = await _repository.loadMore();
      if (newNotifications.isNotEmpty) {
        _groupNotifications();
      }
    } catch (e) {
      debugPrint('Error loading more notifications: $e');
      _repository.hasMore = false;
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    final theme = Theme.of(context);

    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Notifications',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          bottom: _isLoading
              ? PreferredSize(
                  preferredSize: const Size.fromHeight(4.0),
                  child: LinearProgressIndicator(
                      minHeight: 3,
                      color: Colors.blue,
                      backgroundColor: Colors.blue[100]),
                )
              : null,
        ),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: _isLoading
              ? Container()
              : _repository.notifications.isEmpty
                  ? Center(
                      child: Image.asset('assets/pictures/noNotification.png'))
                  : NotificationList(
                      scrollController: _scrollController,
                      groupedNotifications: groupedNotifications,
                      isLoadingMore: _isLoadingMore,
                      hasMore: _repository.hasMore,
                      theme: theme,
                      isLoading: _isLoading,
                      formatTimestamp: _formatTimestamp,
                    ),
        ),
      ),
    );
  }
}
