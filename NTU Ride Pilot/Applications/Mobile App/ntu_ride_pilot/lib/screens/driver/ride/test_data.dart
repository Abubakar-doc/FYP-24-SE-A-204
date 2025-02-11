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

  final Map<String, String> customBusCardIds = {
    "00-NTU-CS-0391": "0007001586",
    "00-NTU-CS-0392": "0008052075",
    "00-NTU-CS-0393": "0008169852",
    "00-NTU-CS-0394": "0006952419",
    "00-NTU-CS-0395": "0007019225",
  };

  String generateBusCardId() {
    return (Random().nextInt(900000000) + 1000000000).toString();
  }

  void addTestData() async {
    setState(() {
      _isLoading = true;
      _progress = 0.0;
    });

    // Predefined names
    final List<String> predefinedNames = [
      "Alice Johnson",
      "Bob Smith",
      "Charlie Brown",
      "Diana Miller",
      "Ethan Williams"
    ];

    for (int i = 0; i < 400; i++) {
      String rollNo = '00-NTU-CS-${i.toString().padLeft(4, '0')}';
      String name = i < predefinedNames.length ? predefinedNames[i] : 'Student $i';
      String email = 'student$i@example.com';
      bool feePaid = Random().nextBool();
      String busCardId = customBusCardIds[rollNo] ?? generateBusCardId();
      DateTime createdAt = DateTime.now();
      DateTime updatedAt = DateTime.now();

      // Add student to Firestore
      await _firestore
          .collection('users')
          .doc('user_roles')
          .collection('students')
          .doc(email)
          .set({
        'roll_no': rollNo,
        'name': name,
        'fee_paid': feePaid,
        'bus_card_id': busCardId,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      });

      // Add bus card to Firestore with busCardId as the document ID
      await _firestore.collection('bus_cards').doc(busCardId).set({
        'roll_no': rollNo,
        'name': name,
        'isActive': true,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      });

      setState(() {
        _progress = (i + 1) / 400;
      });
    }

    setState(() {
      _isLoading = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('400 Students & Bus Cards Added Successfully!')),
    );
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Manage Test Data')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_isLoading)
              Column(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 20),
                  LinearProgressIndicator(value: _progress),
                  SizedBox(height: 10),
                  Text('${(_progress * 100).toStringAsFixed(0)}% Completed'),
                ],
              )
            else
              ElevatedButton(
                onPressed: addTestData,
                child: Text('Add 400 Students & Bus Cards'),
              ),
          ],
        ),
      ),
    );
  }
}
