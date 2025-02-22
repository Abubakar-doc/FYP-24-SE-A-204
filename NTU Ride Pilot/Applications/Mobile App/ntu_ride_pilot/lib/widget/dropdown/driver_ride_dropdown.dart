import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';

class CustomDropdown extends StatelessWidget {
  final String title;
  final String? selectedValue;
  final List<String> items;
  final ValueChanged<String?> onChanged;
  final InputDecoration? decoration;

  const CustomDropdown({
    Key? key,
    required this.title,
    required this.selectedValue,
    required this.items,
    required this.onChanged,
    this.decoration,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: theme.brightness == Brightness.dark
            ? DarkInputFieldFillColor
            : LightInputFieldFillColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          dropdownColor: theme.brightness == Brightness.dark
              ? DarkInputFieldFillColor
              : LightInputFieldFillColor,
          value: selectedValue,
          hint: Text(
            title,
            style: TextStyle(
              color: theme.brightness == Brightness.dark
                  ? DarkhintTextColor
                  : Colors.grey.shade700,
            ),
          ),
          isExpanded: true,
          icon: Icon(
            Icons.arrow_drop_down, // Use a normal icon instead of IconButton
            color: theme.brightness == Brightness.dark
                ? darkTextColor
                : Colors.black,
          ),
          onChanged: onChanged,
          items: items.map((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(
                value,
                style: TextStyle(
                  color: theme.brightness == Brightness.dark
                      ? darkTextColor
                      : Colors.black,
                  fontWeight: FontWeight.bold,
                ),
              ),
            );
          }).toList(),
          borderRadius: BorderRadius.circular(12),
          menuMaxHeight: 200,
        ),
      ),
    );
  }
}
