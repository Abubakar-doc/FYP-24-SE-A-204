import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/drawer/custom_drawer.dart';
import 'package:ntu_ride_pilot/widget/drawer/drawer_button.dart';

class ViewRideScreen extends StatefulWidget {
  const ViewRideScreen({super.key});

  @override
  State<ViewRideScreen> createState() => _ViewRideScreenState();
}

class _ViewRideScreenState extends State<ViewRideScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      key: _scaffoldKey,
      drawer: const CustomDrawer(),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                decoration: BoxDecoration(
                  color: theme.brightness == Brightness.dark
                      ? darkBackgroundColor
                      : lightBackgroundColor,
                  shape: BoxShape.circle,
                ),
                child: CustomDrawerButton(scaffoldKey: _scaffoldKey),
              ),
            ),
          ],
        ),),
    );
  }
}
