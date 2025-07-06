import 'package:flutter/material.dart';

class StatRow extends StatelessWidget {
  final String title;
  final String value;
  final bool isDarkMode;
  final bool isBold;
  /// Optional color for the value text (e.g. Colors.red or Colors.green)
  final Color? valueColor;

  const StatRow({
    super.key,
    required this.title,
    required this.value,
    required this.isDarkMode,
    this.isBold = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    // Fallback to default text color based on brightness
    final defaultValueColor = isDarkMode ? Colors.white : Colors.black;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              color: isDarkMode ? Colors.grey.shade400 : Colors.grey.shade700,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: valueColor ?? defaultValueColor,
            ),
          ),
        ],
      ),
    );
  }
}
