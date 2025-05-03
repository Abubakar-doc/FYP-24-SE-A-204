import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/screens/common/help/driver/driver_help_ride_start.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/widget/live_location.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/model/bus/bus.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/ride_control.dart';
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
  Future<void> Function()? _centerCamera;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final RideService _rideService = RideService();
  bool _isLoading = false;
  BusModel? selectedBus;
  String errorMessageBus = "";
  String errorMessageRoute = "";
  List<BusModel> buses = [];
  List<RouteModel> routes = [];
  RouteModel? selectedRoute;
  List<Map<String, dynamic>> busStops = [];
  ByteData? defaultMarkerBytes;
  ByteData? firstMarkerBytes;
  ByteData? lastMarkerBytes;

  @override
  void initState() {
    super.initState();
    fetchBusesAndRoutes();
    Get.put(DriverProfileController());
    _loadMarkerImages();
  }

  Future<void> _loadMarkerImages() async {
    try {
      defaultMarkerBytes = await rootBundle.load('assets/pictures/marker.png');
      firstMarkerBytes =
          await rootBundle.load('assets/pictures/first_marker.png');
      lastMarkerBytes =
          await rootBundle.load('assets/pictures/last_marker.png');
    } catch (e) {
      debugPrint('Error loading marker images: $e');
    }
  }


  Uint8List? get defaultMarkerImage => defaultMarkerBytes?.buffer.asUint8List();
  Uint8List? get firstMarkerImage => firstMarkerBytes?.buffer.asUint8List();
  Uint8List? get lastMarkerImage => lastMarkerBytes?.buffer.asUint8List();

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
      // Create the new ride using the selected bus and route
      RideModel? newRide = await _rideService.createNewRide(
        bus: selectedBus!,
        route: selectedRoute!,
        context: context,
      );

      if (newRide != null) {
        // Store the selected bus's seating capacity in the ride
        final rideBox = await Hive.openBox<RideModel>('rides');
        newRide.seatCapacity = selectedBus!.seatCapacity;
        await rideBox.put('currentRide', newRide);

        // Fetch and store bus cards
        await _rideService.fetchAndStoreBusCards();

        // Navigate to the RideControlScreen
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

  // This function will fetch the bus stops based on the selected route
  void updateBusStopsForSelectedRoute() {
    if (selectedRoute != null) {
      // Assuming that each RouteModel has a property called 'busStops'
      setState(() {
        busStops = selectedRoute!.busStops ?? [];
      });
    }
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
                      child: LiveLocation(
                        busStops: busStops,
                        defaultMarkerBytes: defaultMarkerBytes,
                        firstMarkerBytes: firstMarkerBytes,
                        lastMarkerBytes: lastMarkerBytes,
                        onMapReady: (cameraFunction) {
                          setState(() {
                            _centerCamera = cameraFunction;
                          });
                        },
                      ),
                    ),
                    Expanded(
                      flex: 3,
                      child: Container(),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 5.0, right: 16),
                    child: FloatingActionButton(
                      onPressed: _centerCamera != null
                          ? () async {
                              await _centerCamera!(); // Trigger camera movement
                            }
                          : null,
                      tooltip: 'Center on my location',
                      child: Icon(Icons.my_location),
                    ),
                  ),
                  SizedBox(
                    height: 10,
                  ),
                  Container(
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
                                  Get.to(DriverRideStartHelpScreen());
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
                              style: const TextStyle(
                                  color: Colors.red, fontSize: 14),
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
                            displayItem: (route) => route.name,
                            onChanged: (value) {
                              setState(() {
                                selectedRoute = value;
                                errorMessageRoute = "";
                                // Update bus stops whenever route is selected
                                updateBusStopsForSelectedRoute();
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
                          style: ElevatedButton.styleFrom(
                            disabledBackgroundColor: Colors.grey,
                          ),
                          child: Text(
                            _isLoading ? "Getting things ready..." : "Next",
                            style: const TextStyle(color: Colors.white),
                          ),
                        )
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
