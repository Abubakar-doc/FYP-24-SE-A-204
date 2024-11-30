import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: RFIDScannerScreen(),
    );
  }
}

class RFIDScannerScreen extends StatefulWidget {
  @override
  _RFIDScannerScreenState createState() => _RFIDScannerScreenState();
}

class _RFIDScannerScreenState extends State<RFIDScannerScreen> {
  final List<String> _scannedRFIDs = []; // List to store RFID tags.
  String _currentInput = ""; // Temporary storage for current tag input.
  FocusNode _focusNode = FocusNode(); // FocusNode for the RawKeyboardListener.
  ScrollController _scrollController = ScrollController(); // Controller for ListView scroll.

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

  // Method to add RFID and scroll to the bottom of the list
  void _addRFID(String rfid) {
    setState(() {
      _scannedRFIDs.add(rfid); // Add RFID to the list
    });

    // Scroll to the bottom after adding a new RFID
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('RFID Scanner'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.clear),
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
                child: Text(
                  'Number of IDs scanned: ${_scannedRFIDs.length}',
                  style: TextStyle(fontSize: 16),
                ),
              ),
              // ListView to display scanned RFID tags
              Expanded(
                child: ListView.builder(
                  controller: _scrollController, // Attach scroll controller
                  itemCount: _scannedRFIDs.length,
                  itemBuilder: (context, index) {
                    return ListTile(
                      title: Text(_scannedRFIDs[index]),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
