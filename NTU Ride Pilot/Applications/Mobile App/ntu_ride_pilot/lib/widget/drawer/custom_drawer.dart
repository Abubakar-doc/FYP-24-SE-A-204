import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'bottom_user_info.dart';
import 'custom_list_tile.dart';
import 'header.dart';

class CustomDrawer extends StatefulWidget {
  const CustomDrawer({super.key});

  @override
  State<CustomDrawer> createState() => _CustomDrawerState();
}

class _CustomDrawerState extends State<CustomDrawer> {
  final bool _isCollapsed = true;

  int _activeIndex = 0;

  void _onTileTapped(int index) {
    setState(() {
      _activeIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    bool isDarkTheme = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      child: AnimatedContainer(
        curve: Curves.easeInOutCubic,
        duration: const Duration(milliseconds: 500),
        width: _isCollapsed ? 300 : 70,
        margin: const EdgeInsets.only(bottom: 10, top: 10),
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

              // CustomListTile for Home
              CustomListTile(
                isCollapsed: _isCollapsed,
                icon: Icons.home_outlined,
                title: 'Home',
                infoCount: 0,
                isActive: _activeIndex == 0, // Check if this tile is active
                onTap: () => _onTileTapped(0), // Set active index on tap
              ),

              // CustomListTile for Notifications
              CustomListTile(
                isCollapsed: _isCollapsed,
                icon: Icons.notifications,
                title: 'Notifications',
                infoCount: 2,
                isActive: _activeIndex == 1, // Check if this tile is active
                onTap: () => _onTileTapped(1), // Set active index on tap
              ),

              // CustomListTile for Feedback
              CustomListTile(
                isCollapsed: _isCollapsed,
                icon: Icons.feedback_outlined,
                title: 'Feedback',
                infoCount: 0,
                isActive: _activeIndex == 2, // Check if this tile is active
                onTap: () => _onTileTapped(2), // Set active index on tap
              ),

              // CustomListTile for Settings
              CustomListTile(
                isCollapsed: _isCollapsed,
                icon: Icons.settings,
                title: 'Settings',
                infoCount: 0,
                isActive: _activeIndex == 3, // Check if this tile is active
                onTap: () => _onTileTapped(3), // Set active index on tap
              ),

              const Spacer(),
              BottomUserInfo(isCollapsed: _isCollapsed),
              // Align(
              //   alignment: _isCollapsed
              //       ? Alignment.bottomRight
              //       : Alignment.bottomCenter,
              //   child: IconButton(
              //     splashColor: Colors.transparent,
              //     icon: Icon(
              //       _isCollapsed
              //           ? Icons.arrow_back_ios
              //           : Icons.arrow_forward_ios,
              //       size: 16,
              //     ),
              //     onPressed: () {
              //       setState(() {
              //         _isCollapsed = !_isCollapsed;
              //       });
              //     },
              //   ),
              // ),
            ],
          ),
        ),
      ),
    );
  }
}
