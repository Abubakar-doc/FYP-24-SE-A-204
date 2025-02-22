import 'package:hive/hive.dart';

part 'ride.g.dart';

@HiveType(typeId: 4)
class RideModel {
  @HiveField(0)
  final String rideId;

  @HiveField(1)
  final String routeId;

  @HiveField(2)
  String rideStatus;

  @HiveField(3)
  final String busId;

  @HiveField(4)
  final String driverId;

  @HiveField(5)
  final Map<String, dynamic> onboard; // Map of rollNo -> { processingMode: String, timestamp: String }

  @HiveField(6)
  DateTime etaNextStop;

  @HiveField(7)
  final DateTime createdAt;

  @HiveField(8)
  final DateTime? endedAt;

  RideModel({
    required this.rideId,
    required this.routeId,
    required this.rideStatus,
    required this.busId,
    required this.driverId,
    required this.onboard,
    required this.etaNextStop,
    DateTime? createdAt,
    this.endedAt,
  }) : createdAt = createdAt ?? DateTime.now();

  // Convert the model to a Map.
  Map<String, dynamic> toMap() {
    return {
      'auto_id': rideId,
      'route_id': routeId,
      'ride_status': rideStatus,
      'bus_id': busId,
      'driver_id': driverId,
      'onboard': onboard,
      'eta': etaNextStop.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'ended_at': endedAt?.toIso8601String(),
    };
  }

  // Create a model from a Map.
  factory RideModel.fromMap(Map<String, dynamic> map) {
    return RideModel(
      rideId: map['auto_id'] ?? '',
      routeId: map['route_id'] ?? '',
      rideStatus: map['ride_status'] ?? '',
      busId: map['bus_id'] ?? '',
      driverId: map['driver_id'] ?? '',
      onboard: Map<String, dynamic>.from(map['onboard'] ?? {}),
      etaNextStop: DateTime.parse(map['eta'] ?? DateTime.now().toIso8601String()),
      createdAt: DateTime.parse(map['created_at'] ?? DateTime.now().toIso8601String()),
      endedAt: map['ended_at'] != null ? DateTime.parse(map['ended_at']) : null,
    );
  }
}
