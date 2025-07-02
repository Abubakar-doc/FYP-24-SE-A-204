import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';

class DetailRow extends StatelessWidget {
  final String title;
  final String value;

  const DetailRow({
    super.key,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Truncate the value text if it's longer than 25 characters
    String displayValue =
        value.length > 25 ? '${value.substring(0, 25)}...' : value;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: theme.brightness == Brightness.dark
                  ? LighthintTextColor
                  : DarkhintTextColor,
            ),
          ),
          Text(
            displayValue,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis, // Handle overflow with ellipsis
          ),
        ],
      ),
    );
  }
}
