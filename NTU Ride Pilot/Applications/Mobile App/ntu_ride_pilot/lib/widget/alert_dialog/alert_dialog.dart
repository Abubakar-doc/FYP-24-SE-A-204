import 'package:flutter/material.dart';

class CustomAlertDialog extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback onConfirm;
  final VoidCallback onCancel;
  final Color? yesColor;

  const CustomAlertDialog({
    super.key,
    required this.title,
    required this.message,
    required this.onConfirm,
    required this.onCancel,
    this.yesColor,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        GestureDetector(
          onTap: onCancel,
          child: const Text('No'),
        ),
        const SizedBox(width: 10),
        GestureDetector(
          onTap: onConfirm,
          child: Text(
            'Yes',
            style: TextStyle(color: yesColor ?? Colors.red),
          ),
        ),
      ],
    );
  }
}
