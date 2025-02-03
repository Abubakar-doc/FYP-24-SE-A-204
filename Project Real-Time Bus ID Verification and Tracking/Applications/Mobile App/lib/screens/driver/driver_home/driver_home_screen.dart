import 'package:flutter/material.dart';
import 'package:rtbivt/screens/common/splash/splash.dart';
import 'package:rtbivt/screens/common/welcome/welcome.dart';

class DriverHomeScreen extends StatelessWidget {
  DriverHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: Padding(
      padding: const EdgeInsets.all(10.0),
      child: SafeArea(
          child: WelcomeScreen()
          // child: SplashScreen()
      ),
    ));
  }
}
