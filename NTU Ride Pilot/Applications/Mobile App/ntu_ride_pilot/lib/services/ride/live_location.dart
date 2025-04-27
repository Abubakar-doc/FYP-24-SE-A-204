import 'dart:async';
import 'dart:math' as Math;
import 'package:android_intent_plus/android_intent.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:ntu_ride_pilot/widget/alert_dialog/alert_dialog.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:http/http.dart' as http;
import 'dart:convert';

class LiveLocationService {
  final BuildContext context;

  LiveLocationService(this.context);
  // Timer for periodic updates
  Timer? _etaUpdateTimer;
  // Set periodic update interval to 2 minutes
  static const Duration PERIODIC_UPDATE_INTERVAL = Duration(minutes: 1);

  Future<bool> checkLocationPermission() async {
    bool isLocationServiceEnabled =
        await Permission.location.serviceStatus.isEnabled;
    if (!isLocationServiceEnabled) {
      bool serviceEnabled = await showEnableLocationServiceDialog();
      if (!serviceEnabled) {
        return false;
      }
    }

    var status = await Permission.location.status;

    if (status.isGranted) {
      return true;
    } else if (status.isDenied) {
      bool shouldRequestPermission = await showPermissionRationale();
      if (shouldRequestPermission) {
        status = await Permission.location.request();
        return status.isGranted;
      }
      return false;
    } else if (status.isPermanentlyDenied) {
      bool openedSettings = await showPermanentlyDeniedDialog();
      if (openedSettings) {
        status = await Permission.location.status;
        return status.isGranted;
      }
      return false;
    }
    return false;
  }

  Future<geo.Position?> getCurrentLocation() async {
    bool hasPermission = await checkLocationPermission();
    if (!hasPermission) return null;

    try {
      return await geo.Geolocator.getCurrentPosition(
        desiredAccuracy: geo.LocationAccuracy.high,
      );
    } catch (e) {
      SnackbarUtil.showError('Error', 'Failed to get current location.');
      return null;
    }
  }

  Future<bool> showEnableLocationServiceDialog() async {
    bool? result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return CustomAlertDialog(
          title: "Enable GPS",
          message: "GPS is disabled. Please enable it to continue.",
          onConfirm: () {
            Navigator.pop(context, true);
          },
          onCancel: () {
            Navigator.pop(context, false);
          },
          yesText: 'Enable',
          noText: 'Cancel',
          yesColor: Colors.blue,
        );
      },
    );

    if (result == true) {
      await openLocationSettings();
    }

    return result ?? false;
  }

  Future<void> openLocationSettings() async {
    try {
      AndroidIntent intent = AndroidIntent(
        action: 'android.settings.LOCATION_SOURCE_SETTINGS',
      );
      await intent.launch();
    } catch (e) {
      SnackbarUtil.showError('Error', 'Failed to open location settings.');
    }
  }

  Future<bool> showPermissionRationale() async {
    bool? result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return CustomAlertDialog(
          title: "GPS Permission",
          message: "Allow access to GPS in order to continue!",
          onConfirm: () {
            Navigator.pop(context, true);
          },
          onCancel: () {
            Navigator.pop(context, false);
          },
          yesText: 'Allow',
          noText: 'Cancel',
          yesColor: Colors.blue,
        );
      },
    );

    return result ?? false;
  }

  Future<bool> showPermanentlyDeniedDialog() async {
    bool? result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return CustomAlertDialog(
          title: "Permission Required",
          message:
              "Location permission is permanently denied. Please enable it in app settings.",
          onConfirm: () {
            Navigator.pop(context, true);
          },
          onCancel: () {
            Navigator.pop(context, false);
          },
          yesText: 'Open Settings',
          noText: 'Cancel',
          yesColor: Colors.blue,
        );
      },
    );

    if (result == true) {
      await openAppSettings();
    }

    return result ?? false;
  }

  void enableLocationSettings(MapboxMap? mapboxMapController) {
    mapboxMapController?.location.updateSettings(
      LocationComponentSettings(enabled: true, pulsingEnabled: true),
    );
  }

  Future<void> startPeriodicLocationUpdates({
    required RideModel ride,
    required RouteModel route,
    required BuildContext context,
  }) async {
    // Only start periodic updates if the ride is in progress
    if (ride.rideStatus == 'inProgress') {
      print("Starting periodic ETA updates..."); // Debug log
      // Start the periodic updates if not already started
      _etaUpdateTimer ??= Timer.periodic(PERIODIC_UPDATE_INTERVAL, (_) {
        updateRideWithETA(ride, route, context);
      });
    }
  }

  void stopPeriodicLocationUpdates() {
    _etaUpdateTimer?.cancel();
    _etaUpdateTimer = null;
  }

  Future<void> updateRideWithETA(
      RideModel ride,
      RouteModel route,
      BuildContext context,
      ) async {
    // Get the bus's current location
    geo.Position? currentPosition = await getCurrentLocation();

    if (currentPosition == null) {
      SnackbarUtil.showError("Error", "Failed to fetch current location.");
      return;
    }

    // Find the next bus stop based on the current position
    var nextBusStop = _findNextBusStop(route.busStops, currentPosition);
    if (nextBusStop == null) {
      SnackbarUtil.showError("Error", "No next bus stop found.");
      return;
    }

    // Ensure next bus stop has a valid busStopName
    String nextStopName = nextBusStop['busStopName'] ?? 'Unknown';
    print("Next stop name: $nextStopName");  // Debugging log

    // Calculate the ETA to the next bus stop using Mapbox API
    double etaMinutes = await _calculateETAToNextStop(currentPosition, nextBusStop);
    print("Calculated ETA: $etaMinutes minutes"); // Debug log

    // Update ETA and nextStopName in Firestore
    await _updateRideETAInFirestore(ride.rideId!, etaMinutes, nextStopName);

    // Update ETA and nextStopName in Hive
    await _updateRideETAInHive(ride, etaMinutes, nextStopName);
  }

  Map<String, dynamic>? _findNextBusStop(
    List<Map<String, dynamic>> busStops,
    geo.Position currentPosition,
  ) {
    double closestDistance = double.infinity;
    Map<String, dynamic>? closestBusStop;
    int closestBusStopIndex = -1;

    // Step 1: Find the closest bus stop based on current position
    for (int i = 0; i < busStops.length; i++) {
      var busStop = busStops[i];

      // Print out the bus stop details for debugging
      print("Checking bus stop: ${busStop['busStopName']}");

      // Convert latitude and longitude to doubles if they are stored as strings in Firestore
      double stopLat = double.tryParse(busStop['latitude'].toString()) ?? 0.0;
      double stopLon = double.tryParse(busStop['longitude'].toString()) ?? 0.0;

      // Ensure they are valid double values before calculating distance
      if (stopLat != 0.0 && stopLon != 0.0) {
        double distance = _calculateDistance(
          currentPosition.latitude,
          currentPosition.longitude,
          stopLat,
          stopLon,
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestBusStop = busStop;
          closestBusStopIndex = i; // Track index of the closest bus stop
        }
      }
    }

    // Step 2: If we are near the first bus stop, skip it and return the next one
    if (closestBusStopIndex != -1 &&
        closestBusStopIndex < busStops.length - 1) {
      // Return the next bus stop in the sequence
      return busStops[closestBusStopIndex + 1];
    }

    // If we have no next stop or we're at the last stop, return null
    return null;
  }

  Future<double> _calculateETAToNextStop(
    geo.Position currentPosition,
    Map<String, dynamic> nextBusStop,
  ) async {
    double nextStopLat =
        double.tryParse(nextBusStop['latitude'].toString()) ?? 0.0;
    double nextStopLon =
        double.tryParse(nextBusStop['longitude'].toString()) ?? 0.0;

    // Check if the latitude and longitude are valid
    if (nextStopLat == 0.0 || nextStopLon == 0.0) {
      SnackbarUtil.showError(
          "Error", "Invalid coordinates for the next bus stop.");
      return 0.0;
    }

    // Construct the Mapbox Directions API URL
    String accessToken =
        'pk.eyJ1IjoiYTEzdTEzYWthciIsImEiOiJjbTZ1enk1OWQwMmk0MmpzY2hvZW9hdm1yIn0.MUvJhxa9kuRSvus6oclMMw'; // Replace with your Mapbox token
    String directionsUrl =
        'https://api.mapbox.com/directions/v5/mapbox/driving/${currentPosition.longitude},${currentPosition.latitude};$nextStopLon,$nextStopLat?alternatives=false&geometries=geojson&steps=true&access_token=$accessToken';

    try {
      // Send request to Mapbox Directions API
      final response = await http.get(Uri.parse(directionsUrl));

      if (response.statusCode == 200) {
        // Parse the response from Mapbox Directions API
        final data = json.decode(response.body);

        // Extract the duration from the response (in seconds)
        double durationInSeconds = data['routes'][0]['duration'] ?? 0.0;

        // Convert the duration from seconds to minutes
        double etaInMinutes = durationInSeconds / 60;

        return etaInMinutes;
      } else {
        // Handle API error
        SnackbarUtil.showError("Error", "Failed to fetch ETA from Mapbox.");
        return 0.0;
      }
    } catch (e) {
      // Handle any network or parsing errors
      SnackbarUtil.showError("Error", "Failed to fetch ETA.");
      return 0.0;
    }
  }

  double _calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double R = 6371000; // Radius of Earth in meters
    double phi1 = lat1 * (Math.pi / 180);
    double phi2 = lat2 * (Math.pi / 180);
    double deltaPhi = (lat2 - lat1) * (Math.pi / 180);
    double deltaLambda = (lon2 - lon1) * (Math.pi / 180);

    double a = (Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)) +
        (Math.cos(phi1) *
            Math.cos(phi2) *
            Math.sin(deltaLambda / 2) *
            Math.sin(deltaLambda / 2));
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  Future<void> _updateRideETAInFirestore(
      String rideId,
      double etaMinutes,
      String nextStopName,
      ) async {
    try {
      await FirebaseFirestore.instance.collection('rides').doc(rideId).update({
        'eta_next_stop': etaMinutes,
        'nextStopName': nextStopName,  // Update next stop name in Firestore
      });
      print("Updated ETA and next stop in Firestore for rideId: $rideId");
    } catch (e) {
      print("Error updating ETA in Firestore: $e");
    }
  }

  Future<void> _updateRideETAInHive(
      RideModel ride,
      double etaMinutes,
      String nextStopName,
      ) async {
    try {
      ride.etaNextStop = DateTime.now().add(Duration(minutes: etaMinutes.toInt()));
      ride.nextStopName = nextStopName;  // Update next stop name in Hive
      var rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.put('currentRide', ride);
      print("Updated ETA and next stop in Hive for ride: ${ride.rideId}");
    } catch (e) {
      print("Error updating ETA in Hive: $e");
    }
  }


}
