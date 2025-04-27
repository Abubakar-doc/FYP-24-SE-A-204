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
  late final DateTime etaNextStop;

  @HiveField(8)
  final DateTime createdAt;

  @HiveField(9)
  final DateTime? endedAt;

  // Current location (longitude and latitude)
  @HiveField(10)
  late final Map<String, String> currentLocation;

  // The name of the next stop
  @HiveField(11)
  String? nextStopName;

  RideModel({
    this.rideId,
    required this.routeId,
    this.rideStatus,
    required this.busId,
    required this.driverId,
    required this.onlineOnBoard,
    required this.offlineOnBoard,
    required this.etaNextStop,
    required this.currentLocation,
    this.nextStopName, // Add nextStopName here
    DateTime? createdAt,
    this.endedAt,
  }) : createdAt = createdAt ?? DateTime.now();

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
      'eta': etaNextStop.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'ended_at': endedAt?.toIso8601String(),
      'currentLocation': currentLocation, // Add currentLocation to the map
      'nextStopName': nextStopName, // Add nextStopName to the map
    };
  }

  // Factory constructor for creating RideModel from a Map
  factory RideModel.fromMap(Map<String, dynamic> map) {
    return RideModel(
      rideId: map['auto_id'],
      routeId: map['route_id'] ?? '',
      rideStatus: map['ride_status'] ?? '',
      busId: map['bus_id'] ?? '',
      driverId: map['driver_id'] ?? '',
      onlineOnBoard: List<String>.from(map['onlineOnBoard'] ?? []),
      offlineOnBoard: List<String>.from(map['offlineOnBoard'] ?? []),
      etaNextStop: DateTime.parse(map['eta'] ?? DateTime.now().toIso8601String()),
      createdAt: DateTime.parse(map['created_at'] ?? DateTime.now().toIso8601String()),
      endedAt: map['ended_at'] != null ? DateTime.parse(map['ended_at']) : null,
      currentLocation: Map<String, String>.from(map['currentLocation'] ?? {}),
      nextStopName: map['nextStopName'], // Parse nextStopName from map
    );
  }
}
