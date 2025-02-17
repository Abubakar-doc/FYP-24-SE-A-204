// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ride.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class RideModelAdapter extends TypeAdapter<RideModel> {
  @override
  final int typeId = 4;

  @override
  RideModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return RideModel(
      autoId: fields[0] as String,
      routeId: fields[1] as String,
      rideStatus: fields[2] as String,
      busId: fields[3] as String,
      driverId: fields[4] as String,
      onboard: (fields[5] as Map).cast<String, String>(),
      eta: fields[6] as DateTime,
      speed: fields[7] as double,
      createdAt: fields[8] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, RideModel obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.autoId)
      ..writeByte(1)
      ..write(obj.routeId)
      ..writeByte(2)
      ..write(obj.rideStatus)
      ..writeByte(3)
      ..write(obj.busId)
      ..writeByte(4)
      ..write(obj.driverId)
      ..writeByte(5)
      ..write(obj.onboard)
      ..writeByte(6)
      ..write(obj.eta)
      ..writeByte(7)
      ..write(obj.speed)
      ..writeByte(8)
      ..write(obj.createdAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RideModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
