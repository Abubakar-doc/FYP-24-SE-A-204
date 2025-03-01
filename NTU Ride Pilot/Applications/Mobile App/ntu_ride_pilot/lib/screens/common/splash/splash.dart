import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/services/common/common_auth.dart';

class SplashScreen extends StatelessWidget {
  final AuthService _authService = AuthService();

  SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    Future.delayed(Duration(seconds: 1), () async {
      await _authService.isSignedIn();
    });

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Logo image in the center
              Expanded(
                child: Center(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white, // Background color
                      borderRadius: BorderRadius.circular(10), // Rounded corners
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10), // Apply to image as well
                      child: Image.asset(
                        'assets/pictures/National_Textile_University_Logo.png', // Path to your logo
                        width: 150, // Adjust the width as needed
                      ),
                    ),
                  ),
                ),
              ),

              // Text at the bottom of the screen
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  'NTU RIDE PILOT',
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontFamily: 'OpenSans',
                      fontSize: 22
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
