import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/screens/common/splash/splash.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: SplashScreen(),
      ),
    );
  }
}
