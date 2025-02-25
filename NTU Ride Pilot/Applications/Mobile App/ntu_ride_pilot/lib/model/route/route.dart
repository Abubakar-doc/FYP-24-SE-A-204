import 'package:hive/hive.dart';

part 'route.g.dart';

@HiveType(typeId: 6)
class RouteModel {
  @HiveField(0)
  final String routeId;

  @HiveField(1)
  final String name;

  // Map of sequence (as string) to busStopId.
  @HiveField(2)
  final Map<String, String> busStopId;

  RouteModel({
    required this.routeId,
    required this.name,
    required this.busStopId,
  });

  Map<String, dynamic> toMap() {
    return {
      'route_id': routeId,
      'name': name,
      'bus_stop_id': busStopId,
    };
  }

  factory RouteModel.fromMap(Map<String, dynamic> map) {
    return RouteModel(
      routeId: map['route_id'] ?? '',
      name: map['name'] ?? '',
      busStopId: Map<String, String>.from(map['bus_stop_id'] ?? {}),
    );
  }
}
