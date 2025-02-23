import 'package:hive/hive.dart';

part 'driver.g.dart';

@HiveType(typeId: 1)
class DriverModel {
  @HiveField(0)
  final String driverId;

  @HiveField(1)
  final String email;

  @HiveField(2)
  final String name;

  @HiveField(3)
  final String? contactNo;

  @HiveField(4)
  final String? profilePicLink;

  @HiveField(5)
  late final String role;

  DriverModel({
    required this.driverId,
    required this.email,
    required this.name,
    this.contactNo,
    this.profilePicLink,
    this.role = 'driver',
  });

  Map<String, dynamic> toMap() {
    return {
      'driverId': driverId,
      'email': email,
      'name': name,
      'contact_no': contactNo ?? '',
      if (profilePicLink != null) 'profile_pic': profilePicLink,
      'role': role,
    };
  }


  factory DriverModel.fromMap(Map<String, dynamic> map) {
    return DriverModel(
      driverId: map['driverId'] ?? '',
      email: map['email'] ?? '',
      name: map['name'] ?? '',
      contactNo: map['contact_no'] ?? '',
      profilePicLink: map['profile_pic'],
    )..role = 'driver';
  }
}
