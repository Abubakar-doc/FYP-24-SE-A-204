import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:ntu_ride_pilot/widget/drawer/drawer_button.dart';
import 'package:ntu_ride_pilot/screens/student/view_ride/widget/bus_location_and_bus_stop_map.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/model/bus/bus.dart';
import 'package:ntu_ride_pilot/services/ride/ride_service.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/drawer/custom_drawer.dart';
import 'package:ntu_ride_pilot/widget/dropdown/driver_ride_dropdown.dart';
import 'package:skeletonizer/skeletonizer.dart';

class ViewRideScreen extends StatefulWidget {
  const ViewRideScreen({super.key});

  @override
  State<ViewRideScreen> createState() => _ViewRideScreenState();
}

class _ViewRideScreenState extends State<ViewRideScreen> {
  Future<void> Function()? _centerCamera;
  Future<void> Function()? _resetCamera;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final RideService _rideService = RideService();
  bool _isLoading = false;
  BusModel? selectedBus;
  RouteModel? selectedRoute;
  List<BusModel> buses = [];
  List<RouteModel> routes = [];
  List<Map<String, dynamic>> busStops = [];
  Stream<List<Map<String, dynamic>>>? rideStream;
  StreamSubscription<List<Map<String, dynamic>>>? rideStreamSubscription;
  double? _liveLatitude;
  double? _liveLongitude;
  bool _noRideAvailable = false;
  ByteData? defaultMarkerBytes;
  ByteData? firstMarkerBytes;
  ByteData? lastMarkerBytes;
  ByteData? busMarkerBytes;
  ByteData? grayMarkerBytes;
  String? _currentRouteId;
  DateTime? _etaNextStop;
  String? _nextStopName;

  @override
  void initState() {
    super.initState();
    fetchBusesAndRoutes();
    _loadMarkerImages();
  }

  void fetchBusesAndRoutes() async {
    List<BusModel> fetchedBuses = await _rideService.fetchBuses();
    List<RouteModel> fetchedRoutes = await _rideService.fetchRoutes();
    setState(() {
      buses = fetchedBuses;
      routes = fetchedRoutes;
    });
  }

  Future<void> _loadMarkerImages() async {
    try {
      defaultMarkerBytes = await rootBundle.load('assets/pictures/marker.png');
      firstMarkerBytes =
          await rootBundle.load('assets/pictures/first_marker.png');
      lastMarkerBytes =
          await rootBundle.load('assets/pictures/last_marker.png');
      busMarkerBytes = await rootBundle.load('assets/pictures/bus.png');
      grayMarkerBytes = await rootBundle.load('assets/pictures/gray_marker.png');
    } catch (e) {
      // debugPrint('Error loading marker images: $e');
    }
  }

  Uint8List? get defaultMarkerImage => defaultMarkerBytes?.buffer.asUint8List();
  Uint8List? get firstMarkerImage => firstMarkerBytes?.buffer.asUint8List();
  Uint8List? get lastMarkerImage => lastMarkerBytes?.buffer.asUint8List();
  Uint8List? get busMarkerImage => busMarkerBytes?.buffer.asUint8List();
  Uint8List? get grayMarkerImage => grayMarkerBytes?.buffer.asUint8List();

  void setLoading(bool value) {
    setState(() => _isLoading = value);
  }

  void updateBusStopsForSelectedRoute() {
    if (_currentRouteId != null) {
      setState(() {
        selectedRoute = routes.firstWhere(
          (r) => r.routeId == _currentRouteId,
          orElse: () => RouteModel(
            routeId: '', // Fallback routeId if not found
            name: 'Unknown Route', // Default name if route not found
            busStops: [], // Empty list of bus stops if not found
            createdAt: DateTime.now(), // Default createdAt as current time
          ),
        );

        // Assign bus stops from the selected route
        busStops = selectedRoute!.busStops;
      });
    }
  }

  void _updateLiveLocation(Map<String, dynamic> rideData) {
    setState(() {
      _liveLatitude = rideData['latitude'];
      _liveLongitude = rideData['longitude'];
      _currentRouteId = rideData['routeId'];
      _etaNextStop = rideData['eta_next_stop'];
      _nextStopName = rideData['nextStopName'];
    });

    // print(_etaNextStop);
    // print('Next Stop Name: $_nextStopName');

    // Update bus stops based on the routeId
    updateBusStopsForSelectedRoute();

    // Update the camera to follow the live location if necessary
    if (_liveLatitude != null && _liveLongitude != null) {
      _centerCamera?.call();
    }
  }

  String formatEta(DateTime eta) {
    final DateFormat dateFormat = DateFormat('hh:mm a');
    return dateFormat.format(eta);
  }

  void startRideStream() {
    if (selectedBus != null) {
      rideStream = _rideService.fetchRidesStreamForBus(selectedBus!.busId);

      if (rideStream != null) {
        rideStreamSubscription = rideStream!.listen(
          (rides) {
            if (rides.isNotEmpty) {
              _updateLiveLocation(rides.first); // Extract and update variables
              setState(() {
                _noRideAvailable = false;
              });
            } else {
              setState(() {
                _noRideAvailable = true;
              });
            }
          },
          onError: (error) {
            // print("Error fetching ride data: $error");
            setState(() {
              _noRideAvailable = true;
            });
          },
        );
      }
    }
  }

  void stopRideStream() {
    if (rideStreamSubscription != null) {
      rideStreamSubscription?.cancel();
      rideStreamSubscription = null;
    }
  }

  @override
  void dispose() {
    // Cancel the stream subscription when the screen is disposed
    stopRideStream();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // print("Bus Stops: $busStops");

    return Scaffold(
      key: _scaffoldKey,
      drawer: const CustomDrawer(
        activeIndex: 5,
        showRides: false,
      ),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: Column(
                children: [
                  Expanded(
                    flex: 6,
                    child: BusLocationAndBusStopMap(
                      busStops: busStops, // Updated bus stops
                      defaultMarkerBytes: defaultMarkerBytes,
                      firstMarkerBytes: firstMarkerBytes,
                      lastMarkerBytes: lastMarkerBytes,
                      busMarkerBytes: busMarkerBytes,
                      grayMarkerBytes: grayMarkerBytes,
                      onMapReady: (cameraFunction) {
                        setState(() {
                          _centerCamera = cameraFunction;
                        });
                      },
                      latitude: _liveLatitude,
                      longitude: _liveLongitude,
                      busId: selectedBus?.busId,
                      nextStopName: _nextStopName,
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Container(),
                  ),
                ],
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
                child: CustomDrawerButton(scaffoldKey: _scaffoldKey),
              ),
            ),
            DraggableScrollableSheet(
              minChildSize: 0.36,
              maxChildSize: 0.8,
              initialChildSize: 0.36,
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
                                    "Track Your Bus",
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.my_location),
                                    onPressed: _centerCamera != null
                                        ? () async {
                                            await _centerCamera!();
                                          }
                                        : null,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Skeletonizer(
                                enabled: buses.isEmpty,
                                child: CustomDropdown<BusModel>(
                                  title: "Bus",
                                  selectedValue: selectedBus,
                                  items: buses,
                                  displayItem: (bus) => "Bus-${bus.busId}",
                                  onChanged: (value) async {
                                    setState(() {
                                      selectedBus = value;
                                      _isLoading = true;
                                    });

                                    // Stop previous stream and start a new one
                                    stopRideStream();
                                    if (selectedBus != null) {
                                      startRideStream();
                                    } else {
                                      setState(() {
                                        _noRideAvailable =
                                            false; // Reset no ride flag if no bus selected
                                      });
                                    }

                                    setState(() {
                                      _isLoading = false;
                                    });
                                  },
                                ),
                              ),
                              SizedBox(
                                height: 16,
                              ),

                              // Show a message if no ride is selected
                              if (_noRideAvailable)
                                Text(
                                  "Bus ${selectedBus!.busId} is offline!",
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.red.shade400,
                                  ),
                                ),
                              SizedBox(
                                height: 16,
                              ),
                              const Text(
                                "In Transit on Route",
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(
                                height: 25,
                              ),
                              // Bus stops list
                              if (selectedRoute != null &&
                                  busStops.isNotEmpty &&
                                  !_noRideAvailable)
                                Skeletonizer(
                                  enabled: _isLoading,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: theme.brightness == Brightness.dark
                                          ? DarkInputFieldFillColor
                                          : LightInputFieldFillColor,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    padding: EdgeInsets.all(22),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          selectedRoute!.name,
                                          style: TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        SizedBox(height: 12),
                                        ListView.builder(
                                          physics:
                                              NeverScrollableScrollPhysics(),
                                          shrinkWrap: true,
                                          itemCount: busStops.length,
                                          itemBuilder: (context, index) {
                                            final stop = busStops[index];

                                            // Check if the stop name matches
                                            bool isNextStop =
                                                stop['busStopName'] ==
                                                    _nextStopName;
                                            bool isPreviousStop = index <
                                                busStops.indexWhere((s) =>
                                                    s['busStopName'] ==
                                                    _nextStopName);

                                            // Format the ETA if it's the matching stop
                                            String? etaText;
                                            if (isNextStop &&
                                                _etaNextStop != null) {
                                              etaText =
                                                  formatEta(_etaNextStop!);
                                            }

                                            return Padding(
                                              padding:
                                                  const EdgeInsets.symmetric(
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
                                                      color: isNextStop
                                                          ? Colors.green
                                                          : (isPreviousStop
                                                              ? Colors.grey
                                                              : Colors.blue),
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
                                                            color:
                                                                isPreviousStop
                                                                    ? Colors
                                                                        .grey
                                                                    : null,
                                                          ),
                                                        ),
                                                        SizedBox(
                                                          height: 8,
                                                        ),
                                                        if (isNextStop &&
                                                            etaText != null)
                                                          Text(
                                                            'ETA is $etaText',
                                                            style: TextStyle(
                                                              fontSize: 14,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .bold,
                                                              color:
                                                                  Colors.grey,
                                                            ),
                                                          ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            );
                                          },
                                        )
                                      ],
                                    ),
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
