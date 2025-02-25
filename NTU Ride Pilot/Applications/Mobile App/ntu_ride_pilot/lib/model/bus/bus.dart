import 'package:hive/hive.dart';

part 'bus.g.dart';

@HiveType(typeId: 5)
class BusModel {
  @HiveField(0)
  final String busId;

  BusModel({
    required this.busId,
  });

  Map<String, dynamic> toMap() {
    return {
      'bus_id': busId,
    };
  }

  factory BusModel.fromMap(Map<String, dynamic> map) {
    return BusModel(
      busId: map['bus_id'] ?? '',
    );
  }
}
