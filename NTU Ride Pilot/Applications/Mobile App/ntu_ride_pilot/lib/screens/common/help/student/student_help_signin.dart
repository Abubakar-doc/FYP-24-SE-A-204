import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/screens/common/help/widget/help_widget.dart';

class StudentSignInHelpScreen extends StatelessWidget {
  const StudentSignInHelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return HelpScreen(
      appBarTitle: 'Need Help?',
      faqs: [
        {
          "title": "How to sign in as a student?",
          "text": "If you have clear transport dues, you will receive your account credentials for the NTU Ride Pilot app via email from National Textile University. Be sure to check your inbox or spam folder and use the provided credentials to access your account. In case of any issues with signing in, please contact the transport department for assistance."
        },
        {
          "title": "I am not affiliated with NTU, how can I sign in?",
          "text": "The NTU Ride Pilot app is exclusively for NTU students and bus staff. If you are not affiliated with NTU, you will not be able to access the app under any circumstances."
        }
      ],
    );
  }
}

