import 'package:hive/hive.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

part 'route.g.dart';

@HiveType(typeId: 6)
class RouteModel {
  @HiveField(0)
  final String routeId;

  @HiveField(1)
  final String name;

  // List of bus stops.
  @HiveField(2)
  final List<Map<String, dynamic>> busStops;

  @HiveField(3)
  final DateTime createdAt;

  RouteModel({
    required this.routeId,
    required this.name,
    required this.busStops,
    required this.createdAt,
  });

  // Convert RouteModel to a Map for saving in Firestore
  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'busStops': busStops,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // Factory constructor for creating RouteModel from a Map
  factory RouteModel.fromMap(Map<String, dynamic> map, String docId) {
    // Convert the bus stops field from an array to a List<Map<String, dynamic>>
    var busStopsList = map['busStops'] as List<dynamic>?;

    List<Map<String, dynamic>> busStops = [];
    if (busStopsList != null) {
      busStops = busStopsList
          .map((busStop) => Map<String, dynamic>.from(busStop))
          .toList();
    }

    // Handle createdAt field: Check if it's a Timestamp and convert it to DateTime
    DateTime createdAt;
    if (map['createdAt'] is Timestamp) {
      createdAt = (map['createdAt'] as Timestamp)
          .toDate(); // Convert Timestamp to DateTime
    } else {
      // If it's not a Timestamp, fallback to parsing as a string or use current time
      createdAt =
          DateTime.parse(map['createdAt'] ?? DateTime.now().toIso8601String());
    }

    return RouteModel(
      routeId: docId, // Using the Firestore document ID
      name: map['name'] ?? 'Unnamed Route',
      busStops: busStops,
      createdAt: createdAt, // Correctly parsed createdAt
    );
  }
}
