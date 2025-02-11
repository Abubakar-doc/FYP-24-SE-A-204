import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/common/help/driver/driver_help_ride_start.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/ride_control.dart';
import 'package:ntu_ride_pilot/services/driver/ride_service.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/drawer/custom_drawer.dart';
import 'package:ntu_ride_pilot/widget/dropdown/driver_ride_dropdown.dart';

class StartRideScreen extends StatefulWidget {
  const StartRideScreen({super.key});

  @override
  State<StartRideScreen> createState() => _StartRideScreenState();
}

class _StartRideScreenState extends State<StartRideScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final RideService _rideService = RideService(); // Create service instance

  bool _isLoading = false;
  String? selectedBus;
  String? selectedRoute;

  final List<String> buses = [
    "Bus A", "Bus d", "Bus 3", "Bus s", "Bus l", "Bus ", "Bus k", "Bus n", "Bus t", "Bus C"
  ];
  final List<String> routes = [
    "Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6", "Route 7", "Route 8"
  ];

  void setLoading(bool value) {
    setState(() => _isLoading = value);
  }


  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      key: _scaffoldKey,
      drawer: const CustomDrawer(),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: Container(
                color: Colors.grey,
                alignment: Alignment.center,
                child: const Text(
                  "Map",
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
            ),
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
                child: IconButton(
                  onPressed: () {
                    _scaffoldKey.currentState?.openDrawer();
                  },
                  icon: const Icon(Icons.menu),
                ),
              ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.brightness == Brightness.dark
                      ? darkBackgroundColor
                      : lightBackgroundColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, spreadRadius: 2)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text("New Ride", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.help_outline),
                            onPressed: () {
                              Get.to(DriverRideStartHelpScreen());
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    CustomDropdown(
                      title: "Bus",
                      selectedValue: selectedBus,
                      items: buses,
                      onChanged: (value) => setState(() => selectedBus = value),
                    ),
                    const SizedBox(height: 10),
                    CustomDropdown(
                      title: "Route",
                      selectedValue: selectedRoute,
                      items: routes,
                      onChanged: (value) => setState(() => selectedRoute = value),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: _isLoading ? null : () async {
                        await _rideService.fetchAndStoreBusCards(setLoading);
                        Get.to(() => RideControlScreen());
                      },
                      child: Text(
                        _isLoading ? "Getting things ready..." : "Next",
                        style: TextStyle(color: Colors.white),
                      ),
                    )

                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
