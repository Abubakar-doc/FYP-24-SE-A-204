import 'package:flutter/material.dart';
import 'package:rtbivt/screens/driver/driver_home/driver_home_screen.dart';

class HomeScreen extends StatelessWidget {
  HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: DriverHomeScreen(),
      ),
    );
  }
}
