import 'dart:async';
import 'dart:math' as Math;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/services/common/permission/location_permission.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:http/http.dart' as http;
import 'dart:convert';

class LocationService {
  final BuildContext context;
  final LocationPermission _locationPermission;
  Timer? _etaUpdateTimer;
  bool isLocationUpdating = false;
  static const Duration PERIODIC_UPDATE_INTERVAL = Duration(seconds: 15);

  static Future<void> init() async {
    MapboxOptions.setAccessToken(
      "pk.eyJ1IjoiYTEzdTEzYWthciIsImEiOiJjbTZ1enk1OWQwMmk0MmpzY2hvZW9hdm1yIn0.MUvJhxa9kuRSvus6oclMMw",
    );
  }

  LocationService(this.context)
      : _locationPermission = LocationPermission(context);

  Future<geo.Position?> getCurrentLocation() async {
    bool hasPermission = await _locationPermission.checkLocationPermission();
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

  void enableLocationSettings(MapboxMap? mapboxMapController) {
    mapboxMapController?.location.updateSettings(
      LocationComponentSettings(enabled: true, pulsingEnabled: true),
    );
  }

  Future<void> stopPeriodicLocationUpdates() async {
    if (_etaUpdateTimer != null) {
      _etaUpdateTimer?.cancel();
      _etaUpdateTimer = null;
      isLocationUpdating = false;
    }
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

    // If it's the last stop, we should handle it differently
    if (nextBusStop != null &&
        nextBusStop['busStopName'] == 'Last Stop (Continued ETA)') {
      // Continue giving ETA updates at the last stop
      double etaMinutes =
          await _calculateETAToNextStop(currentPosition, nextBusStop);

      // Update ETA and next stop name in Firestore
      await _updateRideETAInFirestore(
          ride.rideId!, etaMinutes, nextBusStop['busStopName']);
      await _updateRideETAInHive(ride, etaMinutes, nextBusStop['busStopName']);

      return; // Continue ETA updates without looking for the next stop
    }

    if (nextBusStop == null) {
      // SnackbarUtil.showError("Error", "No next bus stop found.");
      return;
    }

    // Ensure next bus stop has a valid busStopName
    String nextStopName = nextBusStop['busStopName'] ?? 'Unknown';
    // print("Next stop name: $nextStopName"); // Debugging log

    // Calculate the ETA to the next bus stop using Mapbox API
    double etaMinutes =
        await _calculateETAToNextStop(currentPosition, nextBusStop);
    // print("Calculated ETA: $etaMinutes minutes"); // Debug log

    // Update ETA and nextStopName in Firestore
    await _updateRideETAInFirestore(ride.rideId!, etaMinutes, nextStopName);

    // Update ETA and nextStopName in Hive
    await _updateRideETAInHive(ride, etaMinutes, nextStopName);
  }

  Future<void> startPeriodicLocationUpdates({
    required RideModel ride,
    required RouteModel route,
    required BuildContext context,
  }) async {
    geo.Position? currentPosition = await getCurrentLocation();

    if (currentPosition == null) {
      SnackbarUtil.showError("Error", "Failed to fetch current location.");
      return;
    }

    // Get the last bus stop
    var lastBusStop = route.busStops.last;
    double lastStopLat = lastBusStop['latitude'];
    double lastStopLon = lastBusStop['longitude'];
    double distanceToLastStop = _calculateDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      lastStopLat,
      lastStopLon,
    );

    // If the bus is near the last stop, continue updating ETA and location
    if (distanceToLastStop <= 100.0) {
      // Calculate the ETA for the last bus stop
      double etaMinutes =
          await _calculateETAToNextStop(currentPosition, lastBusStop);

      // Update ETA and location in Firestore and Hive
      await _updateRideETAInFirestore(
          ride.rideId!, etaMinutes, lastBusStop['busStopName']);
      await _updateRideETAInHive(ride, etaMinutes, lastBusStop['busStopName']);

      SnackbarUtil.showSuccess("You are at your destination",
          "Continuing ETA updates for the last stop.");
      return; // Stop looking for the next stop and just continue updating the last stop
    }

    // Proceed with periodic updates if it's not near the last stop
    if (ride.rideStatus == 'inProgress') {
      if (_etaUpdateTimer == null || !_etaUpdateTimer!.isActive) {
        _etaUpdateTimer = Timer.periodic(PERIODIC_UPDATE_INTERVAL, (_) async {
          var rideBox = await Hive.openBox<RideModel>('rides');
          var currentRide = rideBox.get('currentRide');

          if (currentRide?.rideStatus != 'inProgress') {
            stopPeriodicLocationUpdates(); // Stop updates if ride isn't in progress
          } else {
            updateRideWithETA(
                currentRide!, route, context); // Continue updating ETA
          }
        });
      }
    }
  }

  Map<String, dynamic>? _findNextBusStop(
    List<Map<String, dynamic>> busStops,
    geo.Position currentPosition,
  ) {
    double closestDistance = double.infinity;
    Map<String, dynamic>? closestBusStop;
    int closestBusStopIndex = -1;

    for (int i = 0; i < busStops.length; i++) {
      var busStop = busStops[i];

      double stopLat = busStop['latitude'];
      double stopLon = busStop['longitude'];

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
          closestBusStopIndex = i;
        }
      }
    }

    // If it's near the last bus stop, return it as the next bus stop
    if (closestBusStopIndex != -1) {
      if (closestBusStopIndex == busStops.length - 1 &&
          closestDistance <= 100.0) {
        // We're at the last stop; continue ETA updates
        return {'busStopName': 'Last Stop (Continued ETA)'};
      } else if (closestBusStopIndex < busStops.length - 1) {
        // Return the next bus stop if not at the last stop
        return busStops[closestBusStopIndex + 1];
      }
    }

    return null; // If no next stop or destination reached
  }

  Future<double> _calculateETAToNextStop(
    geo.Position currentPosition,
    Map<String, dynamic> nextBusStop,
  ) async {
    // Directly access latitude and longitude as numbers (no parsing)
    double nextStopLat = nextBusStop['latitude']; // Latitude as a number
    double nextStopLon = nextBusStop['longitude']; // Longitude as a number

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
      final response = await http.get(Uri.parse(directionsUrl));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        double durationInSeconds = data['routes'][0]['duration'] ?? 0.0;
        double etaInMinutes = durationInSeconds / 60;
        return etaInMinutes;
      } else {
        SnackbarUtil.showError("Error", "Failed to fetch ETA from Mapbox.");
        return 0.0;
      }
    } catch (e) {
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
        'nextStopName': nextStopName, // Update next stop name in Firestore
      });
      // print("Updated ETA and next stop in Firestore for rideId: $rideId");
    } catch (e) {
      // print("Error updating ETA in Firestore: $e");
    }
  }

  Future<void> _updateRideETAInHive(
    RideModel ride,
    double etaMinutes,
    String nextStopName,
  ) async {
    try {
      ride.etaNextStop =
          DateTime.now().add(Duration(minutes: etaMinutes.toInt()));
      ride.nextStopName = nextStopName; // Update next stop name in Hive
      var rideBox = await Hive.openBox<RideModel>('rides');
      await rideBox.put('currentRide', ride);
      // print("Updated ETA and next stop in Hive for ride: ${ride.rideId}");
    } catch (e) {
      // print("Error updating ETA in Hive: $e");
    }
  }
}
