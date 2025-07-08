import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/theme_controller.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class BusLocationAndBusStopMap extends StatefulWidget {
  final void Function(Future<void> Function() cameraFunction)? onMapReady;
  final List<Map<String, dynamic>>? busStops;
  final ByteData? defaultMarkerBytes;
  final ByteData? firstMarkerBytes;
  final ByteData? lastMarkerBytes;
  final ByteData? busMarkerBytes;
  final ByteData? grayMarkerBytes;
  final bool showCountOnly;
  final double? latitude;
  final double? longitude;
  final String? busId;
  final String? nextStopName;

  const BusLocationAndBusStopMap({
    super.key,
    this.onMapReady,
    this.busStops,
    this.defaultMarkerBytes,
    this.firstMarkerBytes,
    this.lastMarkerBytes,
    this.busMarkerBytes,
    this.grayMarkerBytes,
    this.showCountOnly = false,
    this.latitude,
    this.longitude,
    this.busId,
    this.nextStopName,
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
  PointAnnotationManager? _stopManager;
  PointAnnotationManager? _busManager;

  @override
  void initState() {
    super.initState();
    _setCameraToFitAllMarkers();
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

  @override
  void _onMapCreated(MapboxMap controller) async {
    mapboxMapController = controller;

    // load your style
    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;
    String mapStyle = isDarkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v11";
    await mapboxMapController?.loadStyleURI(mapStyle);

    // disable logos/compass/etc
    mapboxMapController?.logo.updateSettings(LogoSettings(enabled: false));
    mapboxMapController?.compass
        .updateSettings(CompassSettings(enabled: false));
    mapboxMapController?.scaleBar
        .updateSettings(ScaleBarSettings(enabled: false));
    mapboxMapController?.attribution
        .updateSettings(AttributionSettings(enabled: false));

    // create two separate annotation managers
    _stopManager ??=
        await mapboxMapController!.annotations.createPointAnnotationManager();
    _busManager ??=
        await mapboxMapController!.annotations.createPointAnnotationManager();

    // let parent hook in if needed
    widget.onMapReady?.call(_setCameraToFitAllMarkers);

    // initial draw
    await _updateBusStopMarkers();
    await _setCameraToFitAllMarkers();
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
  }

  @override
  void didUpdateWidget(BusLocationAndBusStopMap old) {
    super.didUpdateWidget(old);

    // redraw stops & recenter when stops list changes
    if (widget.busStops != old.busStops) {
      _updateBusStopMarkers();
      _setCameraToFitAllMarkers();
    }

    // recenter—and now also redraw stops—when bus lat/lon arrives
    if (widget.latitude != old.latitude || widget.longitude != old.longitude) {
      _updateBusStopMarkers();
      _setCameraToFitAllMarkers();
    }
  }

  // Future<void> _updateBusStopMarkers() async {
  //   // only draw stops once we have BOTH a non-null list AND bus coords
  //   if (mapboxMapController == null ||
  //       widget.busStops == null ||
  //       widget.latitude == null ||
  //       widget.longitude == null) {
  //     return;
  //   }
  //
  //   // clear *only* the stop-layer
  //   await _stopManager!.deleteAll();
  //
  //   final theme = Theme.of(context);
  //   bool isDarkMode = theme.brightness == Brightness.dark;
  //
  //   // build and add your stop pins
  //   final annotations = widget.busStops!.asMap().entries.map((entry) {
  //     int i = entry.key;
  //     var stop = entry.value;
  //     bool first = i == 0;
  //     bool last = i == widget.busStops!.length - 1;
  //
  //     String label = widget.showCountOnly
  //         ? '${i + 1}'
  //         : '${i + 1}. ${stop['busStopName']}';
  //
  //     Uint8List? imgBytes = first
  //         ? widget.firstMarkerBytes?.buffer.asUint8List()
  //         : last
  //             ? widget.lastMarkerBytes?.buffer.asUint8List()
  //             : widget.defaultMarkerBytes?.buffer.asUint8List();
  //
  //     return PointAnnotationOptions(
  //       geometry: Point(
  //         coordinates: Position(
  //           stop['longitude'],
  //           stop['latitude'],
  //         ),
  //       ),
  //       textField: label,
  //       textColor: isDarkMode ? Colors.white.value : Colors.black.value,
  //       image: imgBytes,
  //       iconSize: 0.15,
  //     );
  //   }).toList();
  //
  //   await _stopManager!.createMulti(annotations);
  // }
  Future<void> _updateBusStopMarkers() async {
    if (mapboxMapController == null ||
        widget.busStops == null ||
        widget.latitude == null ||
        widget.longitude == null) {
      return;
    }

    // 1️⃣ clear only the stop-layer
    await _stopManager!.deleteAll();

    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;

    // 2️⃣ find which index is the "next" stop
    final nextName = widget.nextStopName;
    int nextIndex = -1;
    if (nextName != null) {
      nextIndex =
          widget.busStops!.indexWhere((s) => s['busStopName'] == nextName);
    }
    // if not found, treat as if nextIndex is beyond the end
    if (nextIndex < 0) {
      nextIndex = widget.busStops!.length;
    }

    // 3️⃣ build your annotations list
    final annotations = widget.busStops!.asMap().entries.map((entry) {
      int i = entry.key;
      var stop = entry.value;

      // decide which icon bytes to use
      Uint8List? imgBytes;
      if (i < nextIndex) {
        // already passed this stop → gray marker
        imgBytes = widget.grayMarkerBytes?.buffer.asUint8List();
      } else {
        // upcoming or current stop → regular first/last/default
        bool first = i == 0;
        bool last = i == widget.busStops!.length - 1;
        imgBytes = first
            ? widget.firstMarkerBytes?.buffer.asUint8List()
            : (last
                ? widget.lastMarkerBytes?.buffer.asUint8List()
                : widget.defaultMarkerBytes?.buffer.asUint8List());
      }

      // label stays the same
      String label = widget.showCountOnly
          ? '${i + 1}'
          : '${i + 1}. ${stop['busStopName']}';

      return PointAnnotationOptions(
        geometry: Point(
          coordinates: Position(
            stop['longitude'],
            stop['latitude'],
          ),
        ),
        textField: label,
        textColor: isDarkMode ? Colors.white.value : Colors.black.value,
        image: imgBytes,
        iconSize: 0.15,
      );
    }).toList();

    // 4️⃣ finally draw them
    await _stopManager!.createMulti(annotations);
  }

  Future<void> _setCameraToFitAllMarkers() async {
    if (mapboxMapController == null) return;

    final theme = Theme.of(context);
    bool isDarkMode = theme.brightness == Brightness.dark;

    // 1️⃣ BUS MARKER: draw exactly as you had it
    double busLat = widget.latitude ?? 31.460903342753127;
    double busLon = widget.longitude ?? 73.14770214770297;

    if (widget.defaultMarkerBytes != null || widget.busMarkerBytes != null) {
      bool isCustom = widget.latitude != null && widget.longitude != null;
      Uint8List? busImg = isCustom
          ? widget.busMarkerBytes?.buffer.asUint8List()
          : widget.defaultMarkerBytes?.buffer.asUint8List();

      final busOpts = PointAnnotationOptions(
        geometry: Point(coordinates: Position(busLon, busLat)),
        image: busImg,
        iconSize: 0.15,
        textField: isCustom ? (widget.busId ?? 'busid') : 'NTU',
        textColor: isDarkMode ? Colors.white.value : Colors.black.value,
        textSize: 16,
      );

      // only clear/create the bus layer
      await _busManager!.deleteAll();
      await _busManager!.create(busOpts);
    }

    // 2️⃣ CAMERA: pick your target based on what you have
    if (widget.latitude != null && widget.longitude != null) {
      // ––––––––––––––––––––––––––––––––––––––
      // FOCUS ONLY ON THE BUS
      // ––––––––––––––––––––––––––––––––––––––
      await mapboxMapController!.flyTo(
        CameraOptions(
          center: Point(coordinates: Position(busLon, busLat)),
          zoom: 14.5,
          bearing: 0.0,
        ),
        MapAnimationOptions(duration: 1000, startDelay: 0),
      );
      return;
    }

    if (widget.busStops != null && widget.busStops!.isNotEmpty) {
      // ––––––––––––––––––––––––––––––––––––––
      // FIT ALL STOPS
      // ––––––––––––––––––––––––––––––––––––––
      List<double> lats = [], lons = [];
      for (var s in widget.busStops!) {
        lats.add(s['latitude']);
        lons.add(s['longitude']);
      }

      double minLat = lats.reduce(min),
          maxLat = lats.reduce(max),
          minLon = lons.reduce(min),
          maxLon = lons.reduce(max);
      const pad = 0.01;
      minLat -= pad;
      maxLat += pad;
      minLon -= pad;
      maxLon += pad;

      double centerLat = (minLat + maxLat) / 2;
      double centerLon = (minLon + maxLon) / 2;
      double zoom = _calculateZoomLevel(minLat, maxLat, minLon, maxLon);

      await mapboxMapController!.flyTo(
        CameraOptions(
          center: Point(coordinates: Position(centerLon, centerLat)),
          zoom: zoom,
          bearing: 0.0,
        ),
        MapAnimationOptions(duration: 1000, startDelay: 0),
      );
      return;
    }

    // 3️⃣ FALLBACK TO NTU
    const double ntuLat = 31.460903342753127;
    const double ntuLon = 73.14770214770297;
    await mapboxMapController!.flyTo(
      CameraOptions(
        center: Point(coordinates: Position(ntuLon, ntuLat)),
        zoom: 14.5,
        bearing: 0.0,
      ),
      MapAnimationOptions(duration: 1000, startDelay: 0),
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
}
