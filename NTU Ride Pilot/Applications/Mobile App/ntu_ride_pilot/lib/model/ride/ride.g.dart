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
      rideId: fields[0] as String?,
      routeId: fields[1] as String,
      rideStatus: fields[2] as String?,
      busId: fields[3] as String,
      driverId: fields[4] as String,
      onlineOnBoard: (fields[5] as List).cast<String>(),
      offlineOnBoard: (fields[6] as List).cast<String>(),
      etaNextStop: fields[7] as DateTime,
      currentLocation: (fields[10] as Map).cast<String, String>(),
      nextStopName: fields[11] as String?,
      createdAt: fields[8] as DateTime?,
      endedAt: fields[9] as DateTime?,
    );
  }

  @override
  void write(BinaryWriter writer, RideModel obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.rideId)
      ..writeByte(1)
      ..write(obj.routeId)
      ..writeByte(2)
      ..write(obj.rideStatus)
      ..writeByte(3)
      ..write(obj.busId)
      ..writeByte(4)
      ..write(obj.driverId)
      ..writeByte(5)
      ..write(obj.onlineOnBoard)
      ..writeByte(6)
      ..write(obj.offlineOnBoard)
      ..writeByte(7)
      ..write(obj.etaNextStop)
      ..writeByte(8)
      ..write(obj.createdAt)
      ..writeByte(9)
      ..write(obj.endedAt)
      ..writeByte(10)
      ..write(obj.currentLocation)
      ..writeByte(11)
      ..write(obj.nextStopName);
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
