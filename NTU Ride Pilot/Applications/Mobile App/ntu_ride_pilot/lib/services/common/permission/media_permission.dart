import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class MediaPermission {
  Future<bool> checkStoragePermission() async {
    if (await Permission.photos.isGranted) return true;
    if (await Permission.photos.request().isGranted) return true;
    if (await Permission.storage.isGranted) return true;
    if (await Permission.storage.request().isGranted) return true;
    return false;
  }

  static void showPermissionDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Storage Permission Required'),
        content: const Text(
          'Storage permission is needed to save images. Please enable it in app settings.',
        ),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
}
