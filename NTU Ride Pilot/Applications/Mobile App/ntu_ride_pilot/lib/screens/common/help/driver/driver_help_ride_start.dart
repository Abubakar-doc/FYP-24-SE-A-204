import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/screens/common/help/widget/help_widget.dart';

class DriverRideStartHelpScreen extends StatelessWidget {
  const DriverRideStartHelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return HelpScreen(
      appBarTitle: 'Need Help?',
      faqs: [
        {"title": "Question no 1", "text": "Ans no 1"},
        {"title": "Question no 2", "text": "Ans no 2"},
      ],
    );
  }
}
