// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bus.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class BusModelAdapter extends TypeAdapter<BusModel> {
  @override
  final int typeId = 5;

  @override
  BusModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return BusModel(
      busId: fields[0] as String,
    );
  }

  @override
  void write(BinaryWriter writer, BusModel obj) {
    writer
      ..writeByte(1)
      ..writeByte(0)
      ..write(obj.busId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BusModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
