import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/screens/common/help/widget/help_widget.dart';

class SignInHelpScreen extends StatelessWidget {
  const SignInHelpScreen({Key? key}) : super(key: key);

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
          "title": "How do bus staff sign in?",
          "text": "Bus staff will need to visit the transport office to collect their account credentials for the NTU Ride Pilot app. Ensure you obtain them in person to access your account. For further assistance, please communicate directly with the transport department."
        },
        {
          "title": "I am not affiliated with NTU, how can I sign in?",
          "text": "The NTU Ride Pilot app is exclusively for NTU students and bus staff. If you are not affiliated with NTU, you will not be able to access the app under any circumstances."
        }
      ],
    );
  }
}

