// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bus_card.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class BusCardModelAdapter extends TypeAdapter<BusCardModel> {
  @override
  final int typeId = 3;

  @override
  BusCardModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return BusCardModel(
      busCardId: fields[0] as String,
      rollNo: fields[1] as String,
      isActive: fields[2] as bool,
      name: fields[3] as String,
    );
  }

  @override
  void write(BinaryWriter writer, BusCardModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.busCardId)
      ..writeByte(1)
      ..write(obj.rollNo)
      ..writeByte(2)
      ..write(obj.isActive)
      ..writeByte(3)
      ..write(obj.name);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BusCardModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
