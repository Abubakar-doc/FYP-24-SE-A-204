import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/widget/user_location_and_bus_stop_map.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/services/ride/ride_service.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/dropdown/driver_ride_dropdown.dart';

class ViewRouteScreen extends StatefulWidget {
  const ViewRouteScreen({super.key});

  @override
  State<ViewRouteScreen> createState() => _ViewRouteScreenState();
}

class _ViewRouteScreenState extends State<ViewRouteScreen> {
  Future<void> Function()? _centerCamera;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final RideService _rideService = RideService();
  List<RouteModel> routes = [];
  RouteModel? selectedRoute;
  List<Map<String, dynamic>> busStops = [];
  ByteData? defaultMarkerBytes;
  ByteData? firstMarkerBytes;
  ByteData? lastMarkerBytes;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    fetchRoutes();
    _loadMarkerImages();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadMarkerImages() async {
    try {
      defaultMarkerBytes = await rootBundle.load('assets/pictures/marker.png');
      firstMarkerBytes =
          await rootBundle.load('assets/pictures/first_marker.png');
      lastMarkerBytes =
          await rootBundle.load('assets/pictures/last_marker.png');
    } catch (e) {
      // debugPrint('Error loading marker images: $e');
    }
  }

  Uint8List? get defaultMarkerImage => defaultMarkerBytes?.buffer.asUint8List();
  Uint8List? get firstMarkerImage => firstMarkerBytes?.buffer.asUint8List();
  Uint8List? get lastMarkerImage => lastMarkerBytes?.buffer.asUint8List();

  void fetchRoutes() async {
    List<RouteModel> fetchedRoutes = await _rideService.fetchRoutes();
    setState(() {
      routes = fetchedRoutes;
    });
  }

  void updateBusStopsForSelectedRoute() {
    if (selectedRoute != null) {
      setState(() {
        busStops = selectedRoute!.busStops ?? [];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            // Map placeholder divided into 60% and 40% of the screen.
            Positioned.fill(
              child: Column(
                children: [
                  Expanded(
                    flex: 8,
                    child: UserLocationAndBusStopMap(
                      busStops: busStops,
                      defaultMarkerBytes: defaultMarkerBytes,
                      firstMarkerBytes: firstMarkerBytes,
                      lastMarkerBytes: lastMarkerBytes,
                      onMapReady: (cameraFunction) {
                        setState(() {
                          _centerCamera = cameraFunction;
                        });
                      },
                      // showCountOnly:true
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Container(),
                  ),
                ],
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
                    onPressed: Get.back,
                    icon: Icon(
                      Icons.arrow_back,
                      color: theme.brightness == Brightness.dark
                          ? Colors.white
                          : Colors.black,
                    )),
              ),
            ),
            // Bottom panel with dropdown and draggable functionality
            DraggableScrollableSheet(
              minChildSize: 0.36, // Minimum height (30% of the screen)
              maxChildSize: 0.8, // Maximum height (60% of the screen)
              initialChildSize: 0.36, // Start at 40% height
              snap: true,
              builder: (context, scrollController) {
                return Container(
                  padding:
                      const EdgeInsets.only(left: 16, right: 16, bottom: 16),
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
                    children: [
                      // Divider (not scrollable)
                      Padding(
                        padding: const EdgeInsets.only(top: 20.0),
                        child: Center(
                          child: Container(
                            margin: EdgeInsets.only(bottom: 12),
                            height: 4,
                            width: 80,
                            decoration: BoxDecoration(
                              color: isDark
                                  ? Colors.grey.shade700
                                  : Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                      ),
                      // Scrollable content
                      Expanded(
                        child: SingleChildScrollView(
                          controller: scrollController,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    "Default Routes",
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.my_location),
                                    onPressed: _centerCamera != null
                                        ? () async {
                                            await _centerCamera!(); // Trigger camera movement
                                          }
                                        : null,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 25),
                              Skeletonizer(
                                enabled: routes.isEmpty,
                                child: CustomDropdown<RouteModel>(
                                  title: "Select a route",
                                  selectedValue: selectedRoute,
                                  items: routes,
                                  displayItem: (route) => route.name,
                                  onChanged: (value) async {
                                    await Future.delayed(
                                        Duration(milliseconds: 100));
                                    setState(() {
                                      selectedRoute = value;
                                      updateBusStopsForSelectedRoute();
                                    });
                                  },
                                ),
                              ),
                              const SizedBox(height: 30),
                              // Bus stops list
                              const Text(
                                "Bus Stops",
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 25),
                              if (selectedRoute != null && busStops.isNotEmpty)
                                Container(
                                  decoration: BoxDecoration(
                                    color: theme.brightness == Brightness.dark
                                        ? DarkInputFieldFillColor
                                        : LightInputFieldFillColor,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      SizedBox(height: 12),
                                      ListView.builder(
                                        physics: NeverScrollableScrollPhysics(),
                                        shrinkWrap: true,
                                        itemCount: busStops.length,
                                        itemBuilder: (context, index) {
                                          final stop = busStops[index];
                                          return Padding(
                                            padding: const EdgeInsets.symmetric(
                                                vertical: 12.0),
                                            child: Row(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Container(
                                                  width: 30,
                                                  height: 30,
                                                  decoration: BoxDecoration(
                                                    shape: BoxShape.circle,
                                                    color: isDark
                                                        ? Colors.blue.shade700
                                                        : Colors.blue.shade300,
                                                  ),
                                                  alignment: Alignment.center,
                                                  child: Text(
                                                    '${index + 1}',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(width: 12),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Text(
                                                        stop['busStopName'] ??
                                                            'Unknown Stop',
                                                        style: TextStyle(
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                                      ),
                                                      if (stop['eta'] != null)
                                                        Text(
                                                          'ETA: ${stop['eta']}',
                                                          style: TextStyle(
                                                            fontSize: 14,
                                                            color: Colors.grey,
                                                          ),
                                                        ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              SizedBox(
                                  height:
                                      MediaQuery.of(context).viewInsets.bottom),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
