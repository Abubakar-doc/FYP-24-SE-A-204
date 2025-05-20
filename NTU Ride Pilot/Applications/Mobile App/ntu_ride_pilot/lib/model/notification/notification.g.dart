// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class NotificationModelAdapter extends TypeAdapter<NotificationModel> {
  @override
  final int typeId = 7;

  @override
  NotificationModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return NotificationModel(
      notificationId: fields[0] as String,
      title: fields[1] as String,
      message: fields[2] as String,
      mediaLinks: (fields[3] as List).cast<String>(),
      createdAt: fields[4] as DateTime,
      read: fields[5] as bool,
      isDeleted: fields[6] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, NotificationModel obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.notificationId)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.message)
      ..writeByte(3)
      ..write(obj.mediaLinks)
      ..writeByte(4)
      ..write(obj.createdAt)
      ..writeByte(5)
      ..write(obj.read)
      ..writeByte(6)
      ..write(obj.isDeleted);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NotificationModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
