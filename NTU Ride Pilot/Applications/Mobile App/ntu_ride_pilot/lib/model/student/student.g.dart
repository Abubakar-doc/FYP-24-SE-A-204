// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'student.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class StudentModelAdapter extends TypeAdapter<StudentModel> {
  @override
  final int typeId = 2;

  @override
  StudentModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return StudentModel(
      email: fields[0] as String,
      name: fields[1] as String,
      rollNo: fields[2] as String,
      feePaid: fields[3] as bool,
      busCardId: fields[4] as String?,
      profilePicLink: fields[5] as String?,
      role: fields[6] as String,
      busCardStatus: fields[7] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, StudentModel obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.email)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.rollNo)
      ..writeByte(3)
      ..write(obj.feePaid)
      ..writeByte(4)
      ..write(obj.busCardId)
      ..writeByte(5)
      ..write(obj.profilePicLink)
      ..writeByte(6)
      ..write(obj.role)
      ..writeByte(7)
      ..write(obj.busCardStatus);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StudentModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
