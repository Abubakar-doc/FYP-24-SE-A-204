import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/notification_controller.dart';
import 'package:ntu_ride_pilot/screens/common/feedback/feedback.dart';
import 'package:ntu_ride_pilot/screens/common/notification/notification.dart';
import 'package:ntu_ride_pilot/screens/common/settings/settings.dart';
import 'package:ntu_ride_pilot/screens/student/route/view_route.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'bottom_user_info.dart';
import 'custom_list_tile.dart';
import 'header.dart';

class CustomDrawer extends StatefulWidget {
  final bool showRides;
  final bool showRoutes;
  final bool showNotifications;
  final bool showFeedback;
  final bool showSettings;
  final bool showLiveLocation;
  final int activeIndex; // No longer nullable, default value in constructor

  const CustomDrawer({
    super.key,
    this.showRides = true,
    this.showRoutes = true,
    this.showNotifications = true,
    this.showFeedback = true,
    this.showSettings = true,
    this.showLiveLocation = true,
    this.activeIndex = 0, // Set default value of activeIndex to 0
  });

  @override
  State<CustomDrawer> createState() => _CustomDrawerState();
}

class _CustomDrawerState extends State<CustomDrawer> {
  final bool _isCollapsed = true;
  final NotificationController controller = Get.find();
  late int _activeIndex;

  @override
  void initState() {
    super.initState();
    _activeIndex = widget.activeIndex; // Use widget.activeIndex directly
  }

  void _onTileTapped(int index) {
    setState(() {
      _activeIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    bool isDarkTheme = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      child: Obx(() {
        final unreadCount = controller.unreadCount.value;
        return SafeArea(
          child: AnimatedContainer(
            curve: Curves.easeInOutCubic,
            duration: const Duration(milliseconds: 500),
            width: _isCollapsed ? 300 : 70,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.only(
                bottomRight: Radius.circular(10),
                topRight: Radius.circular(10),
              ),
              color: isDarkTheme ? darkBackgroundColor : lightBackgroundColor,
            ),
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  CustomDrawerHeader(isColapsed: _isCollapsed),

                  // Home Item
                  if (widget.showRides)
                    CustomListTile(
                      isCollapsed: _isCollapsed,
                      icon: Icons.home_outlined,
                      title: 'Rides',
                      infoCount: 0,
                      isActive: _activeIndex == 0,
                      onTap: () {
                        _onTileTapped(0);
                        Navigator.pop(context);
                      },
                    ),

                  // Routes Item
                  if (widget.showLiveLocation)
                    CustomListTile(
                      isCollapsed: _isCollapsed,
                      icon: Icons.location_on_sharp,
                      title: 'Live Location',
                      infoCount: 0,
                      isActive: _activeIndex == 5,
                      onTap: () {
                        _onTileTapped(5);
                        Navigator.pop(context);
                        Get.to(() => ViewRouteScreen(),
                            transition: Transition.rightToLeft);
                      },
                    ),

                  // Routes Item
                  if (widget.showRoutes)
                    CustomListTile(
                      isCollapsed: _isCollapsed,
                      icon: Icons.route,
                      title: 'Routes',
                      infoCount: 0,
                      isActive: _activeIndex == 1,
                      onTap: () {
                        _onTileTapped(1);
                        Navigator.pop(context);
                        Get.to(() => ViewRouteScreen(),
                            transition: Transition.rightToLeft);
                      },
                    ),

                  // Notifications Item
                  if (widget.showNotifications)
                    CustomListTile(
                      isCollapsed: _isCollapsed,
                      icon: Icons.notifications,
                      title: 'Notifications',
                      infoCount: unreadCount,
                      isActive: _activeIndex == 2,
                      onTap: () {
                        _onTileTapped(2);
                        Navigator.pop(context);
                        Get.to(() => NotificationScreen(),
                            transition: Transition.rightToLeft);
                      },
                    ),

                  // Feedback Item
                  if (widget.showFeedback)
                    CustomListTile(
                      isCollapsed: _isCollapsed,
                      icon: Icons.feedback_outlined,
                      title: 'Feedback',
                      infoCount: 0,
                      isActive: _activeIndex == 3,
                      onTap: () {
                        _onTileTapped(3);
                        Navigator.pop(context);
                        Get.to(() => FeedbackScreen(),
                            transition: Transition.rightToLeft);
                      },
                    ),

                  // Settings Item
                  if (widget.showSettings)
                    CustomListTile(
                      isCollapsed: _isCollapsed,
                      icon: Icons.settings,
                      title: 'Settings',
                      infoCount: 0,
                      isActive: _activeIndex == 4,
                      onTap: () {
                        _onTileTapped(4);
                        Navigator.pop(context);
                        Get.to(() => SettingsScreen(),
                            transition: Transition.rightToLeft);
                      },
                    ),

                  const Spacer(),
                  BottomUserInfo(isCollapsed: _isCollapsed),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }
}
