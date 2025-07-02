import 'package:flutter/material.dart';

class HelpScreen extends StatefulWidget {
  final String appBarTitle;
  final List<Map<String, String>> faqs;

  const HelpScreen({super.key, required this.appBarTitle, required this.faqs});

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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
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
              colorScheme: colorScheme,
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
    required ColorScheme colorScheme,
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
            color: colorScheme.surface,
            border: Border(
              top: BorderSide(
                width: 4,
                color: isOpen ? Colors.blue : colorScheme.surface,
              ),
              bottom: BorderSide(
                width: 4,
                color: colorScheme.surface,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: colorScheme.shadow.withOpacity(0.1),
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
                      color:
                          isOpen ? Colors.blue : colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 24),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w500,
                        color: isOpen ? Colors.blue : colorScheme.onSurface,
                      ),
                    ),
                  ),
                  Icon(
                    isOpen ? Icons.remove : Icons.add,
                    color: isOpen ? Colors.blue : colorScheme.onSurface,
                    size: 24,
                  ),
                ],
              ),
              if (isOpen)
                Padding(
                  padding: const EdgeInsets.only(top: 16.0),
                  child: Text(
                    text,
                    style: TextStyle(
                      fontSize: 16,
                      height: 1.6,
                      color: colorScheme.onSurfaceVariant,
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
