import 'package:hive/hive.dart';

part 'ride.g.dart';

@HiveType(typeId: 4)
class RideModel {
  @HiveField(0)
  final String autoId;

  @HiveField(1)
  final String routeId;

  @HiveField(2)
  String rideStatus;

  @HiveField(3)
  final String busId;

  @HiveField(4)
  final String driverId;

  @HiveField(5)
  final Map<String, String> onboard; // Map of rollNo -> processingMode

  @HiveField(6)
  DateTime eta;

  @HiveField(7)
  double speed;

  @HiveField(8)
  final DateTime createdAt;

  RideModel({
    required this.autoId,
    required this.routeId,
    required this.rideStatus,
    required this.busId,
    required this.driverId,
    required this.onboard,
    required this.eta,
    required this.speed,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  // Convert the model to a Map
  Map<String, dynamic> toMap() {
    return {
      'auto_id': autoId,
      'route_id': routeId,
      'ride_status': rideStatus,
      'bus_id': busId,
      'driver_id': driverId,
      'onboard': onboard,
      'eta': eta.toIso8601String(),
      'speed': speed,
      'created_at': createdAt.toIso8601String(),
    };
  }

  // Create a model from a Map
  factory RideModel.fromMap(Map<String, dynamic> map) {
    return RideModel(
      autoId: map['auto_id'] ?? '',
      routeId: map['route_id'] ?? '',
      rideStatus: map['ride_status'] ?? '',
      busId: map['bus_id'] ?? '',
      driverId: map['driver_id'] ?? '',
      onboard: Map<String, String>.from(map['onboard'] ?? {}),
      eta: DateTime.parse(map['eta'] ?? DateTime.now().toIso8601String()),
      speed: map['speed'] ?? 0.0,
      createdAt: DateTime.parse(map['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }
}