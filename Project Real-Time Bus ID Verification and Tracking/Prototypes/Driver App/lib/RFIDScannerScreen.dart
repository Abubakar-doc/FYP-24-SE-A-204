import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/services.dart';
import 'dart:async'; // To use Stopwatch

class RFIDScannerScreen extends StatefulWidget {
  @override
  _RFIDScannerScreenState createState() => _RFIDScannerScreenState();
}

class _RFIDScannerScreenState extends State<RFIDScannerScreen> {
  final List<String> _scannedRFIDs = []; // List to store RFID tags.
  String _currentInput = ""; // Temporary storage for current tag input.
  final FocusNode _focusNode =
      FocusNode(); // FocusNode for the RawKeyboardListener.
  bool _isListVisible = false; // Controls the visibility of the list.
  bool _isLoading = false; // Controls the loading indicator.
  String _validationMessage = ''; // Message for the validation result.

  // To track the total time taken for operations and average time
  double _totalTimeInSeconds = 0.0;
  int _operationCount = 0;
  double _averageTimeInSeconds = 0.0;

  // Track time for valid and invalid card processing separately
  double _validCardTimeInSeconds = 0.0;
  int _validCardCount = 0;
  double _invalidCardTimeInSeconds = 0.0;
  int _invalidCardCount = 0;

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus(); // Ensure the FocusNode is always active.
  }

  // Method to clear the RFID list
  void _clearRFIDs() {
    setState(() {
      _scannedRFIDs.clear(); // Clear the scanned RFID list
    });
  }

  // Method to add RFID
  void _addRFID(String rfid) {
    setState(() {
      _scannedRFIDs.add(rfid); // Add RFID to the list
      _validationMessage = ''; // Reset previous validation message
    });
    _checkRFIDValidity(rfid); // Check the validity of the scanned RFID.
  }

  // Method to check RFID validity by querying Firestore
  // Future<void> _checkRFIDValidity(String rfid) async {
  //   final stopwatch = Stopwatch()..start(); // Start the stopwatch
  //
  //   setState(() {
  //     _isLoading = true; // Show loading indicator
  //   });
  //
  //   try {
  //     // Firestore reference to the 'student' collection
  //     final students = FirebaseFirestore.instance.collection('student');
  //
  //     // Get the document by UID
  //     DocumentSnapshot snapshot = await students.doc(rfid).get();
  //
  //     // Check if the document exists
  //     if (snapshot.exists) {
  //       var data = snapshot.data() as Map<String, dynamic>;
  //       bool feePay = data['feepay'] ?? false;
  //       Timestamp? lastRide = data['lastride'];
  //
  //       // Check if fee is paid and timestamp is within the last 2 hours
  //       if (feePay && lastRide != null) {
  //         DateTime now = DateTime.now();
  //         DateTime timestamp = lastRide.toDate();
  //         Duration difference = now.difference(timestamp);
  //
  //         if (difference.inHours <= 2) {
  //           setState(() {
  //             _validationMessage = 'Card is valid!';
  //           });
  //           // Update valid card processing time
  //           _validCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
  //           _validCardCount++;
  //         } else {
  //           setState(() {
  //             _validationMessage =
  //                 'Card is invalid (Timestamp exceeds 2 hours).';
  //           });
  //           // Update invalid card processing time
  //           _invalidCardTimeInSeconds +=
  //               stopwatch.elapsed.inMilliseconds / 1000;
  //           _invalidCardCount++;
  //         }
  //       } else {
  //         setState(() {
  //           _validationMessage = feePay
  //               ? 'Card is invalid (Fee not paid).'
  //               : 'Card is invalid (No last ride timestamp).';
  //         });
  //         // Update invalid card processing time
  //         _invalidCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
  //         _invalidCardCount++;
  //       }
  //     } else {
  //       setState(() {
  //         _validationMessage = 'Card not found in the database.';
  //       });
  //       // Update invalid card processing time
  //       _invalidCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
  //       _invalidCardCount++;
  //     }
  //   } catch (e) {
  //     setState(() {
  //       _validationMessage = 'Error checking RFID: $e';
  //     });
  //     // Update invalid card processing time
  //     _invalidCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
  //     _invalidCardCount++;
  //   } finally {
  //     stopwatch.stop(); // Stop the stopwatch
  //
  //     // Update the total time and average time in seconds
  //     setState(() {
  //       _isLoading = false; // Hide loading indicator
  //       _totalTimeInSeconds +=
  //           stopwatch.elapsed.inMilliseconds / 1000; // Convert to seconds
  //       _operationCount++;
  //       _averageTimeInSeconds = _totalTimeInSeconds /
  //           _operationCount; // Update the average time in seconds
  //     });
  //   }
  // }


  Future<void> _checkRFIDValidity(String rfid) async {
    final stopwatch = Stopwatch()..start(); // Start the stopwatch

    setState(() {
      _isLoading = true; // Show loading indicator
    });

    try {
      // Firestore reference to the 'student' collection
      final students = FirebaseFirestore.instance.collection('student');

      // Get the document by UID
      DocumentSnapshot snapshot = await students.doc(rfid).get();

      // Check if the document exists
      if (snapshot.exists) {
        var data = snapshot.data() as Map<String, dynamic>;
        bool feePay = data['feepay'] ?? false;
        Timestamp? lastRide = data['lastride'];

        DateTime now = DateTime.now();

        // Check fee payment status and lastride timestamp
        if (feePay && lastRide != null) {
          DateTime lastRideTime = lastRide.toDate();
          Duration difference = now.difference(lastRideTime);

          if (difference.inHours < 2) {
            // Card is invalid because it's used within 2 hours
            setState(() {
              _validationMessage = 'Card is invalid (Already scanned within 2 hours).';
            });

            // Update invalid card processing time
            _invalidCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
            _invalidCardCount++;
          } else {
            // Card is valid and timestamp exceeds 2 hours
            setState(() {
              _validationMessage = 'Card is valid!';
            });

            // Update the lastRide timestamp
            await _updateLastRideTimestamp(rfid);

            // Update valid card processing time
            _validCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
            _validCardCount++;
          }
        } else {
          // Invalid card: fee not paid or no timestamp
          setState(() {
            _validationMessage = feePay
                ? 'Card is invalid (No last ride timestamp).'
                : 'Card is invalid (Fee not paid).';
          });

          // Update invalid card processing time
          _invalidCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
          _invalidCardCount++;
        }
      } else {
        // Card not found in the database
        setState(() {
          _validationMessage = 'Card not found in the database.';
        });

        // Update invalid card processing time
        _invalidCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
        _invalidCardCount++;
      }
    } catch (e) {
      // Handle any exceptions during validation
      setState(() {
        _validationMessage = 'Error checking RFID: $e';
      });

      // Update invalid card processing time
      _invalidCardTimeInSeconds += stopwatch.elapsed.inMilliseconds / 1000;
      _invalidCardCount++;
    } finally {
      stopwatch.stop(); // Stop the stopwatch

      // Update the total time and average time in seconds
      setState(() {
        _isLoading = false; // Hide loading indicator
        _totalTimeInSeconds +=
            stopwatch.elapsed.inMilliseconds / 1000; // Convert to seconds
        _operationCount++;
        _averageTimeInSeconds = _totalTimeInSeconds /
            _operationCount; // Update the average time in seconds
      });
    }
  }

// Method to update the lastRide timestamp in Firestore
  Future<void> _updateLastRideTimestamp(String rfid) async {
    try {
      final students = FirebaseFirestore.instance.collection('student');
      await students.doc(rfid).update({'lastride': Timestamp.now()});
    } catch (e) {
      setState(() {
        _validationMessage = 'Error updating timestamp: $e';
      });
    }
  }



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RFID Scanner'),
        centerTitle: true,
        actions: [
          TextButton(onPressed: _clearRFIDs, child: const Text('Clear List'))
        ],
      ),
      body: RawKeyboardListener(
        focusNode: _focusNode,
        onKey: (RawKeyEvent event) {
          // Handle key press events.
          if (event.runtimeType == RawKeyDownEvent) {
            if (event.logicalKey == LogicalKeyboardKey.enter) {
              // Add the current input to the list when "Enter" is pressed.
              _addRFID(_currentInput);
              _currentInput = ""; // Reset the input string.
            } else {
              // Append characters to the current input.
              _currentInput += event.character ?? "";
            }
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              // Display number of scanned IDs
              Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Align(
                  alignment:
                      Alignment.center, // Aligning the Column to the right
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment
                        .end, // Ensures all texts are right-aligned
                    children: [
                      Text(
                        'Number of IDs scanned: ${_scannedRFIDs.length}',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
              // Toggle button for list visibility
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _isListVisible = !_isListVisible; // Toggle visibility
                  });
                },
                child: Text(_isListVisible ? 'Collapse List' : 'Expand List'),
              ),
              // Collapsible ListView
              Visibility(
                visible: _isListVisible,
                child: Expanded(
                  child: ListView.builder(
                    itemCount: _scannedRFIDs.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text('${index + 1}: ${_scannedRFIDs[index]}'),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),
              // Show loading indicator and validation result
              _isLoading
                  ? const CircularProgressIndicator()
                  : Text(
                      _validationMessage,
                      style: TextStyle(
                        fontSize: 18,
                        color: _validationMessage.startsWith('Card is valid')
                            ? Colors.green
                            : Colors.red,
                      ),
                    ),
              const SizedBox(height: 20),
              Text(
                'Average time taken for all operations: ${_averageTimeInSeconds.toStringAsFixed(2)} seconds',
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 20),
              // Display valid/invalid card average processing time
              Text(
                'Average time for valid cards: ${_validCardCount > 0 ? (_validCardTimeInSeconds / _validCardCount).toStringAsFixed(2) : 0} seconds',
                style: const TextStyle(fontSize: 16),
              ),
              Text(
                'Average time for invalid cards: ${_invalidCardCount > 0 ? (_invalidCardTimeInSeconds / _invalidCardCount).toStringAsFixed(2) : 0} seconds',
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
