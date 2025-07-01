import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/notification_controller.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';

class CustomDrawerButton extends StatelessWidget {
  final GlobalKey<ScaffoldState> scaffoldKey;

  const CustomDrawerButton({super.key, required this.scaffoldKey});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final NotificationController controller = Get.find();

    return Container(
      decoration: BoxDecoration(
        color: theme.brightness == Brightness.dark
            ? darkBackgroundColor
            : lightBackgroundColor,
        shape: BoxShape.circle,
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          IconButton(
            onPressed: () {
              scaffoldKey.currentState?.openDrawer();
            },
            icon: const Icon(Icons.menu),
          ),
          // Notification Badge
          Obx(() {
            final unreadCount = controller.unreadCount.value;
            return unreadCount > 0
                ? Positioned(
              top: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(
                  minWidth: 16,
                  minHeight: 16,
                ),
                child: Text(
                  '$unreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            )
                : SizedBox.shrink();
          }),
        ],
      ),
    );
  }
}
