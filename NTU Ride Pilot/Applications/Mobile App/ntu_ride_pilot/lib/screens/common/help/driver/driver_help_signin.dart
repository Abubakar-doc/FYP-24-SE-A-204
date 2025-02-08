import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/screens/common/help/widget/help_widget.dart';

class DriverSignInHelpScreen extends StatelessWidget {
  const DriverSignInHelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return HelpScreen(
      appBarTitle: 'Need Help?',
      faqs: [
        {
          "title": "How do I sign in as a driver?",
          "text": "Driver will need to visit the transport office to collect their account credentials for the NTU Ride Pilot app. Ensure you obtain them in person to access your account. For further assistance, please communicate directly with the transport department."
        },
        {
          "title": "I am not affiliated with NTU, how can I sign in?",
          "text": "The NTU Ride Pilot app is exclusively for NTU students and bus staff. If you are not affiliated with NTU, you will not be able to access the app under any circumstances."
        }
      ],
    );
  }
}

