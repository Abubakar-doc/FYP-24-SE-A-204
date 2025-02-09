import 'package:flutter/material.dart';

class CustomDropdown extends StatelessWidget {
  final String title;
  final String? selectedValue;
  final List<String> items;
  final ValueChanged<String?> onChanged;
  final Color dropdownColor;
  final Color hintColor;
  final Color textColor;

  const CustomDropdown({
    Key? key,
    required this.title,
    required this.selectedValue,
    required this.items,
    required this.onChanged,
    required this.dropdownColor,
    required this.hintColor,
    required this.textColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: dropdownColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          dropdownColor: dropdownColor,
          value: selectedValue,
          hint: Text(
            title,
            style: TextStyle(
              color: hintColor,
            ),
          ),
          isExpanded: true,
          icon: Icon(
            Icons.arrow_drop_down,
            color: textColor,
          ),
          onChanged: onChanged,
          items: items.map((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(
                value,
                style: TextStyle(
                  color: textColor,
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
