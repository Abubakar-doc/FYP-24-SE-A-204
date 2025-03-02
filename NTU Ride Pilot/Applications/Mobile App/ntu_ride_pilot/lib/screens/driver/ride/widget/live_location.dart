import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ntu_ride_pilot/services/ride/live_location.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class LiveLocation extends StatefulWidget {
  const LiveLocation({super.key});

  @override
  State<LiveLocation> createState() => _LiveLocationState();
}

class _LiveLocationState extends State<LiveLocation> {
  MapboxMap? mapboxMapController;
  bool _isLocationPermissionGranted = false;
  late LiveLocationService _liveLocationService;

  @override
  void initState() {
    super.initState();
    _liveLocationService = LiveLocationService(context);
    _checkLocationPermissionPeriodically();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          MapWidget(
            onMapCreated: _onMapCreated,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _setCameraToUserLocation,
        tooltip: 'Center on my location',
        child: Icon(Icons.my_location),
      ),
    );
  }

  void _onMapCreated(MapboxMap controller) async {
    mapboxMapController = controller;

    // Get the current theme
    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;

    // Select a better Mapbox style
    String mapStyle = isDarkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v11";

    mapboxMapController?.loadStyleURI(mapStyle);

    // Request location permission and focus the camera on the user
    bool hasPermission = await _liveLocationService.checkLocationPermission();
    if (hasPermission) {
      _liveLocationService.enableLocationSettings(mapboxMapController);
      _setCameraToUserLocation(); // Adjust the camera
    } else {
      SnackbarUtil.showError('GPS Error!', 'GPS access is required!');
      SystemNavigator.pop();
    }
  }

  Future<void> _setCameraToUserLocation() async {
    var userLocation = await _liveLocationService.getCurrentLocation();

    if (userLocation != null) {
      double latitude = userLocation.latitude;
      double longitude = userLocation.longitude;

      CameraOptions cameraOptions = CameraOptions(
        center: Point(coordinates: Position(longitude, latitude)),
        zoom: 14.5,
        // pitch: 45.0, // Tilt for better 3D effect
        bearing: 0.0, // Facing north
      );

      mapboxMapController?.setCamera(cameraOptions);
    }
  }

  Future<void> _checkLocationPermissionPeriodically() async {
    while (true) {
      await Future.delayed(Duration(seconds: 10));
      bool hasPermission = await _liveLocationService.checkLocationPermission();
      if (hasPermission != _isLocationPermissionGranted) {
        setState(() {
          _isLocationPermissionGranted = hasPermission;
        });
        if (!hasPermission) {
          SnackbarUtil.showError('GPS Error!', 'GPS access is required!');
          SystemNavigator.pop();
        }
      }
    }
  }
}