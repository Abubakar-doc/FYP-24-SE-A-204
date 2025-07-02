import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/theme_controller.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:ntu_ride_pilot/services/ride/live_location.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class BusLocationAndBusStopMap extends StatefulWidget {
  final void Function(Future<void> Function() cameraFunction)? onMapReady;
  final List<Map<String, dynamic>>? busStops;
  final ByteData? defaultMarkerBytes;
  final ByteData? firstMarkerBytes;
  final ByteData? lastMarkerBytes;
  final ByteData? busMarkerBytes;
  final bool showCountOnly;
  final double? latitude;
  final double? longitude;
  final String? busId;

  const BusLocationAndBusStopMap({
    super.key,
    this.onMapReady,
    this.busStops,
    this.defaultMarkerBytes,
    this.firstMarkerBytes,
    this.lastMarkerBytes,
    this.busMarkerBytes,
    this.showCountOnly = false, // Default value is false
    this.latitude, // Passing latitude
    this.longitude,
    this.busId,
  });

  @override
  State<BusLocationAndBusStopMap> createState() =>
      _BusLocationAndBusStopMapState();
}

class _BusLocationAndBusStopMapState extends State<BusLocationAndBusStopMap> {
  MapboxMap? mapboxMapController;
  PointAnnotationManager? _pointAnnotationManager;
  PolylineAnnotationManager? _polylineAnnotationManager;
  final ThemeController _themeController = Get.find<ThemeController>();
  late LocationService _liveLocationService;
  bool _isLocationPermissionGranted = false;

  @override
  void initState() {
    _liveLocationService = LocationService(context);
    super.initState();
  }

  @override
  void didUpdateWidget(BusLocationAndBusStopMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.busStops != oldWidget.busStops) {
      _updateBusStopMarkers();
      _setCameraToFitAllMarkers();
    }

    // Check if latitude and longitude have changed
    if (widget.latitude != oldWidget.latitude ||
        widget.longitude != oldWidget.longitude) {
      _setCameraToFitAllMarkers(); // Recalculate camera position
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
    // print("Mapbox Map Controller initialized: $mapboxMapController");
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

    // Directly call camera function without checking location
    _checkLocationPermissionAndEnableLocation();
    _setCameraToFitAllMarkers();
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
    }
  }

  void _addBusStopMarkers() async {
    if (mapboxMapController == null) {
      // print("Mapbox Map Controller is not initialized.");
      return;
    }
    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;
    final pointAnnotationManager =
        await mapboxMapController!.annotations.createPointAnnotationManager();
    // print("_pointAnnotationManager initialized: $_pointAnnotationManager");

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
        textField: widget.showCountOnly
            ? '${i + 1}' // Only show the count
            : '${i + 1}. ${busStop['busStopName']}', // Show count + name
        textColor: isDarkMode ? Colors.white.value : Colors.black.value,
        image: isFirst
            ? firstMarkerImage
            : (isLast ? lastMarkerImage : defaultMarkerImage),
        iconSize: 0.15,
      );

      pointAnnotationManager.create(annotationOptions);
    }
    _updateBusStopMarkers();
  }

  void _updateBusStopMarkers() async {
    if (mapboxMapController == null || widget.busStops == null) return;

    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;

    // print("Bus Stops: ${widget.busStops}");
    _pointAnnotationManager ??=
        await mapboxMapController!.annotations.createPointAnnotationManager();

    await _pointAnnotationManager!.deleteAll();

    final annotations = widget.busStops!.asMap().entries.map((entry) {
      int index = entry.key;
      var busStop = entry.value;
      bool isFirst = index == 0;
      bool isLast = index == widget.busStops!.length - 1;

      String markerText = widget.showCountOnly
          ? '${index + 1}' // Only show the count
          : '${index + 1}. ${busStop['busStopName']}'; // Show count + name

      return PointAnnotationOptions(
        geometry: Point(
            coordinates: Position(busStop['longitude'], busStop['latitude'])),
        textField: markerText,
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

    _polylineAnnotationManager!.create(
      PolylineAnnotationOptions(
        geometry: LineString(coordinates: lineCoordinates),
        lineColor: Colors.blue.value,
        lineWidth: 2.0,
      ),
    );
  }

  Future<void> _setCameraToFitAllMarkers() async {
    // Use the provided latitude and longitude or fallback to default values
    double latitude =
        widget.latitude ?? 31.460903342753127; // Default to Singapore if null
    double longitude =
        widget.longitude ?? 73.14770214770297; // Default to Singapore if null

    // Use flyTo to animate to the new camera position
    CameraOptions cameraOptions = CameraOptions(
      center: Point(coordinates: Position(longitude, latitude)),
      zoom: 14.5,
      bearing: 0.0,
    );

    // Add the polyline annotation
    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;

    // Add animation
    await mapboxMapController?.flyTo(
      cameraOptions,
      MapAnimationOptions(
        duration: 1000,
        startDelay: 0,
      ),
    );
    final ByteData defaultMarkerBytes =
        await rootBundle.load('assets/pictures/marker.png');
    // print("Default marker image loaded successfully.");

    // Add the marker and text at the given coordinates
    if (widget.defaultMarkerBytes != null || widget.busMarkerBytes != null) {
      // Determine if we're using custom coordinates or default coordinates
      bool isCustomCoordinates =
          widget.latitude != null && widget.longitude != null;

      final markerOptions = PointAnnotationOptions(
        geometry: Point(coordinates: Position(longitude, latitude)),
        image: isCustomCoordinates
            ? widget.busMarkerBytes?.buffer.asUint8List()
            : widget.defaultMarkerBytes?.buffer.asUint8List(),
        iconSize: 0.15,
        textField: isCustomCoordinates
            ? widget.busId ??
                'busid' // Use busId if provided, otherwise 'busid'
            : 'NTU', // Default text for default coordinates
        textColor: isDarkMode ? Colors.white.value : Colors.black.value,
        textSize: 16, // Size of the text
      );

      // Ensure the point annotation manager is initialized
      _pointAnnotationManager ??=
          await mapboxMapController!.annotations.createPointAnnotationManager();

      // Clear any existing markers first
      await _pointAnnotationManager?.deleteAll();

      // Create the marker with the text
      await _pointAnnotationManager?.create(markerOptions);
    }
  }
}
