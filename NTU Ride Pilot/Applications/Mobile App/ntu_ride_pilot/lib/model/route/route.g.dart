// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'route.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class RouteModelAdapter extends TypeAdapter<RouteModel> {
  @override
  final int typeId = 6;

  @override
  RouteModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return RouteModel(
      routeId: fields[0] as String,
      name: fields[1] as String,
      busStopId: (fields[2] as Map).cast<String, String>(),
    );
  }

  @override
  void write(BinaryWriter writer, RouteModel obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.routeId)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.busStopId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RouteModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
