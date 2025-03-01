// import 'package:flutter/material.dart';
// import 'package:get/get.dart';
// import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
// import 'package:ntu_ride_pilot/model/ride/ride.dart';
// import 'package:ntu_ride_pilot/utils/utils.dart';
// import 'package:skeletonizer/skeletonizer.dart';
// import 'package:ntu_ride_pilot/model/route/route.dart';
// import 'package:ntu_ride_pilot/model/bus/bus.dart';
// import 'package:ntu_ride_pilot/screens/driver/ride/ride_control.dart';
// import 'package:ntu_ride_pilot/screens/driver/ride/test_data.dart';
// import 'package:ntu_ride_pilot/services/ride/ride_service.dart';
// import 'package:ntu_ride_pilot/themes/app_colors.dart';
// import 'package:ntu_ride_pilot/widget/drawer/custom_drawer.dart';
// import 'package:ntu_ride_pilot/widget/dropdown/driver_ride_dropdown.dart';
//
// class StartRideScreen extends StatefulWidget {
//   const StartRideScreen({super.key});
//
//   @override
//   State<StartRideScreen> createState() => _StartRideScreenState();
// }
//
// class _StartRideScreenState extends State<StartRideScreen> {
//   final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
//   final RideService _rideService = RideService();
//
//   bool _isLoading = false;
//   BusModel? selectedBus;
//   String errorMessageBus = "";
//   String errorMessageRoute = "";
//   List<BusModel> buses = [];
//   List<RouteModel> routes = [];
//   RouteModel? selectedRoute;
//
//   @override
//   void initState() {
//     super.initState();
//     fetchBusesAndRoutes();
//     Get.put(DriverProfileController());
//   }
//
//   void fetchBusesAndRoutes() async {
//     List<BusModel> fetchedBuses = await _rideService.fetchBuses();
//     List<RouteModel> fetchedRoutes = await _rideService.fetchRoutes();
//     setState(() {
//       buses = fetchedBuses;
//       routes = fetchedRoutes;
//     });
//   }
//
//   void setLoading(bool value) {
//     setState(() => _isLoading = value);
//   }
//
//   void validateAndNavigate() async {
//     setLoading(true);
//     bool valid = true;
//     if (selectedBus == null) {
//       setState(() {
//         errorMessageBus = "Please select a bus.";
//       });
//       valid = false;
//     } else {
//       setState(() {
//         errorMessageBus = "";
//       });
//     }
//     if (selectedRoute == null) {
//       setState(() {
//         errorMessageRoute = "Please select a route.";
//       });
//       valid = false;
//     } else {
//       setState(() {
//         errorMessageRoute = "";
//       });
//     }
//     if (!valid) {
//       setLoading(false);
//       return;
//     }
//
//     // print("Bus ID: ${selectedBus!.busId}, Route ID: ${selectedRoute!.routeId}");
//
//     try {
//       // Attempt to create a new ride.
//       RideModel? newRide = await _rideService.createNewRide(
//         bus: selectedBus!,
//         route: selectedRoute!,
//       );
//
//       if (newRide != null) {
//         // Ride successfully created.
//         await _rideService.fetchAndStoreBusCards();
//         Get.to(() => RideControlScreen());
//       }
//     } on BusInUseException catch (e) {
//       // Show a snack bar with driver and route details.
//       SnackbarUtil.showError(
//         "Bus In Use",
//         "The selected bus is currently in use by ${e.driverName} on Route-${e.routeName}.",
//       );
//     } catch (e) {
//       // print("Ride creation failed: $e");
//       Get.snackbar(
//         "Error",
//         "Ride creation failed. Please try again.",
//         snackPosition: SnackPosition.BOTTOM,
//       );
//     }
//     setLoading(false);
//   }
//
//
//   @override
//   Widget build(BuildContext context) {
//     final theme = Theme.of(context);
//     return Scaffold(
//       key: _scaffoldKey,
//       drawer: const CustomDrawer(),
//       body: SafeArea(
//         child: Stack(
//           children: [
//             // Map placeholder.
//             Positioned.fill(
//               child: Container(
//                 color: Colors.grey[700],
//                 alignment: Alignment.center,
//                 child: const Text(
//                   "Live Location Coming Soon",
//                   style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
//                 ),
//               ),
//             ),
//             // Drawer open button.
//             Positioned(
//               top: 16,
//               left: 16,
//               child: Container(
//                 decoration: BoxDecoration(
//                   color: theme.brightness == Brightness.dark
//                       ? darkBackgroundColor
//                       : lightBackgroundColor,
//                   shape: BoxShape.circle,
//                 ),
//                 child: IconButton(
//                   onPressed: () {
//                     _scaffoldKey.currentState?.openDrawer();
//                   },
//                   icon: const Icon(Icons.menu),
//                 ),
//               ),
//             ),
//             // Bottom panel with dropdowns, error messages, and Next button.
//             Positioned(
//               bottom: 0,
//               left: 0,
//               right: 0,
//               child: Container(
//                 padding: const EdgeInsets.all(16),
//                 decoration: BoxDecoration(
//                   color: theme.brightness == Brightness.dark
//                       ? darkBackgroundColor
//                       : lightBackgroundColor,
//                   borderRadius: const BorderRadius.only(
//                     topLeft: Radius.circular(20),
//                     topRight: Radius.circular(20),
//                   ),
//                   boxShadow: [
//                     BoxShadow(
//                         color: Colors.black12,
//                         blurRadius: 10,
//                         spreadRadius: 2)
//                   ],
//                 ),
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.stretch,
//                   mainAxisSize: MainAxisSize.min,
//                   children: [
//                     // Header with title and help button.
//                     Align(
//                       alignment: Alignment.centerLeft,
//                       child: Row(
//                         mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                         children: [
//                           const Text(
//                             "New Ride",
//                             style: TextStyle(
//                                 fontSize: 20, fontWeight: FontWeight.bold),
//                           ),
//                           IconButton(
//                             icon: const Icon(Icons.help_outline),
//                             onPressed: () {
//                               Get.to(TestDataScreen());
//                             },
//                           ),
//                         ],
//                       ),
//                     ),
//                     const SizedBox(height: 16),
//                     // Bus dropdown wrapped in CustomDropdown.
//                     CustomDropdown<BusModel>(
//                       title: "Bus",
//                       selectedValue: selectedBus,
//                       items: buses,
//                       // displayItem: (bus) => bus.busId, // Display busId.
//                       displayItem: (bus) => "Bus-${bus.busId}", // Display with "Bus-" prefix.
//                       onChanged: (value) {
//                         setState(() {
//                           selectedBus = value;
//                           errorMessageBus = ""; // Clear error on change.
//                         });
//                       },
//                     ),
//                     // Inline error message for Bus.
//                     if (errorMessageBus.isNotEmpty)
//                       Padding(
//                         padding: const EdgeInsets.only(top: 4.0),
//                         child: Text(
//                           errorMessageBus,
//                           style: const TextStyle(
//                               color: Colors.red, fontSize: 14),
//                         ),
//                       ),
//                     const SizedBox(height: 10),
//                     // Route dropdown wrapped in Skeletonizer.
//                     Skeletonizer(
//                       enabled: routes.isEmpty,
//                       child: CustomDropdown<RouteModel>(
//                         title: "Route",
//                         selectedValue: selectedRoute,
//                         items: routes,
//                         displayItem: (route) => "Route-${route.name}", // Display with "Route-" prefix.
//                         onChanged: (value) {
//                           setState(() {
//                             selectedRoute = value;
//                             errorMessageRoute = ""; // Clear error on change.
//                           });
//                         },
//                       ),
//                     ),
//                     // Inline error message for Route.
//                     if (errorMessageRoute.isNotEmpty)
//                       Padding(
//                         padding: const EdgeInsets.only(top: 4.0),
//                         child: Text(
//                           errorMessageRoute,
//                           style: const TextStyle(
//                               color: Colors.red, fontSize: 14),
//                         ),
//                       ),
//                     const SizedBox(height: 16),
//                     // Next button.
//                     TextButton(
//                       onPressed: _isLoading ? null : validateAndNavigate,
//                       style: ElevatedButton.styleFrom(
//                         disabledBackgroundColor: Colors.grey,
//                       ),
//                       child: Text(
//                         _isLoading
//                             ? "Getting things ready..."
//                             : "Next",
//                         style: const TextStyle(color: Colors.white),
//                       ),
//                     )
//                   ],
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/model/bus/bus.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/ride_control.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/test_data.dart';
import 'package:ntu_ride_pilot/services/ride/ride_service.dart';
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
  BusModel? selectedBus;
  String errorMessageBus = "";
  String errorMessageRoute = "";
  List<BusModel> buses = [];
  List<RouteModel> routes = [];
  RouteModel? selectedRoute;

  @override
  void initState() {
    super.initState();
    fetchBusesAndRoutes();
    Get.put(DriverProfileController());
  }

  void fetchBusesAndRoutes() async {
    List<BusModel> fetchedBuses = await _rideService.fetchBuses();
    List<RouteModel> fetchedRoutes = await _rideService.fetchRoutes();
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
    if (selectedBus == null) {
      setState(() {
        errorMessageBus = "Please select a bus.";
      });
      valid = false;
    } else {
      setState(() {
        errorMessageBus = "";
      });
    }
    if (selectedRoute == null) {
      setState(() {
        errorMessageRoute = "Please select a route.";
      });
      valid = false;
    } else {
      setState(() {
        errorMessageRoute = "";
      });
    }
    if (!valid) {
      setLoading(false);
      return;
    }

    try {
      RideModel? newRide = await _rideService.createNewRide(
        bus: selectedBus!,
        route: selectedRoute!,
      );

      if (newRide != null) {
        await _rideService.fetchAndStoreBusCards();
        Get.to(() => RideControlScreen());
      }
    } on BusInUseException catch (e) {
      SnackbarUtil.showError(
        "Bus In Use",
        "The selected bus is currently in use by ${e.driverName} on Route-${e.routeName}.",
      );
    } catch (e) {
      Get.snackbar(
        "Error",
        "Ride creation failed. Please try again.",
        snackPosition: SnackPosition.BOTTOM,
      );
    }
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
            // Map placeholder divided into 60% and 40% of the screen.
            Positioned.fill(
              child: Container(
                color: Colors.grey[700],
                child: Column(
                  children: [
                    Expanded(
                      flex: 6,
                      child: Container(
                        alignment: Alignment.center,
                        child: const Text(
                          "Live Location Coming Soon",
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 4,
                      child: Container(
                      ),
                    ),
                  ],
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
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
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
                    // Bus dropdown wrapped in CustomDropdown.
                    CustomDropdown<BusModel>(
                      title: "Bus",
                      selectedValue: selectedBus,
                      items: buses,
                      displayItem: (bus) => "Bus-${bus.busId}",
                      onChanged: (value) {
                        setState(() {
                          selectedBus = value;
                          errorMessageBus = "";
                        });
                      },
                    ),
                    // Inline error message for Bus.
                    if (errorMessageBus.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Text(
                          errorMessageBus,
                          style: const TextStyle(color: Colors.red, fontSize: 14),
                        ),
                      ),
                    const SizedBox(height: 10),
                    // Route dropdown wrapped in Skeletonizer.
                    Skeletonizer(
                      enabled: routes.isEmpty,
                      child: CustomDropdown<RouteModel>(
                        title: "Route",
                        selectedValue: selectedRoute,
                        items: routes,
                        displayItem: (route) => "Route-${route.name}",
                        onChanged: (value) {
                          setState(() {
                            selectedRoute = value;
                            errorMessageRoute = "";
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
                          style: const TextStyle(color: Colors.red, fontSize: 14),
                        ),
                      ),
                    const SizedBox(height: 16),
                    // Next button.
                    TextButton(
                      onPressed: _isLoading ? null : validateAndNavigate,
                      style: ElevatedButton.styleFrom(
                        disabledBackgroundColor: Colors.grey,
                      ),
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
