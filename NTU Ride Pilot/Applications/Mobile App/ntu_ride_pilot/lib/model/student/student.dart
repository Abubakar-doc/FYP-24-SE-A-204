import 'package:hive/hive.dart';

part 'student.g.dart';

@HiveType(typeId: 2)
class StudentModel {
  @HiveField(0)
  final String email;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final String rollNo;

  @HiveField(3)
  final bool feePaid;

  @HiveField(4)
  final String busCardId;

  @HiveField(5)
  final String busCardStatus;

  @HiveField(6)
  late final String role;

  StudentModel({
    required this.email,
    required this.name,
    required this.rollNo,
    required this.feePaid,
    required this.busCardId,
    required this.busCardStatus,
    this.role = 'student',
  });

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'name': name,
      'roll_no': rollNo,
      'fee_paid': feePaid,
      'bus_card_id': busCardId,
      'bus_card_status': busCardStatus,
    };
  }

  factory StudentModel.fromMap(Map<String, dynamic> map) {
    return StudentModel(
      email: map['email'] ?? '',
      name: map['name'] ?? '',
      rollNo: map['roll_no'] ?? '',
      feePaid: map['fee_paid'] ?? false,
      busCardId: map['bus_card_id'] ?? '',
      busCardStatus: map['bus_card_status'] ?? '',
    )..role = 'student'; // Assign role after fetching from Firestore
  }
}
