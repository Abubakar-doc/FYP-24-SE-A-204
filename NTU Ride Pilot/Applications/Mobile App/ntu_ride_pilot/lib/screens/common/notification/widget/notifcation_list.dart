import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/screens/common/notification/widget/notifcation_item.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';

class NotificationList extends StatelessWidget {
  final ScrollController scrollController;
  final Map<String, List<NotificationModel>> groupedNotifications;
  final bool isLoadingMore;
  final bool hasMore;
  final ThemeData theme;
  final bool isLoading;
  final String Function(DateTime) formatTimestamp;
  final int unreadCount;
  final Set<String> initialUnreadIds;

  const NotificationList({
    super.key,
    required this.scrollController,
    required this.groupedNotifications,
    required this.isLoadingMore,
    required this.hasMore,
    required this.theme,
    required this.isLoading,
    required this.formatTimestamp,
    required this.unreadCount,
    required this.initialUnreadIds,
  });

  @override
  Widget build(BuildContext context) {
    final dateKeys = groupedNotifications.keys.toList();

    return ListView.builder(
      controller: scrollController,
      reverse: true,
      itemCount: dateKeys.length + (hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (hasMore && index == dateKeys.length) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: isLoadingMore ? CircularProgressIndicator(color: Colors.grey) : null,
            ),
          );
        }

        final dateLabel = dateKeys[index];
        final notificationsForDate = groupedNotifications[dateLabel] ?? [];

        // Only for the first (newest) date group and if there are unread notifications
        final bool showUnreadCount = index == 0 && unreadCount > 0;


        int? firstUnreadIndex;
        if (showUnreadCount) {
          firstUnreadIndex = notificationsForDate.indexWhere(
                  (n) => initialUnreadIds.contains(n.notificationId)
          );
          if (firstUnreadIndex == -1) firstUnreadIndex = 0;
        }



        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Show date label only once at top
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

            // Now list notifications with unread count inserted before first unread notification
            ...List.generate(notificationsForDate.length, (notifIndex) {
              if (showUnreadCount && firstUnreadIndex != null && notifIndex == firstUnreadIndex) {
                // Insert unread count label widget before first unread notification
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Text(
                        '$unreadCount Unread Update${unreadCount > 1 ? 's' : ''}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: theme.brightness == Brightness.dark
                              ? DarkhintTextColor
                              : LighthintTextColor,
                        ),
                      ),
                    ),
                    NotificationItem(
                      notification: notificationsForDate[notifIndex],
                      theme: theme,
                      isLoading: isLoading,
                      formatTimestamp: formatTimestamp,
                    ),
                  ],
                );
              }
              else {
                // Just a normal notification item
                return NotificationItem(
                  notification: notificationsForDate[notifIndex],
                  theme: theme,
                  isLoading: isLoading,
                  formatTimestamp: formatTimestamp,
                );
              }
            }),
          ],
        );
      },
    );

  }
}

