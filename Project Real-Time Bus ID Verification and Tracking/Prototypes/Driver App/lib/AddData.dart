import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class AddDataScreen extends StatefulWidget {
  const AddDataScreen({Key? key}) : super(key: key);

  @override
  State<AddDataScreen> createState() => _AddDataScreenState();
}

class _AddDataScreenState extends State<AddDataScreen> {
  bool _isLoading = false;
  int _totalStudents = 0;

  final List<String> uids = [
    "0007001586",
    "0008052075",
    "0008169852",
    "0006952419",
    "0007019225",
  ];

  // Function to get total students count
  Future<void> getTotalStudentsCount() async {
    setState(() => _isLoading = true);
    try {
      var snapshot = await students.get();
      setState(() {
        _totalStudents = snapshot.docs.length; // Count the documents in the snapshot
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching student count: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  final CollectionReference students =
  FirebaseFirestore.instance.collection('student');

  Future<void> addDataToFirestore() async {
    setState(() => _isLoading = true);
    try {
      for (String uid in uids) {
        await students.doc(uid).set({
          'uid': uid,
          'lastride': null,
          'feepay': true,
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Data added successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding data: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> addRandomStudentsData() async {
    setState(() => _isLoading = true);
    try {
      Random random = Random();

      for (int i = 0; i < 100; i++) {
        // Generate student ID in the format '000XXXXXXXXX' (10 characters long)
        String uid = '000${random.nextInt(9000000) + 1000000}';  // 7-digit number after the '000'

        bool feepay = random.nextBool();
        DateTime timestamp = DateTime.now().subtract(
          Duration(days: random.nextInt(365) + 1), // Random date in the last year
        );

        await students.doc(uid).set({
          'uid': uid,
          'feepay': feepay,
          'lastride': timestamp,
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('100 Random students added successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding random students data: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }


  Future<void> randomizeFeePayFlags() async {
    setState(() => _isLoading = true);
    try {
      for (String uid in uids) {
        await students.doc(uid).update({
          'feepay': Random().nextBool(), // Randomize feepay flag
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('FeePay flags updated successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating FeePay flags: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> randomizeTimeStamps() async {
    setState(() => _isLoading = true);
    try {
      final now = DateTime.now();
      final List<DateTime> timestamps = [
        now.subtract(const Duration(hours: 1)),
        now.subtract(const Duration(hours: 1, minutes: 30)),
        now.subtract(Duration(days: Random().nextInt(30) + 1)), // Random date in the last month
        now.subtract(Duration(days: Random().nextInt(30) + 1)),
        now.subtract(Duration(days: Random().nextInt(30) + 1)),
      ];

      for (int i = 0; i < uids.length; i++) {
        await students.doc(uids[i]).update({
          'lastride': timestamps[i], // Assign the randomized timestamp
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Timestamps updated successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating timestamps: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> setAllFeePayTrue() async {
    setState(() => _isLoading = true);
    try {
      // Update all documents to set 'feepay' to true
      for (String uid in uids) {
        await students.doc(uid).update({
          'feepay': true,
        });
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All FeePay flags set to true!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error setting FeePay to true: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> deleteAllDocuments() async {
    setState(() => _isLoading = true);
    try {
      // Delete all documents in the 'student' collection
      var snapshot = await students.get();
      for (var doc in snapshot.docs) {
        await doc.reference.delete();
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All documents deleted!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error deleting documents: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Data Screen'),
      ),
      body: Center(
        child: _isLoading
            ? const CircularProgressIndicator()
            : Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 20),
            // Display the total student count
            Text(
              'Total Students in firebase: $_totalStudents',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: getTotalStudentsCount, // Button to fetch student count
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                backgroundColor: Colors.blueAccent,
              ),
              child: const Text(
                'Get Total Students Count',
                style: TextStyle(fontSize: 18, color: Colors.white),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: addDataToFirestore,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                backgroundColor: Colors.blue,
              ),
              child: const Text(
                'Add Data',
                style: TextStyle(fontSize: 18, color: Colors.white),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: randomizeFeePayFlags,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                backgroundColor: Colors.green,
              ),
              child: const Text(
                'Randomize FeePay Flags',
                style: TextStyle(fontSize: 18, color: Colors.white),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: randomizeTimeStamps,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                backgroundColor: Colors.orange,
              ),
              child: const Text(
                'Randomize TimeStamps',
                style: TextStyle(fontSize: 18, color: Colors.white),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: setAllFeePayTrue,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                backgroundColor: Colors.purple,
              ),
              child: const Text(
                'Set All FeePay to True',
                style: TextStyle(fontSize: 18, color: Colors.white),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: addRandomStudentsData,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                backgroundColor: Colors.green,
              ),
              child: const Text(
                'Add 100 Random Students',
                style: TextStyle(fontSize: 18, color: Colors.white),
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: deleteAllDocuments,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                backgroundColor: Colors.red,
              ),
              child: const Text(
                'Delete All Documents',
                style: TextStyle(fontSize: 18, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
