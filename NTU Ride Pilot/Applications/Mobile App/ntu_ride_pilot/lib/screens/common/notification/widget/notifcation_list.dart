import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/notification_controller.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/screens/common/notification/widget/notifcation_item.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:visibility_detector/visibility_detector.dart';

class NotificationList extends StatelessWidget {
  final ScrollController scrollController;
  final Map<String, List<NotificationModel>> groupedNotifications;
  final bool isLoadingMore;
  final bool hasMore;
  final ThemeData theme;
  final bool isLoading;
  final String Function(DateTime) formatTimestamp;

  const NotificationList({
    super.key,
    required this.scrollController,
    required this.groupedNotifications,
    required this.isLoadingMore,
    required this.hasMore,
    required this.theme,
    required this.isLoading,
    required this.formatTimestamp,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: scrollController,
      reverse: true,
      itemCount: groupedNotifications.keys.length + (hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == groupedNotifications.keys.length && hasMore) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: isLoadingMore
                  ? CircularProgressIndicator(
                      color: Colors.grey,
                    )
                  : null,
            ),
          );
        }

        final dateLabel = groupedNotifications.keys.toList()[index];
        final notificationsForDate = groupedNotifications[dateLabel] ?? [];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Center(
                child: Text(
                  dateLabel,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: theme.brightness == Brightness.dark
                        ? DarkhintTextColor
                        : LighthintTextColor,
                  ),
                ),
              ),
            ),
            ...notificationsForDate.map((notification) {
              return VisibilityDetector(
                key: Key(notification.notificationId),
                onVisibilityChanged: (info) {
                  if (info.visibleFraction > 0.1 && !notification.read) {
                    // Mark as read when at least 10% visible and unread
                    final controller = Get.find<NotificationController>();
                    controller.markAsRead(notification.notificationId);
                  }
                },
                child: NotificationItem(
                  notification: notification,
                  theme: theme,
                  isLoading: isLoading,
                  formatTimestamp: formatTimestamp,
                ),
              );
            }).toList(),
          ],
        );
      },
    );
  }
}

