import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtbivt/screens/common/welcome/welcome.dart';

class SplashScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Use GetX to navigate after a delay
    Future.delayed(Duration(seconds: 2), () {
      // Navigate to the WelcomeScreen using GetX navigation
      Get.off(() => WelcomeScreen());
    });

    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center, // Center the image vertically
        crossAxisAlignment: CrossAxisAlignment.center, // Center align horizontally
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
    );
  }
}
