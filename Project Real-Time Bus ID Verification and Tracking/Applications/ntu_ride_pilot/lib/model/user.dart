import 'package:hive/hive.dart';

part 'user.g.dart';

@HiveType(typeId: 1)
class UserModel {
  @HiveField(0)
  final String uid;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final String email;

  @HiveField(3)
  final String role;

  @HiveField(4)
  final String? rollNo;

  @HiveField(5)
  final bool? feePaid;

  UserModel({
    required this.uid,
    required this.name,
    required this.email,
    required this.role,
    this.rollNo,
    this.feePaid,
  });

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'name': name,
      'email': email,
      'role': role,
      if (rollNo != null) 'rollNo': rollNo,
      if (feePaid != null) 'feePaid': feePaid,
    };
  }

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      uid: map['uid'] ?? '',
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      role: map['role'] ?? 'student',
      rollNo: map['rollNo'],
      feePaid: map['feePaid'] ?? false,
    );
  }
}
