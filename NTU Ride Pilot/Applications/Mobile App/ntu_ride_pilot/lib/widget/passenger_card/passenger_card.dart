import 'package:flutter/material.dart';

import 'package:skeletonizer/skeletonizer.dart';

class PassengerCard extends StatelessWidget {
  final String name;
  final String studentId;
  final bool isDarkMode;
  final bool isLoading;

  const PassengerCard({
    super.key,
    required this.name,
    required this.studentId,
    required this.isDarkMode,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Skeletonizer(
      enabled: isLoading,
      child: Container(
        padding: const EdgeInsets.all(10),
        width: double.maxFinite,
        decoration: BoxDecoration(
          color: isDarkMode ? Colors.grey.shade900 : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name, style: TextStyle(fontSize: 18)),
            Text(studentId),
          ],
        ),
      ),
    );
  }
}
