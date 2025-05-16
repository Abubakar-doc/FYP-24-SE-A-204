import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/services/common/common_auth.dart';

class SplashScreen extends StatelessWidget {
  final AuthService _authService = AuthService();

  SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Future.delayed(Duration(seconds: 1), () async {
      await _authService.isSignedIn(context);
    });

    return Scaffold(
      backgroundColor:
      Theme.of(context).scaffoldBackgroundColor,
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
                  child: theme.brightness == Brightness.dark
                      ? Image.asset(
                    'assets/pictures/logoDark.jpg',
                  )
                      : Image.asset(
                    'assets/pictures/logoLight.jpg',
                    width: 250,
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
