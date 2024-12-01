import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class RFIDScannerScreen extends StatefulWidget {
  @override
  _RFIDScannerScreenState createState() => _RFIDScannerScreenState();
}

class _RFIDScannerScreenState extends State<RFIDScannerScreen> {
  final List<String> _scannedRFIDs = []; // List to store RFID tags.
  String _currentInput = ""; // Temporary storage for current tag input.
  final FocusNode _focusNode = FocusNode(); // FocusNode for the RawKeyboardListener.
  bool _isListVisible = false; // Controls the visibility of the list.

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
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RFID Scanner'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.clear),
            onPressed: _clearRFIDs, // Calls _clearRFIDs to clear the list
          ),
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
                  alignment: Alignment.center, // Aligning the Column to the right
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end, // Ensures all texts are right-aligned
                    children: [
                      Text(
                        'Number of IDs scanned: ${_scannedRFIDs.length}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      Text(
                        'Number of IDs uploaded: ${_scannedRFIDs.length}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      Text(
                        'Number of IDs pending upload: ${_scannedRFIDs.length}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      Text(
                        'Number of IDs failed to upload: ${_scannedRFIDs.length}',
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
            ],
          ),
        ),
      ),
    );
  }
}
