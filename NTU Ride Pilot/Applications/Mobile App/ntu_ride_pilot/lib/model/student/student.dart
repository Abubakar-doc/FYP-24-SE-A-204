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
  final String? busCardId;

  @HiveField(5)
  final String? profilePicLink;

  @HiveField(6)
  late final String role;

  @HiveField(7)
  final String? busCardStatus;

  StudentModel({
    required this.email,
    required this.name,
    required this.rollNo,
    required this.feePaid,
    this.busCardId,
    this.profilePicLink,
    this.role = 'student',
    this.busCardStatus,
  });

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'name': name,
      'roll_no': rollNo,
      'fee_paid': feePaid,
      'bus_card_id': busCardId,
      'profile_pic_link': profilePicLink,
      'bus_card_status': busCardStatus,
    };
  }

  factory StudentModel.fromMap(Map<String, dynamic> map) {
    return StudentModel(
      email: map['email'] ?? '',
      name: map['name'] ?? '',
      rollNo: map['roll_no'] ?? '',
      feePaid: map['fee_paid'] ?? false,
      busCardId: map['bus_card_id'],
      profilePicLink: map['profile_pic_link'],
      busCardStatus: map['bus_card_status'],
    )..role = 'student';
  }
}
