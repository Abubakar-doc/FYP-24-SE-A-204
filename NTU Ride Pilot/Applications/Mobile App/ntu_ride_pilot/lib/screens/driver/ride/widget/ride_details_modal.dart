import 'package:flutter/material.dart';
import 'package:hive_flutter/adapters.dart';
import 'package:intl/intl.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/stat_row/stat_row.dart';
import 'package:ntu_ride_pilot/widget/passenger_card/passenger_card.dart';
import 'package:collection/collection.dart';

class RideDetailsModal extends StatelessWidget {
  final Box<RideModel> rideBox;
  final Box<BusCardModel> busCardBox;

  const RideDetailsModal({
    super.key,
    required this.rideBox,
    required this.busCardBox,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DraggableScrollableSheet(
      initialChildSize: 0.66,
      minChildSize: 0.3,
      maxChildSize: 0.95,
      expand: false,
      snap: true,
      builder: (context, scrollController) {
        return ValueListenableBuilder<Box<RideModel>>(
          // Listen to changes on 'currentRide'
          valueListenable: rideBox.listenable(keys: ['currentRide']),
          builder: (context, box, _) {
            final ride = box.get('currentRide');
            final isDark = Theme.of(context).brightness == Brightness.dark;

            // If there's no ride yet, show a placeholder
            if (ride == null) {
              return Center(child: Text("No active ride"));
            }

            // Format started-at time
            final startedAt = DateFormat('h:mm a').format(ride.createdAt);

            // Build passenger list from roll numbers
            final rolls = [...ride.onlineOnBoard, ...ride.offlineOnBoard];
            final passengers = rolls.map((roll) {
              final card =
                  busCardBox.values.firstWhereOrNull((c) => c.rollNo == roll);
              return {
                'name': card?.name ?? 'Unknown',
                'id': roll,
              };
            }).toList();

            return Container(
              padding: EdgeInsets.all(16),
              child: ListView(
                controller: scrollController,
                children: [
                  // DRAG HANDLE
                  Center(
                    child: Container(
                      margin: EdgeInsets.only(bottom: 12),
                      height: 4,
                      width: 80,
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.grey.shade700
                            : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  // GENERAL INFO
                  Text(
                    'General Information',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 10),
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.brightness == Brightness.dark
                          ? DarkInputFieldFillColor
                          : LightInputFieldFillColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      children: [
                        StatRow(
                          title: "Ride Started at",
                          value: startedAt,
                          isDarkMode: isDark,
                        ),
                        Divider(
                            color: isDark
                                ? Colors.grey.shade700
                                : Colors.grey.shade400),
                        StatRow(
                          title: "Bus Capacity",
                          value: ride.seatCapacity != null
                              ? "${ride.seatCapacity} seats"
                              : 'N/A',
                          isDarkMode: isDark,
                        ),
                        Divider(
                            color: isDark
                                ? Colors.grey.shade700
                                : Colors.grey.shade400),
                        StatRow(
                          title: "Passengers Onboard",
                          value: '${rolls.length}',
                          isDarkMode: isDark,
                        ),
                      ],
                    ),
                  ),
                  // PASSENGER LIST
                  SizedBox(height: 20),
                  Text(
                    'Passengers Onboard',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 10),
                  ...passengers.map((p) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: PassengerCard(
                          name: p['name']!,
                          studentId: p['id']!,
                          isDarkMode: isDark,
                          isLoading: false,
                        ),
                      )),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
