import 'package:flutter/material.dart';

class CustomAlertDialog extends StatelessWidget {
  final VoidCallback onConfirm;
  final VoidCallback onCancel;

  const CustomAlertDialog({
    super.key,
    required this.onConfirm,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Cancel this Ride?'),
      content: const Text('Are you sure you want to cancel?'),
      actions: [
        GestureDetector(
          onTap: onCancel,
          child: const Text('No'),
        ),
        SizedBox(width: 10,),
        GestureDetector(
          onTap: onConfirm,
          child: const Text('Yes', style: TextStyle(color: Colors.red),),
        ),
      ],
    );
  }
}
