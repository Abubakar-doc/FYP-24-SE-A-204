import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';

part 'ride.g.dart';

@HiveType(typeId: 4)
class RideModel {
  @HiveField(0)
  final String? rideId; // Nullable if needed

  @HiveField(1)
  final String routeId;

  @HiveField(2)
  String? rideStatus; // Not 'final' so we can update it

  @HiveField(3)
  final String busId;

  @HiveField(4)
  final String driverId;

  // List of online roll numbers
  @HiveField(5)
  final List<String> onlineOnBoard;

  // List of offline roll numbers
  @HiveField(6)
  final List<String> offlineOnBoard;

  @HiveField(7)
  DateTime? etaNextStop; // Make nullable

  @HiveField(8)
  final DateTime createdAt; // This is a DateTime

  @HiveField(9)
  final DateTime? endedAt;

  // Current location (longitude and latitude)
  @HiveField(10)
  Map<String, String>? currentLocation; // Make nullable

  // The name of the next stop
  @HiveField(11)
  String? nextStopName;

  @HiveField(12)
  int? seatCapacity; // Changed to nullable int

  RideModel({
    this.rideId,
    required this.routeId,
    this.rideStatus,
    required this.busId,
    required this.driverId,
    required this.onlineOnBoard,
    required this.offlineOnBoard,
    this.etaNextStop, // Make it nullable
    this.currentLocation, // Make it nullable
    this.nextStopName,
    this.seatCapacity, // Allow nullable seating capacity
    required this.createdAt, // Ensure this is required
    this.endedAt,
  });

  // Convert RideModel to a Map for saving in Firestore
  Map<String, dynamic> toMap() {
    return {
      'auto_id': rideId,
      'route_id': routeId,
      'ride_status': rideStatus,
      'bus_id': busId,
      'driver_id': driverId,
      'onlineOnBoard': onlineOnBoard,
      'offlineOnBoard': offlineOnBoard,
      'eta': etaNextStop?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'ended_at': endedAt?.toIso8601String(),
      'currentLocation': currentLocation,
      'nextStopName': nextStopName,
      'seatCapacity': seatCapacity, // Allow nullable seating capacity
    };
  }

  // Factory constructor for creating RideModel from a Map
  factory RideModel.fromMap(Map<String, dynamic> map) {
    // Handle created_at as Timestamp from Firestore
    DateTime createdAt;
    if (map['created_at'] is Timestamp) {
      createdAt = (map['created_at'] as Timestamp)
          .toDate(); // Convert Timestamp to DateTime
    } else {
      createdAt = DateTime
          .now(); // Default to now if for some reason it's not a Timestamp
    }

    // Handle etaNextStop as time in minutes
    DateTime? etaNextStop;
    if (map['eta'] != null) {
      final etaMinutes = map['eta'] as double;
      etaNextStop = DateTime.now().add(
        Duration(
          minutes: etaMinutes.toInt(),
          seconds: ((etaMinutes % 1) * 60).toInt(),
        ),
      );
    }

    return RideModel(
      rideId: map['auto_id'],
      routeId: map['route_id'] ?? '',
      rideStatus: map['ride_status'] ?? '',
      busId: map['bus_id'] ?? '',
      driverId: map['driver_id'] ?? '',
      onlineOnBoard: List<String>.from(map['onlineOnBoard'] ?? []),
      offlineOnBoard: List<String>.from(map['offlineOnBoard'] ?? []),
      etaNextStop: etaNextStop,
      createdAt: createdAt, // Correctly parsed DateTime from Timestamp
      endedAt: map['ended_at'] != null ? DateTime.parse(map['ended_at']) : null,
      currentLocation: map['currentLocation'] != null
          ? Map<String, String>.from(map['currentLocation'])
          : null,
      nextStopName: map['nextStopName'],
      seatCapacity: map['seatCapacity'] != null
          ? map['seatCapacity'] as int?
          : null, // Handle nullable int
    );
  }
}
