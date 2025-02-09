import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/common/help/driver/driver_help_ride_control.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/detail_row/detail_row.dart';
import 'package:ntu_ride_pilot/controllers/ride_control_controller.dart';
import 'package:flutter/services.dart';

class RideControlScreen extends StatefulWidget {
  RideControlScreen({super.key});

  @override
  State<RideControlScreen> createState() => _RideControlScreenState();
}

class _RideControlScreenState extends State<RideControlScreen> {
  final RideControlController controller = Get.put(RideControlController());
  String _currentInput = ""; // Stores RFID input
  String _cardStatus = "Waiting for card input..."; // Displays card status
  final FocusNode _focusNode = FocusNode(); // Focus for RFID scanner

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  void _handleCardInput(String input) {
    setState(() {
      _cardStatus = "Card ID: $input"; // Update card status with input
    });
    // Add logic here to validate the RFID card or perform any operation
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Bus 101 - Route 101'),
            IconButton(
              icon: const Icon(Icons.help_outline),
              onPressed: () {
                Get.to(DriverRideControlHelpScreen());
              },
            ),
          ],
        ),
        centerTitle: false,
      ),
      body: SafeArea(
        child: RawKeyboardListener(
          focusNode: _focusNode,
          onKey: (RawKeyEvent event) {
            if (event is RawKeyDownEvent) {
              if (event.logicalKey == LogicalKeyboardKey.enter) {
                // Handle Enter key as input completion
                _handleCardInput(_currentInput);
                _currentInput = "";
              } else {
                // Append character to current input
                _currentInput += event.character ?? "";
              }
            }
          },
          child: LayoutBuilder(
            builder: (context, constraints) {
              double screenHeight = constraints.maxHeight;

              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Bus Card Verification',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      height: screenHeight * 0.4,
                      width: double.infinity,
                      padding: const EdgeInsets.all(24.0),
                      decoration: BoxDecoration(
                        color: theme.brightness == Brightness.dark
                            ? DarkInputFieldFillColor
                            : LightInputFieldFillColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.asset(
                            controller.getImage(theme.brightness),
                            height: 100, // Adjust height to fit well
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _cardStatus, // Display current card status
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Ride Details',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            // Handle show more
                          },
                          child: const Text(
                            'show more',
                            style: TextStyle(
                              color: Colors.blue,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16.0),
                      decoration: BoxDecoration(
                        color: theme.brightness == Brightness.dark
                            ? DarkInputFieldFillColor
                            : LightInputFieldFillColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          DetailRow(title: 'Ride Status', value: 'Not Started'),
                          Divider(color: Colors.grey),
                          DetailRow(title: 'Next Stop', value: 'Central Park'),
                          Divider(color: Colors.grey),
                          DetailRow(title: 'ETA', value: '9:20 AM'),
                        ],
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {
                        // Handle Start Ride
                      },
                      child: const Text(
                        'Start Ride',
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
