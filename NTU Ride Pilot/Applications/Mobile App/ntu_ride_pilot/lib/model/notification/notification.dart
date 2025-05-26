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

  @HiveField(6)
  bool isDeleted;

  NotificationModel({
    required this.notificationId,
    required this.title,
    required this.message,
    required this.mediaLinks,
    required this.createdAt,
    this.read = false,
    this.isDeleted = false,  // Default false
  });

  // Convert NotificationModel to Map for Firestore or other uses
  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'message': message,
      'mediaLinks': mediaLinks,
      'createdAt': createdAt.toIso8601String(),
      'read': read,
      'isDeleted': isDeleted,
    };
  }

  // Create NotificationModel from Firestore map
  factory NotificationModel.fromMap(Map<String, dynamic> map, String docId) {
    DateTime createdAt;
    if (map['created_at'] is Timestamp) {
      createdAt = (map['created_at'] as Timestamp).toDate();
    } else {
      createdAt = DateTime.tryParse(map['created_at'] ?? '') ?? DateTime.now();
    }

    return NotificationModel(
      notificationId: docId,
      title: map['title'] ?? 'Untitled Notification',
      message: map['message'] ?? 'No message',
      mediaLinks: List<String>.from(map['mediaLinks'] ?? []),
      createdAt: createdAt,
      read: map['read'] ?? false,
      isDeleted: map['isDeleted'] ?? false,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is NotificationModel &&
        other.notificationId == notificationId &&
        other.title == title &&
        other.message == message &&
        other.read == read &&
        other.isDeleted == isDeleted &&
        other.createdAt == createdAt &&
        _listEquals(other.mediaLinks, mediaLinks);
  }

  @override
  int get hashCode {
    return notificationId.hashCode ^
    title.hashCode ^
    message.hashCode ^
    read.hashCode ^
    isDeleted.hashCode ^
    createdAt.hashCode ^
    mediaLinks.hashCode;
  }

  bool _listEquals(List<String> a, List<String> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}
