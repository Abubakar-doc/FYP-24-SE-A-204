import 'package:flutter/material.dart';
import 'package:get/get.dart';

class DriverHomeScreen extends StatelessWidget {
  DriverHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(
          title: const Text("Driver Home"),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(height: 20),
              // A simple text field for input
              TextFormField(
                decoration: InputDecoration(
                  labelText: "Name", // Hint text that moves up when focused
                ),
              ),
              SizedBox(height: 20),
            ],
          ),
        ),
      );
  }
}
