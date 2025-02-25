import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
// Import your RideModel class so that Hive recognizes the type.
import 'package:ntu_ride_pilot/model/ride/ride.dart';

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
      const SnackBar(content: Text('400 Students & Bus Cards Added Successfully!')),
    );
  }

  void addTestRoutes() async {
    setState(() {
      _isLoading = true;
      _progress = 0.0;
    });

    try {
      for (int i = 0; i < 3; i++) {
        // Generate a random routeId
        String routeId = "route_${Random().nextInt(100000)}";
        String name = "Test Route ${i + 1}";
        // Generate a busStopId map with 3 stops (sequence keys as strings: "1", "2", "3")
        Map<String, String> busStopId = {};
        for (int j = 1; j <= 3; j++) {
          busStopId[j.toString()] = "BS_${Random().nextInt(1000)}";
        }
        DateTime createdAt = DateTime.now();

        Map<String, dynamic> routeData = {
          'route_id': routeId,
          'name': name,
          'bus_stop_id': busStopId,
          'created_at': createdAt.toIso8601String(),
        };

        await _firestore.collection('routes').doc(routeId).set(routeData);
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('3 Routes Added Successfully!')),
      );
    } catch (e) {
      print(e);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding routes: $e')),
      );
    }

    setState(() {
      _isLoading = false;
      _progress = 1.0;
    });
  }

  /// Clears the `offline_scans` and `rides` boxes in Hive.
  Future<void> _clearHiveBoxes() async {
    setState(() {
      _isLoading = true;
      _progress = 0.0;
    });

    try {
      final offlineBox = await Hive.openBox<Map>('offline_scans');
      final rideBox = await Hive.openBox<RideModel>('rides');

      await offlineBox.clear();
      await rideBox.clear();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Successfully cleared offline_scans & rides!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error clearing boxes: $e')),
      );
    }

    setState(() {
      _isLoading = false;
      _progress = 1.0;
    });
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
              child: const Text('Add 400 Students & Bus Cards'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: addTestRoutes,
              child: const Text('Add 3 Routes'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _clearHiveBoxes,
              child: const Text('Clear offline_scans & rides'),
            ),
          ],
        ),
      ),
    );
  }
}
