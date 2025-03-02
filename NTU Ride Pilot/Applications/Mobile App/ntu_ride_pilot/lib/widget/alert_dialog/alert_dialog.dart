import 'package:flutter/material.dart';

class CustomAlertDialog extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback onConfirm;
  final VoidCallback onCancel;
  final Color? yesColor;
  final String? yesText;
  final String? noText;

  const CustomAlertDialog({
    super.key,
    required this.title,
    required this.message,
    required this.onConfirm,
    required this.onCancel,
    this.yesColor,
    this.yesText,
    this.noText,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        GestureDetector(
          onTap: onCancel,
          child: Text(noText ?? 'No'),
        ),
        const SizedBox(width: 10),
        GestureDetector(
          onTap: onConfirm,
          child: Text(
            yesText ?? 'Yes', // Default to 'Yes' if yesText is null
            style: TextStyle(color: yesColor ?? Colors.red),
          ),
        ),
      ],
    );
  }
}
