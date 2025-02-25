import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ntu_ride_pilot/controllers/ride_control_controller.dart';
import 'package:ntu_ride_pilot/services/driver/ride_service.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:skeletonizer/skeletonizer.dart';

class BusCardVerificationWidget extends StatefulWidget {
  final RideControlController controller;
  final RideService rideService;

  const BusCardVerificationWidget({
    super.key,
    required this.controller,
    required this.rideService,
  });

  @override
  State<BusCardVerificationWidget> createState() =>
      _BusCardVerificationWidgetState();
}

class _BusCardVerificationWidgetState extends State<BusCardVerificationWidget> {
  // Local state for card input
  String _currentInput = "";
  String _cardStatus = "Tap bus card on RFID reader...";
  final FocusNode _focusNode = FocusNode();
  bool _isLoading = false;
  Timer? _resetTimer;

  @override
  void initState() {
    super.initState();
    // Request focus so scanning can begin immediately
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _focusNode.dispose();
    _resetTimer?.cancel();
    super.dispose();
  }

  // Handling the scanned input
  void _handleCardInput(String input) async {
    setState(() {
      _isLoading = true;
      _cardStatus = "Processing...";
    });

    // Retrieve response from the RideService
    final response = await widget.rideService.handleCardInput(input);

    // Decide how to display the result
    String message;
    String cardImage;
    switch (response.statusCode) {
      case RideService.CARD_NOT_FOUND:
        message =
        "Unverified: No record found for ${response.rollNo} (${response.studentName}).";
        cardImage = widget.controller.redCard;
        break;
      case RideService.CARD_INACTIVE:
        message =
        "Unverified: Inactive card for ${response.rollNo} (${response.studentName}).";
        cardImage = widget.controller.redCard;
        break;
      case RideService.STUDENT_ALREADY_ONBOARD:
        message = "Unverified:\n"
            "${response.rollNo} (${response.studentName})\n"
            "Already onboard on Bus ${response.busNumber}.";
        cardImage = widget.controller.redCard;
        break;
      case RideService.CARD_VERIFIED:
        message = "Verified:\n${response.rollNo}\n(${response.studentName})";
        cardImage = widget.controller.greenCard;
        break;
      default:
        message = "Unverified: An unknown error occurred.";
        cardImage = widget.controller.redCard;
    }

    setState(() {
      _isLoading = false;
      _cardStatus = message;
      widget.controller.setCardImage(cardImage);
    });

    // Reset UI after a brief delay
    _resetTimer?.cancel();
    _resetTimer = Timer(const Duration(seconds: 10), () {
      if (!mounted) return;
      setState(() {
        _cardStatus = "Tap bus card on RFID reader...";
        widget.controller.resetCardImage(Theme.of(context).brightness);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RawKeyboardListener(
      focusNode: _focusNode,
      onKey: (RawKeyEvent event) {
        if (event is RawKeyDownEvent) {
          // If the user presses Enter, process the collected input
          if (event.logicalKey == LogicalKeyboardKey.enter) {
            _handleCardInput(_currentInput);
            _currentInput = "";
          } else {
            // Otherwise, append any typed character
            _currentInput += event.character ?? "";
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.all(24.0),
        decoration: BoxDecoration(
          color: theme.brightness == Brightness.dark
              ? DarkInputFieldFillColor
              : LightInputFieldFillColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Skeletonizer(
          enabled: _isLoading,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                widget.controller.getImage(theme.brightness),
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
    );
  }
}
