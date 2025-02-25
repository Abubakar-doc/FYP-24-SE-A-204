import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';

class CustomDropdown<T> extends StatelessWidget {
  final String title;
  final T? selectedValue;
  final List<T> items;
  final ValueChanged<T?> onChanged;
  // A function that converts an item into a displayable string.
  final String Function(T) displayItem;
  final InputDecoration? decoration;

  const CustomDropdown({
    super.key,
    required this.title,
    required this.selectedValue,
    required this.items,
    required this.onChanged,
    required this.displayItem,
    this.decoration,
  });

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
        child: DropdownButton<T>(
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
            Icons.arrow_drop_down,
            color: theme.brightness == Brightness.dark
                ? darkTextColor
                : Colors.black,
          ),
          onChanged: onChanged,
          items: items.map((T value) {
            return DropdownMenuItem<T>(
              value: value,
              child: Text(
                displayItem(value),
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
