import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:typed_data';

class MediaService {
  final Dio _dio = Dio();

  Future<void> shareMedia(String url) async {
    try {
      await Share.share(
        'Check out this image on NTU RIDE PILOT!\n\n$url',
      );
    } catch (e) {
      throw Exception('Failed to share media: $e');
    }
  }

  Future<void> shareNotification(NotificationModel notification) async {
    try {
      final title = notification.title;
      final message = notification.message;

      final linksList = notification.mediaLinks ?? [];
      // Number the links: 1. link1\n2. link2\n...
      final numberedLinks = linksList
          .asMap()
          .entries
          .map((entry) => '${entry.key + 1}. ${entry.value}')
          .join('\n\n');

      final shareText = 'Check out this announcement on NTU RIDE PILOT!\n\nTitle: $title\n\nMessage: $message\n\nAttached Files:\n$numberedLinks';

      await Share.share(shareText);
    } catch (e) {
      throw Exception('Failed to share notification: $e');
    }
  }

  Future<void> downloadImage(String url, BuildContext context) async {
    bool permissionGranted = await _checkStoragePermission();
    if (!permissionGranted) {
      throw Exception('Storage permission not granted');
    }

    try {
      final response = await _dio.get<List<int>>(
        url,
        options: Options(responseType: ResponseType.bytes),
      );

      final Uint8List imageData = Uint8List.fromList(response.data!);
      final result = await ImageGallerySaverPlus.saveImage(imageData);

      if (result['isSuccess'] != true) {
        throw Exception('Failed to save image to gallery');
      }
    } catch (e) {
      throw Exception('Error saving image: $e');
    }
  }

  Future<bool> _checkStoragePermission() async {
    if (await Permission.photos.isGranted) return true;
    if (await Permission.photos.request().isGranted) return true;
    if (await Permission.storage.isGranted) return true;
    if (await Permission.storage.request().isGranted) return true;
    return false;
  }

  void showPermissionDialog(BuildContext context) {
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