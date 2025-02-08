import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/services.dart';
import 'dart:async';

class RFIDScannerScreen extends StatefulWidget {
  @override
  _RFIDScannerScreenState createState() => _RFIDScannerScreenState();
}

class _RFIDScannerScreenState extends State<RFIDScannerScreen> {
  final List<String> _scannedRFIDs = [];
  final List<Map<String, dynamic>> _timestampQueue = [];
  String _currentInput = "";
  final FocusNode _focusNode = FocusNode();
  bool _isListVisible = false;
  bool _isLoading = false;
  String _validationMessage = '';
  bool _useQueue = false;

  // Stats tracking
  double _totalTimeInSeconds = 0.0;
  int _operationCount = 0;
  double _averageTimeInSeconds = 0.0;

  double _validCardTimeInSeconds = 0.0;
  int _validCardCount = 0;
  double _invalidCardTimeInSeconds = 0.0;
  int _invalidCardCount = 0;

  int _timestampsUploading = 0;

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
    _processQueue();
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  void _clearRFIDs() {
    setState(() => _scannedRFIDs.clear());
  }

  void _addRFID(String rfid) {
    setState(() {
      _scannedRFIDs.add(rfid);
      _validationMessage = '';
    });
    _checkRFIDValidity(rfid);
  }

  Future<void> _checkRFIDValidity(String rfid) async {
    final stopwatch = Stopwatch()..start();
    _updateLoadingState(true);

    try {
      final students = FirebaseFirestore.instance.collection('student');
      final snapshot = await students.doc(rfid).get();

      if (snapshot.exists) {
        final data = snapshot.data() as Map<String, dynamic>;
        bool feePay = data['feepay'] ?? false;
        Timestamp? lastRide = data['lastride'];
        DateTime now = DateTime.now();

        if (feePay && lastRide != null) {
          final lastRideTime = lastRide.toDate();
          final difference = now.difference(lastRideTime);

          if (difference.inHours < 2) {
            _handleInvalidCard('Already scanned within 2 hours.', stopwatch);
          } else {
            _handleValidCard(rfid, stopwatch);
          }
        } else {
          _handleInvalidCard(
              feePay ? 'No last ride timestamp.' : 'Fee not paid.', stopwatch);
        }
      } else {
        _handleInvalidCard('Card not found in the database.', stopwatch);
      }
    } catch (e) {
      _handleInvalidCard('Error checking RFID: $e', stopwatch);
    } finally {
      stopwatch.stop();
      _updateStats(stopwatch.elapsedMilliseconds / 1000);
      _updateLoadingState(false);
    }
  }

  void _handleValidCard(String rfid, Stopwatch stopwatch) async {
    setState(() {
      _validationMessage = 'Card is valid!';
      _validCardTimeInSeconds += stopwatch.elapsedMilliseconds / 1000;
      _validCardCount++;
    });

    if (_useQueue) {
      _addToQueue(rfid);
    } else {
      await _updateLastRideTimestamp(rfid);
    }
  }

  void _handleInvalidCard(String message, Stopwatch stopwatch) {
    setState(() {
      _validationMessage = 'Card is invalid ($message)';
      _invalidCardTimeInSeconds += stopwatch.elapsedMilliseconds / 1000;
      _invalidCardCount++;
    });
  }

  Future<void> _updateLastRideTimestamp(String rfid) async {
    try {
      final students = FirebaseFirestore.instance.collection('student');
      await students.doc(rfid).update({'lastride': Timestamp.now()});
    } catch (e) {
      _updateValidationMessage('Error updating timestamp: $e');
    }
  }

  void _addToQueue(String rfid) {
    setState(() {
      _timestampQueue.add({'rfid': rfid, 'timestamp': Timestamp.now()});
    });
  }

  void _processQueue() async {
    while (true) {
      if (_timestampQueue.isNotEmpty) {
        _updateUploadingCount(_timestampQueue.length);

        try {
          final students = FirebaseFirestore.instance.collection('student');
          final batch = FirebaseFirestore.instance.batch();

          for (int i = 0; i < _timestampQueue.length; i++) {
            final item = _timestampQueue.removeAt(0);
            final docRef = students.doc(item['rfid']);
            batch.update(docRef, {'lastride': item['timestamp']});
          }

          await batch.commit();
        } catch (e) {
          _updateValidationMessage('Error uploading timestamp: $e');
        }

        _updateUploadingCount(_timestampQueue.length);
      } else {
        await Future.delayed(const Duration(seconds: 1));
      }
    }
  }

  void _updateLoadingState(bool isLoading) {
    setState(() => _isLoading = isLoading);
  }

  void _updateValidationMessage(String message) {
    setState(() => _validationMessage = message);
  }

  void _updateUploadingCount(int count) {
    setState(() => _timestampsUploading = count);
  }

  void _updateStats(double elapsedSeconds) {
    setState(() {
      _totalTimeInSeconds += elapsedSeconds;
      _operationCount++;
      _averageTimeInSeconds = _totalTimeInSeconds / _operationCount;
    });
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
          if (event is RawKeyDownEvent) {
            if (event.logicalKey == LogicalKeyboardKey.enter) {
              _addRFID(_currentInput);
              _currentInput = "";
            } else {
              _currentInput += event.character ?? "";
            }
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('Queue Mode:'),
                value: _useQueue,
                onChanged: (value) => setState(() => _useQueue = value),
              ),
              Text(
                'Scanned: ${_scannedRFIDs.length}, Uploading: $_timestampsUploading',
                style: const TextStyle(fontSize: 16),
              ),
              ElevatedButton(
                onPressed: () =>
                    setState(() => _isListVisible = !_isListVisible),
                child: Text(_isListVisible ? 'Collapse List' : 'Expand List'),
              ),
              if (_isListVisible)
                Expanded(
                  child: ListView.builder(
                    itemCount: _scannedRFIDs.length,
                    itemBuilder: (_, index) => ListTile(
                        title: Text('${index + 1}: ${_scannedRFIDs[index]}')),
                  ),
                ),
              if (_isLoading)
                const CircularProgressIndicator()
              else
                Text(
                  _validationMessage,
                  style: TextStyle(
                    fontSize: 18,
                    color: _validationMessage.contains('valid') &&
                            !_validationMessage.contains('invalid')
                        ? Colors.green
                        : Colors.red,
                  ),
                ),
              Text(
                'Average Time: ${_averageTimeInSeconds.toStringAsFixed(2)} seconds',
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
