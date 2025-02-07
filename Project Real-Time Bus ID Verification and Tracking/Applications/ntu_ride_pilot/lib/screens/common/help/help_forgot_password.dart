import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/screens/common/help/widget/help_widget.dart';

class ForgotPasswordHelpScreen extends StatelessWidget {
  const ForgotPasswordHelpScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return HelpScreen(
      appBarTitle: 'Need Help?',
      faqs: [
        {
          "title": "How can I reset my password as a student?",
          "text": "To reset your password, please submit the Forgot Password form. An email will be sent to your registered address with instructions to create a new password. If you encounter any issues, reach out to the transport department for assistance."
        },
        {
          "title": "How can I reset my password as bus staff?",
          "text": "Bus staff can reset their password by visiting the transport office. The staff will assist you in recovering or resetting your account credentials for the NTU Ride Pilot app."
        }
      ],
    );
  }
}