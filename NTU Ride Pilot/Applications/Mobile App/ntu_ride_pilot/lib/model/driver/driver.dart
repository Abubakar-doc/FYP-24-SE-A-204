import 'package:hive/hive.dart';

part 'driver.g.dart';

@HiveType(typeId: 1)
class DriverModel {
  @HiveField(0)
  final String email;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final String contactNo;

  @HiveField(3)
  final String? profilePicLink;

  @HiveField(4)
  late final String role;

  DriverModel({
    required this.email,
    required this.name,
    required this.contactNo,
    this.profilePicLink,
    this.role = 'driver',
  });

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'name': name,
      'contact_no': contactNo,
      if (profilePicLink != null) 'profile_pic': profilePicLink,
    };
  }

  factory DriverModel.fromMap(Map<String, dynamic> map) {
    return DriverModel(
      email: map['email'] ?? '',
      name: map['name'] ?? '',
      contactNo: map['contact_no'] ?? '',
      profilePicLink: map['profile_pic'],
    )..role = 'driver';
  }
}
