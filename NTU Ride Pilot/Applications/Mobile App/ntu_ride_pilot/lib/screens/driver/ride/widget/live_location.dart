import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/theme_controller.dart';
import 'package:ntu_ride_pilot/services/ride/live_location.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class LiveLocation extends StatefulWidget {
  final void Function(Future<void> Function() cameraFunction)? onMapReady;
  final List<Map<String, dynamic>>? busStops;
  final ByteData? defaultMarkerBytes;
  final ByteData? firstMarkerBytes;
  final ByteData? lastMarkerBytes;

  const LiveLocation({
    super.key,
    this.onMapReady,
    this.busStops,
    this.defaultMarkerBytes,
    this.firstMarkerBytes,
    this.lastMarkerBytes,
  });

  @override
  State<LiveLocation> createState() => _LiveLocationState();
}

class _LiveLocationState extends State<LiveLocation> {
  MapboxMap? mapboxMapController;
  bool _isLocationPermissionGranted = false;
  PointAnnotationManager? _pointAnnotationManager;
  late LocationService _liveLocationService;
  PolylineAnnotationManager? _polylineAnnotationManager;
  final ThemeController _themeController = Get.find<ThemeController>();

  @override
  void initState() {
    super.initState();
    _liveLocationService = LocationService(context);
  }

  @override
  void didUpdateWidget(LiveLocation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.busStops != oldWidget.busStops) {
      _updateBusStopMarkers();
      _setCameraToFitAllMarkers();
    }
  }

  @override
  void dispose() {
    _pointAnnotationManager?.deleteAll();
    _polylineAnnotationManager?.deleteAll();
    _pointAnnotationManager = null;
    _polylineAnnotationManager = null;
    mapboxMapController = null;
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateMapStyle();
  }

  Future<void> _updateMapStyle() async {
    if (mapboxMapController == null) return;

    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;
    String mapStyle = isDarkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v11";

    await mapboxMapController?.loadStyleURI(mapStyle);
    _updateBusStopMarkers();
    _addBusStopLines();
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final currentTheme = _themeController.themeMode.value;
      return Stack(
        children: [
          MapWidget(
            onMapCreated: _onMapCreated,
          ),
        ],
      );
    });
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

    // Check location permission and enable location settings
    _checkLocationPermissionAndEnableLocation();
  }

  Future<void> _checkLocationPermissionAndEnableLocation() async {
    bool hasPermission =
        await _liveLocationService.getCurrentLocation() != null;

    if (hasPermission) {
      setState(() {
        _isLocationPermissionGranted = true;
      });
      _liveLocationService.enableLocationSettings(mapboxMapController);
      _setCameraToFitAllMarkers();
      _addBusStopMarkers();
    } else {
      SnackbarUtil.showError('GPS Error!', 'GPS access is required!');
      // Don't exit the app, just show the error
      // SystemNavigator.pop();
    }
  }

  void _updateBusStopMarkers() async {
    if (mapboxMapController == null || widget.busStops == null) return;

    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;

    _pointAnnotationManager ??=
        await mapboxMapController!.annotations.createPointAnnotationManager();

    await _pointAnnotationManager!.deleteAll();

    final annotations = widget.busStops!.asMap().entries.map((entry) {
      int index = entry.key;
      var busStop = entry.value;
      bool isFirst = index == 0;
      bool isLast = index == widget.busStops!.length - 1;

      return PointAnnotationOptions(
        geometry: Point(
            coordinates: Position(busStop['longitude'], busStop['latitude'])),
        textField: '${index + 1}. ${busStop['busStopName']}',
        textColor: isDarkMode ? Colors.white.value : Colors.black.value,
        image: isFirst
            ? widget.firstMarkerBytes?.buffer.asUint8List()
            : (isLast
                ? widget.lastMarkerBytes?.buffer.asUint8List()
                : widget.defaultMarkerBytes?.buffer.asUint8List()),
        iconSize: 0.15,
      );
    }).toList();

    _pointAnnotationManager!.createMulti(annotations);

    // Add lines between bus stops
    await _addBusStopLines();
  }

  void _addBusStopMarkers() async {
    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;
    final pointAnnotationManager =
        await mapboxMapController!.annotations.createPointAnnotationManager();

    // Load all marker images
    final ByteData defaultMarkerBytes =
        await rootBundle.load('assets/pictures/marker.png');
    final Uint8List defaultMarkerImage =
        defaultMarkerBytes.buffer.asUint8List();

    final ByteData firstMarkerBytes =
        await rootBundle.load('assets/pictures/first_marker.png');
    final Uint8List firstMarkerImage = firstMarkerBytes.buffer.asUint8List();

    final ByteData lastMarkerBytes =
        await rootBundle.load('assets/pictures/last_marker.png');
    final Uint8List lastMarkerImage = lastMarkerBytes.buffer.asUint8List();

    for (var i = 0; i < (widget.busStops ?? []).length; i++) {
      var busStop = widget.busStops![i];
      final point = Point(
          coordinates: Position(busStop['longitude'], busStop['latitude']));

      bool isFirst = i == 0;
      bool isLast = i == widget.busStops!.length - 1;

      final annotationOptions = PointAnnotationOptions(
        geometry: point,
        textField: '${i + 1}. ${busStop['busStopName']}',
        textColor: isDarkMode ? Colors.white.value : Colors.black.value,
        image: isFirst
            ? firstMarkerImage
            : (isLast ? lastMarkerImage : defaultMarkerImage),
        iconSize: 0.15,
      );

      pointAnnotationManager.create(annotationOptions);
    }
    _updateBusStopMarkers;
  }

  Future<void> _setCameraToFitAllMarkers() async {
    var userLocation = await _liveLocationService.getCurrentLocation();

    if ((widget.busStops ?? []).isEmpty) {
      if (userLocation != null) {
        double latitude = userLocation.latitude;
        double longitude = userLocation.longitude;

        CameraOptions cameraOptions = CameraOptions(
          center: Point(coordinates: Position(longitude, latitude)),
          zoom: 14.5,
          bearing: 0.0,
        );

        // Add animation
        mapboxMapController?.flyTo(
          cameraOptions,
          MapAnimationOptions(
            duration: 1000,
            startDelay: 0,
          ),
        );
      }
      return;
    }

    // Calculate bounds with padding
    double padding = 0.01; // degrees
    double minLat = widget.busStops![0]['latitude'] - padding;
    double maxLat = widget.busStops![0]['latitude'] + padding;
    double minLon = widget.busStops![0]['longitude'] - padding;
    double maxLon = widget.busStops![0]['longitude'] + padding;

    for (var stop in widget.busStops ?? []) {
      minLat = min(minLat, stop['latitude'] - padding);
      maxLat = max(maxLat, stop['latitude'] + padding);
      minLon = min(minLon, stop['longitude'] - padding);
      maxLon = max(maxLon, stop['longitude'] + padding);
    }

    // Include user location if available
    if (userLocation != null) {
      minLat = min(minLat, userLocation.latitude - padding);
      maxLat = max(maxLat, userLocation.latitude + padding);
      minLon = min(minLon, userLocation.longitude - padding);
      maxLon = max(maxLon, userLocation.longitude + padding);
    }

    // Calculate center and zoom
    double centerLat = (minLat + maxLat) / 2;
    double centerLon = (minLon + maxLon) / 2;
    double zoom = _calculateZoomLevel(minLat, maxLat, minLon, maxLon);

    CameraOptions cameraOptions = CameraOptions(
      center: Point(coordinates: Position(centerLon, centerLat)),
      zoom: zoom,
      bearing: 0.0,
    );

    // Use flyTo for smooth animation
    mapboxMapController?.flyTo(
      cameraOptions,
      MapAnimationOptions(
        duration: 1000,
        startDelay: 0,
      ),
    );
  }

  double _calculateZoomLevel(
      double minLat, double maxLat, double minLon, double maxLon) {
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
    double lonSpan =
        lonDiff * earthCircumference / 360 * cos((minLat + maxLat) * pi / 360);

    // Determine the maximum span (we want to fit both dimensions)
    double maxSpan = max(latSpan, lonSpan);

    // Get screen dimensions
    double screenWidth = MediaQuery.of(context).size.width;
    double screenHeight = MediaQuery.of(context).size.height;
    double minScreenDimension = min(screenWidth, screenHeight);

    // Calculate zoom level based on how many meters should fit in one pixel
    // 256 is the tile size in pixels
    double zoom =
        log(earthCircumference / (maxSpan / minScreenDimension * 256)) / log(2);

    // Further adjust zoom level to be less zoomed-in
    zoom -= 1.0; // Reduce zoom level by 1 to show more area

    // Clamp the zoom level to reasonable bounds
    return zoom.clamp(10.0, 18.0);
  }

  Future<void> _addBusStopLines() async {
    if (mapboxMapController == null ||
        widget.busStops == null ||
        widget.busStops!.length < 2) {
      return;
    }

    _polylineAnnotationManager ??= await mapboxMapController!.annotations
        .createPolylineAnnotationManager();

    await _polylineAnnotationManager!.deleteAll();

    // Create a list of points for the polyline
    List<Position> lineCoordinates = [];
    for (var busStop in widget.busStops!) {
      lineCoordinates.add(Position(busStop['longitude'], busStop['latitude']));
    }

    // Add the polyline annotation
    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;

    _polylineAnnotationManager!.create(
      PolylineAnnotationOptions(
        geometry: LineString(coordinates: lineCoordinates),
        lineColor: isDarkMode ? Colors.lightBlue.value : Colors.blue.value,
        lineWidth: 4.0,
      ),
    );
  }
}
