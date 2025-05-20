import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/theme_controller.dart';
import 'package:ntu_ride_pilot/screens/common/help/settings/help_settings.dart';
import 'package:ntu_ride_pilot/services/common/authentication/common_auth.dart';
import 'package:ntu_ride_pilot/widget/alert_dialog/alert_dialog.dart';
import 'package:ntu_ride_pilot/widget/dropdown/driver_ride_dropdown.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Feedback',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
      body: SafeArea(child: Text('Feedback'),),
    );
  }
}
