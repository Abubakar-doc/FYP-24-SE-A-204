import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class TestDataScreen extends StatefulWidget {
  const TestDataScreen({super.key});

  @override
  State<TestDataScreen> createState() => _TestDataScreenState();
}

class _TestDataScreenState extends State<TestDataScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  bool _isLoading = false;
  double _progress = 0.0;

  // Predefined bus card IDs for the first 5 students
  final List<String> predefinedBusCardIds = [
    "0007001586", "0008052075", "0008169852", "0006952419", "0007019225"
  ];

  String generateBusCardId() {
    return (Random().nextInt(900000000) + 1000000000).toString();
  }

  void addTestData() async {
    setState(() {
      _isLoading = true;
      _progress = 0.0;
    });

    // Query all students from Firestore
    QuerySnapshot studentsSnapshot = await _firestore
        .collection('users')
        .doc('user_roles')
        .collection('students')
        .limit(5)  // Limiting to first 5 students
        .get();

    for (int i = 0; i < studentsSnapshot.docs.length; i++) {
      var student = studentsSnapshot.docs[i];
      String rollNo = student['roll_no'];
      String name = student['name'];
      bool feePaid = student['fee_paid'];

      // Assign predefined bus card IDs to the first 5 students
      String busCardId = predefinedBusCardIds[i];

      DateTime createdAt = DateTime.now();
      DateTime updatedAt = DateTime.now();

      // Add or update bus card in Firestore with busCardId as document ID
      await _firestore.collection('bus_cards').doc(busCardId).set({
        'roll_no': rollNo,
        'name': name,
        'isActive': true,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      });

      // Update student with the bus card ID
      await _firestore
          .collection('users')
          .doc('user_roles')
          .collection('students')
          .doc(student.id)
          .update({
        'bus_card_id': busCardId,
        'updated_at': updatedAt.toIso8601String(),
      });

      setState(() {
        _progress = (i + 1) / studentsSnapshot.docs.length;
      });
    }

    setState(() {
      _isLoading = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Bus Cards Assigned Successfully!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Test Data'),
      ),
      body: Center(
        child: _isLoading
            ? Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 20),
            LinearProgressIndicator(value: _progress),
            const SizedBox(height: 10),
            Text('${(_progress * 100).toStringAsFixed(0)}% Completed'),
          ],
        )
            : Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: addTestData,
              child: const Text('Assign Bus Cards to First 5 Students'),
            ),
          ],
        ),
      ),
    );
  }
}
