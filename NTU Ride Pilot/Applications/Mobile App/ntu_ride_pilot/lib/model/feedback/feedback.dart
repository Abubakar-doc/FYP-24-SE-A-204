import 'package:hive/hive.dart';

part 'feedback.g.dart';

@HiveType(typeId: 8)
class Complaint extends HiveObject {
  @HiveField(0)
  final String? studentRollNo;

  @HiveField(1)
  final String? driverEmail;

  @HiveField(2)
  final String message;

  @HiveField(3)
  final DateTime createdAt;

  @HiveField(4)
  final List<String>? mediaLinks;

  @HiveField(5)
  final List<String>? mediaPublicIds;

  Complaint({
    this.studentRollNo,
    this.driverEmail,
    required this.message,
    required this.createdAt,
    this.mediaLinks,
    this.mediaPublicIds,
  });
}
