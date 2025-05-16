import 'package:hive/hive.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

part 'notification.g.dart';

@HiveType(typeId: 7)
class NotificationModel {
  @HiveField(0)
  final String notificationId;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String message;

  @HiveField(3)
  final List<String> mediaLinks;

  @HiveField(4)
  final DateTime createdAt;

  @HiveField(5)
  bool read;

  NotificationModel({
    required this.notificationId,
    required this.title,
    required this.message,
    required this.mediaLinks,
    required this.createdAt,
    this.read = false,  // Default value is false
  });

  // Convert NotificationModel to a Map for saving in Firestore
  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'message': message,
      'mediaLinks': mediaLinks,
      'createdAt': createdAt.toIso8601String(),
      'read': read,
    };
  }

  // Factory constructor for creating NotificationModel from a Map
  factory NotificationModel.fromMap(Map<String, dynamic> map, String docId) {
    // Handle createdAt field: Check if it's a Timestamp and convert it to DateTime
    DateTime createdAt;
    if (map['created_at'] is Timestamp) {
      createdAt = (map['created_at'] as Timestamp).toDate(); // Convert Timestamp to DateTime
    } else {
      createdAt = DateTime.parse(map['created_at'] ?? DateTime.now().toIso8601String());
    }

    return NotificationModel(
      notificationId: docId,  // Using the Firestore document ID
      title: map['title'] ?? 'Untitled Notification',
      message: map['message'] ?? 'No message',
      mediaLinks: List<String>.from(map['mediaLinks'] ?? []),
      createdAt: createdAt,
      read: map['read'] ?? false,  // Default to false if not present
    );
  }
}
