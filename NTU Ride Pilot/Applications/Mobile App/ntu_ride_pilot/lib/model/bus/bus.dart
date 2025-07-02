import 'package:hive/hive.dart';

part 'bus.g.dart';

@HiveType(typeId: 5)
class BusModel {
  @HiveField(0)
  final String busId;

  @HiveField(1)
  final int seatCapacity; // Changed to int

  BusModel({
    required this.busId,
    required this.seatCapacity, // Ensure it's an int
  });

  Map<String, dynamic> toMap() {
    return {
      'bus_id': busId,
      'seatCapacity': seatCapacity, // Store as integer
    };
  }

  factory BusModel.fromMap(Map<String, dynamic> map) {
    return BusModel(
      busId: map['bus_id'] ?? '',
      seatCapacity: map['seatCapacity'] != null
          ? int.tryParse(map['seatCapacity'].toString()) ??
              0 // Safely parse to int
          : 0, // Default to 0 if seatCapacity is missing or invalid
    );
  }
}
