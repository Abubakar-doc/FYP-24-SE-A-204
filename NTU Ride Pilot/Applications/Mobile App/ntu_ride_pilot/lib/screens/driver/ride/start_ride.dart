import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/ride_control.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/test_data.dart';
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
  final RideService _rideService = RideService();

  bool _isLoading = false;
  String? selectedBus;
  String? selectedRoute;
  String errorMessageBus = "";
  String errorMessageRoute = "";

  // Lists to hold the fetched bus and route values.
  List<String> buses = [];
  List<String> routes = [];

  @override
  void initState() {
    super.initState();
    fetchBusesAndRoutes();
  }

  void fetchBusesAndRoutes() async {
    List<String> fetchedBuses = await _rideService.fetchBuses();
    List<String> fetchedRoutes = await _rideService.fetchRoutes();

    setState(() {
      buses = fetchedBuses;
      routes = fetchedRoutes;
    });
  }

  void setLoading(bool value) {
    setState(() => _isLoading = value);
  }

  void validateAndNavigate() async {
    setLoading(true);
    bool valid = true;
    if (selectedBus == null || selectedBus!.isEmpty) {
      setState(() {
        errorMessageBus = "Please select a bus.";
      });
      valid = false;
    } else {
      setState(() {
        errorMessageBus = "";
      });
    }
    if (selectedRoute == null || selectedRoute!.isEmpty) {
      setState(() {
        errorMessageRoute = "Please select a route.";
      });
      valid = false;
    } else {
      setState(() {
        errorMessageRoute = "";
      });
    }
    if (!valid) return;
    // Both fields are valid, proceed:
    await _rideService.fetchAndStoreBusCards();
    Get.to(() => RideControlScreen());
    setLoading(false);
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
            // Map placeholder.
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
            // Drawer open button.
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
            // Bottom panel with dropdowns, error messages, and Next button.
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
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black12,
                        blurRadius: 10,
                        spreadRadius: 2)
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header with title and help button.
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            "New Ride",
                            style: TextStyle(
                                fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          IconButton(
                            icon: const Icon(Icons.help_outline),
                            onPressed: () {
                              Get.to(TestDataScreen());
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Bus dropdown wrapped in Skeletonizer.
                    Skeletonizer(
                      enabled: buses.isEmpty,
                      child: CustomDropdown(
                        title: "Bus",
                        selectedValue: selectedBus,
                        items: buses,
                        onChanged: (value) {
                          setState(() {
                            selectedBus = value;
                            errorMessageBus = ""; // Clear error on change.
                          });
                        },
                      ),
                    ),
                    // Inline error message for Bus.
                    if (errorMessageBus.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Text(
                          errorMessageBus,
                          style: const TextStyle(
                              color: Colors.red, fontSize: 14),
                        ),
                      ),
                    const SizedBox(height: 10),
                    // Route dropdown wrapped in Skeletonizer.
                    Skeletonizer(
                      enabled: routes.isEmpty,
                      child: CustomDropdown(
                        title: "Route",
                        selectedValue: selectedRoute,
                        items: routes,
                        onChanged: (value) {
                          setState(() {
                            selectedRoute = value;
                            errorMessageRoute = ""; // Clear error on change.
                          });
                        },
                      ),
                    ),
                    // Inline error message for Route.
                    if (errorMessageRoute.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Text(
                          errorMessageRoute,
                          style: const TextStyle(
                              color: Colors.red, fontSize: 14),
                        ),
                      ),
                    const SizedBox(height: 16),
                    // Next button.
                    TextButton(
                      onPressed: _isLoading ? null : validateAndNavigate,
                      child: Text(
                        _isLoading
                            ? "Getting things ready..."
                            : "Next",
                        style: const TextStyle(color: Colors.white),
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
