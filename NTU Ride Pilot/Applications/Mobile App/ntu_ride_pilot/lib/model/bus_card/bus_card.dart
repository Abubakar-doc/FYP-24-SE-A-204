import 'package:hive/hive.dart';

part 'bus_card.g.dart';

@HiveType(typeId: 3)
class BusCardModel {
  @HiveField(0)
  final String busCardId;

  @HiveField(1)
  final String rollNo;

  @HiveField(2)
  final bool isActive;

  @HiveField(4)
  final String name;

  @HiveField(5)
  DateTime updatedAt;

  BusCardModel({
    required this.busCardId,
    required this.rollNo,
    required this.isActive,
    required this.name,
    DateTime? updatedAt,
  }) : updatedAt = updatedAt ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      'bus_card_id': busCardId,
      'roll_no': rollNo,
      'isActive': isActive,
      'name': name,
    };
  }

  factory BusCardModel.fromMap(Map<String, dynamic> map) {
    return BusCardModel(
      busCardId: map['bus_card_id'] ?? '',
      rollNo: map['roll_no'] ?? '',
      isActive: map['isActive'] ?? true,
      name: map['name'] ?? '',
    );
  }

  void updateTimestamp() {
    updatedAt = DateTime.now();
  }
}