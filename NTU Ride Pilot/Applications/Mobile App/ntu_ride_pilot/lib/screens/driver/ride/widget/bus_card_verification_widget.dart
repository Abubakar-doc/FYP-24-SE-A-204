import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:ntu_ride_pilot/controllers/ride_control_controller.dart';
import 'package:ntu_ride_pilot/services/ride/ride_service.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';

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
  String _currentInput = "";
  String _cardStatus = "Tap bus card on RFID reader...";
  final FocusNode _focusNode = FocusNode();
  bool _isLoading = false;
  Timer? _resetTimer;
  final AudioPlayer _audioPlayer = AudioPlayer();
  Color _containerColor = Colors.transparent; // Default color
  bool _isSuccess = false; // Flag to differentiate animations
  bool _animate = false; // To trigger animation on scan

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
  }

  Future<void> playSound(String soundFile) async {
    try {
      await _audioPlayer.play(AssetSource('sounds/$soundFile'));
    } catch (e) {
      // print("Error playing sound: $e");
    }
  }

  @override
  void dispose() {
    _focusNode.dispose();
    _resetTimer?.cancel();
    _audioPlayer.dispose();
    super.dispose();
  }

  void _handleCardInput(String input) async {
    setState(() {
      _isLoading = true;
      _cardStatus = "Processing...";
      _animate = false; // **Force reset animation before applying a new one**
    });

    final response = await widget.rideService.handleCardInput(input);

    String message;
    String soundFile;
    Color backgroundColor;
    bool isSuccess = false;

    switch (response.statusCode) {
      case RideService.CARD_VERIFIED:
        message =
            "Verified: ${response.rollNo}\n${response.studentName} can board.";
        soundFile = 'accept.mp3';
        backgroundColor = Colors.green;
        isSuccess = true; // ✅ Success flag
        break;

      case RideService.CARD_INACTIVE:
        message =
            "Not Verified: ${response.rollNo}\n${response.studentName} can not board.";
        soundFile = 'reject.mp3';
        backgroundColor = Colors.red;
        isSuccess = false; // ❌ Rejection flag
        break;

      case RideService.CARD_NOT_FOUND:
        message =
            "Not Verified: ${response.rollNo}\n${response.studentName} can not board.";
        soundFile = 'reject.mp3';
        backgroundColor = Colors.red;
        isSuccess = false; // ❌ Rejection flag
        break;

      case RideService.STUDENT_ALREADY_ONBOARD:
        message =
            "Not Verified: ${response.rollNo}\n${response.studentName} is already onboard ${response.busNumber}.";
        soundFile = 'reject.mp3';
        backgroundColor = Colors.red;
        isSuccess = false; // ❌ Rejection flag
        break;

      default:
        message = "Not Verified: Cannot board.";
        soundFile = 'reject.mp3';
        backgroundColor = Colors.red;
        isSuccess = false;
    }

    setState(() {
      _isLoading = false;
      _cardStatus = message;
      _containerColor = backgroundColor;
      _isSuccess = isSuccess;
      widget.controller.setCardImage(widget.controller.darkThemeCard);
    });

    await playSound(soundFile);

    // **Ensure animations always re-trigger**
    Future.delayed(Duration.zero, () {
      setState(() {
        _animate = true;
      });
    });

    _resetTimer?.cancel();
    _resetTimer = Timer(const Duration(seconds: 05), () {
      if (!mounted) return;
      setState(() {
        _cardStatus = "Tap bus card on RFID reader...";
        _containerColor = Colors.transparent; // Reset to default color
        _animate = false; // Reset animation
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
          if (event.logicalKey == LogicalKeyboardKey.enter) {
            _handleCardInput(_currentInput);
            _currentInput = "";
          } else {
            _currentInput += event.character ?? "";
          }
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300), // Smooth color transition
        padding: const EdgeInsets.all(24.0),
        decoration: BoxDecoration(
          color: (_isLoading || _containerColor == Colors.transparent)
              ? (theme.brightness == Brightness.dark
                  ? DarkInputFieldFillColor
                  : LightInputFieldFillColor)
              : _containerColor, // Change color dynamically
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // ✅ Image animation based on success or rejection
            Image.asset(
              widget.controller.getImage(theme.brightness),
              height: 100,
            )
                .animate(target: _animate ? 1 : 0)
                .then(delay: 100.ms)
                .scaleXY(
                    begin: 1,
                    end: _isSuccess ? 1.2 : 1,
                    duration: 300.ms) // ✅ Pop for success
                .shake(
                    duration: _isSuccess ? 0.ms : 600.ms,
                    hz: 4), // ❌ Wobble for rejection

            const SizedBox(height: 16),

            // ✅ Text animation based on success or rejection
            Text(
              _isLoading ? 'Processing card, please wait...' : _cardStatus,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: (_containerColor == Colors.green ||
                        _containerColor == Colors.red)
                    ? Colors.white // ✅ White text for red/green backgrounds
                    : Theme.of(context)
                        .textTheme
                        .bodyLarge!
                        .color, // ✅ Default theme color otherwise
              ),
              textAlign: TextAlign.center,
            )
                .animate(target: _animate ? 1 : 0)
                .moveY(
                    begin: 0,
                    end: _isSuccess ? -10 : 0,
                    duration: 300.ms) // ✅ Bounce for success
                .then(delay: 200.ms)
                .moveY(
                    begin: -10,
                    end: 0,
                    duration: 300.ms) // ✅ Return for success
                .shake(
                    duration: _isSuccess ? 0.ms : 600.ms,
                    hz: 4), // ❌ Wobble for rejection
          ],
        ),
      ),
    );
  }
}
