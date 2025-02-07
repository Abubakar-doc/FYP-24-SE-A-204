import 'package:flutter/material.dart';

class HelpScreen extends StatefulWidget {
  final String appBarTitle;
  final List<Map<String, String>> faqs;

  const HelpScreen({Key? key, required this.appBarTitle, required this.faqs}) : super(key: key);

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  int? openIndex;

  void toggleIndex(int index) {
    setState(() {
      openIndex = (openIndex == index) ? null : index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(widget.appBarTitle),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16.0),
        child: ListView.builder(
          itemCount: widget.faqs.length,
          itemBuilder: (context, index) {
            final isOpen = openIndex == index;
            return _buildAccordionItem(
              num: index + 1,
              title: widget.faqs[index]['title']!,
              text: widget.faqs[index]['text']!,
              isOpen: isOpen,
              onToggle: () => toggleIndex(index),
            );
          },
        ),
      ),
    );
  }

  Widget _buildAccordionItem({
    required int num,
    required String title,
    required String text,
    required bool isOpen,
    required VoidCallback onToggle,
  }) {
    return GestureDetector(
      onTap: onToggle,
      child: AnimatedSize(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(
              top: BorderSide(
                width: 4,
                color: isOpen ? Colors.blue : Colors.white,
              ),
              bottom: const BorderSide(
                width: 4,
                color: Colors.white,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 30,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Text(
                    num < 10 ? '0$num' : '$num',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w500,
                      color: isOpen ? Colors.blue : const Color(0xFFCED4DA),
                    ),
                  ),
                  const SizedBox(width: 24),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w500,
                        color: isOpen ? Colors.blue : const Color(0xFF343A40),
                      ),
                    ),
                  ),
                  Icon(
                    isOpen ? Icons.remove : Icons.add,
                    color: isOpen ? Colors.blue : Colors.black,
                    size: 24,
                  ),
                ],
              ),
              // Directly showing the text without "curtain" effect
              Container(
                padding: const EdgeInsets.only(top: 16.0),
                child: isOpen
                    ? Text(
                  text,
                  style: const TextStyle(
                    fontSize: 16,
                    height: 1.6,
                    color: Color(0xFF868E96),
                  ),
                )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
