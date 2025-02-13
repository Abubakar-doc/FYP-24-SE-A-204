import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/common/help/driver/driver_help_ride_control.dart';
import 'package:ntu_ride_pilot/services/driver/ride_service.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/detail_row/detail_row.dart';
import 'package:ntu_ride_pilot/controllers/ride_control_controller.dart';
import 'package:flutter/services.dart';
import 'package:skeletonizer/skeletonizer.dart';

class RideControlScreen extends StatefulWidget {
  const RideControlScreen({super.key});

  @override
  State<RideControlScreen> createState() => _RideControlScreenState();
}

class _RideControlScreenState extends State<RideControlScreen> {
  final RideControlController controller = Get.put(RideControlController());
  final RideService _rideService = RideService();
  String _currentInput = "";
  String _cardStatus = "Tap bus card on rfid reader...";
  final FocusNode _focusNode = FocusNode();
  bool _isLoading = false; // Track loading state
  Timer? _resetTimer; // Global variable to track the reset timer

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _focusNode.dispose();
    _resetTimer?.cancel(); // Cancel the timer on dispose
    super.dispose();
  }

  void _handleCardInput(String input) async {
    // Start loading
    setState(() {
      _isLoading = true;
      _cardStatus = "Processing...";
    });

    // Get the response from RideService
    RideServiceResponse response = await _rideService.handleCardInput(input);

    // Variables to store status message and card image
    String message;
    String cardImage;

    // Determine message and image based on response status
    switch (response.statusCode) {
      case RideService.CARD_NOT_FOUND:
        message = "Unverified: No record found for ${response.rollNo} (${response.studentName}).";
        cardImage = controller.redCard;
        break;

      case RideService.CARD_INACTIVE:
        message = "Unverified: Inactive card for ${response.rollNo} (${response.studentName}).";
        cardImage = controller.redCard;
        break;

      case RideService.STUDENT_ALREADY_ONBOARD:
        message = "Unverified:\n"
            "${response.rollNo} (${response.studentName})\n"
            "Already onboard on Bus ${response.busNumber}.";
        cardImage = controller.redCard;
        break;

      case RideService.CARD_VERIFIED:
        message = "Verified:\n${response.rollNo}\n(${response.studentName})";
        cardImage = controller.greenCard;
        break;

      default:
        message = "Unverified: An unknown error occurred.";
        cardImage = controller.redCard;
    }

    // Update the UI with the new scan result
    setState(() {
      _isLoading = false; // Stop loading
      _cardStatus = message;
      controller.setCardImage(cardImage);
    });

    // Cancel any existing reset timer
    _resetTimer?.cancel();

    // Start a new reset timer
    _resetTimer = Timer(const Duration(seconds: 10), () {
      if (!mounted) return;

      setState(() {
        _cardStatus = "Tap bus card on RFID reader...";
        controller.resetCardImage(Theme.of(context).brightness);
      });
    });
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
                _handleCardInput(_currentInput);
                _currentInput = "";
              } else {
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
                      child: Skeletonizer(
                        enabled: _isLoading, // Enable skeletonizer when loading
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Image.asset(
                              controller.getImage(theme.brightness),
                              height: 100,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _cardStatus,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
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
                      child: const Text('Start Ride'),
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

