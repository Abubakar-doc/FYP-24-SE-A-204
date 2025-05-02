import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ntu_ride_pilot/services/ride/live_location.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class LiveLocation extends StatefulWidget {
  final void Function(Future<void> Function() cameraFunction)? onMapReady;

  const LiveLocation({super.key, this.onMapReady});

  @override
  State<LiveLocation> createState() => _LiveLocationState();
}

class _LiveLocationState extends State<LiveLocation> {
  MapboxMap? mapboxMapController;
  bool _isLocationPermissionGranted = false;
  late LiveLocationService _liveLocationService;

  // Define bus stops data
  final List<Map<String, dynamic>> busStops = [
    {
      'name': 'abubakar',
      'latitude': 31.41520014461028,
      'longitude': 73.12814267949463,
    },
    {
      'name': 'faizane madina',
      'latitude': 31.42261825812389,
      'longitude': 73.11888110759409,
    },
    {
      'name': 'susan road flats',
      'latitude': 31.41511069626864,
      'longitude': 73.11082961485172,
    },
    {
      'name': 'kohinoor',
      'latitude': 31.41068809095664,
      'longitude': 73.11636017960308,
    },
  ];

  @override
  void initState() {
    super.initState();
    _liveLocationService = LiveLocationService(context);
    _checkLocationPermissionPeriodically();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        MapWidget(
          onMapCreated: _onMapCreated,
        ),
      ],
    );
  }

  void _onMapCreated(MapboxMap controller) async {
    mapboxMapController = controller;
    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;
    String mapStyle = isDarkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v11";
    await mapboxMapController?.loadStyleURI(mapStyle);

    // Disable the Mapbox logo and compass
    mapboxMapController?.logo.updateSettings(LogoSettings(enabled: false));
    mapboxMapController?.compass
        .updateSettings(CompassSettings(enabled: false));
    mapboxMapController?.scaleBar
        .updateSettings(ScaleBarSettings(enabled: false));
    mapboxMapController?.attribution
        .updateSettings(AttributionSettings(enabled: false));

    if (widget.onMapReady != null) {
      widget.onMapReady!(_setCameraToFitAllMarkers);
    }

    // Request location permission and set up the map
    bool hasPermission = await _liveLocationService.checkLocationPermission();
    if (hasPermission) {
      _liveLocationService.enableLocationSettings(mapboxMapController);
      _setCameraToFitAllMarkers();

      // Add markers for each bus stop
      _addBusStopMarkers();
    } else {
      SnackbarUtil.showError('GPS Error!', 'GPS access is required!');
      SystemNavigator.pop();
    }
  }

  void _addBusStopMarkers() async {
    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;
    final pointAnnotationManager =
    await mapboxMapController!.annotations.createPointAnnotationManager();

    for (var busStop in busStops) {
      final point = Point(
          coordinates: Position(busStop['longitude'], busStop['latitude']));

      final ByteData bytes =
      await rootBundle.load('assets/pictures/marker.png');
      final Uint8List imageData = bytes.buffer.asUint8List();

      final annotationOptions = PointAnnotationOptions(
        geometry: point,
        textField: busStop['name'],
        textColor: isDarkMode ? Colors.white.value : Colors.black.value,
        image: imageData,
        iconSize: 0.15,
      );

      pointAnnotationManager.create(annotationOptions);
    }
  }

  Future<void> _setCameraToFitAllMarkers() async {
    if (busStops.isEmpty) return;

    // Calculate bounds that contain all markers
    double minLat = busStops[0]['latitude'];
    double maxLat = busStops[0]['latitude'];
    double minLon = busStops[0]['longitude'];
    double maxLon = busStops[0]['longitude'];

    for (var stop in busStops) {
      minLat = min(minLat, stop['latitude']);
      maxLat = max(maxLat, stop['latitude']);
      minLon = min(minLon, stop['longitude']);
      maxLon = max(maxLon, stop['longitude']);
    }

    // Calculate center point
    double centerLat = (minLat + maxLat) / 2;
    double centerLon = (minLon + maxLon) / 2;

    // Calculate zoom level
    double zoom = _calculateZoomLevel(minLat, maxLat, minLon, maxLon);

    CameraOptions cameraOptions = CameraOptions(
      center: Point(coordinates: Position(centerLon, centerLat)),
      zoom: zoom,
      bearing: 0.0,
    );

    mapboxMapController?.setCamera(cameraOptions);
  }

  double _calculateZoomLevel(double minLat, double maxLat, double minLon, double maxLon) {
    // Earth's circumference in meters at the equator
    const double earthCircumference = 40075000.0;

    // Calculate the latitudinal and longitudinal spans
    double latDiff = maxLat - minLat;
    double lonDiff = maxLon - minLon;

    // Add some padding around the markers (20% of the span)
    double paddingFactor = 1.5;
    latDiff *= paddingFactor;
    lonDiff *= paddingFactor;

    // Convert latitudinal span to meters (approximate)
    double latSpan = latDiff * earthCircumference / 360;

    // Convert longitudinal span to meters (adjusted for latitude)
    double lonSpan = lonDiff * earthCircumference / 360 * cos((minLat + maxLat) * pi / 360);

    // Determine the maximum span (we want to fit both dimensions)
    double maxSpan = max(latSpan, lonSpan);

    // Get screen dimensions
    double screenWidth = MediaQuery.of(context).size.width;
    double screenHeight = MediaQuery.of(context).size.height;
    double minScreenDimension = min(screenWidth, screenHeight);

    // Calculate zoom level based on how many meters should fit in one pixel
    // 256 is the tile size in pixels
    double zoom = log(earthCircumference / (maxSpan / minScreenDimension * 256)) / log(2);

    // Further adjust zoom level to be less zoomed-in
    zoom -= 1.0; // Reduce zoom level by 1 to show more area

    // Clamp the zoom level to reasonable bounds
    return zoom.clamp(10.0, 18.0);
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




// Future<void> _setCameraToUserLocation() async {
//   var userLocation = await _liveLocationService.getCurrentLocation();
//
//   if (userLocation != null) {
//     double latitude = userLocation.latitude;
//     double longitude = userLocation.longitude;
//
//     CameraOptions cameraOptions = CameraOptions(
//       center: Point(coordinates: Position(longitude, latitude)),
//       zoom: 14.5,
//       bearing: 0.0, // Facing north
//     );
//
//     mapboxMapController?.setCamera(cameraOptions);
//   }
// }