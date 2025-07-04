import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/services/common/notification/notification_service.dart';
import 'package:ntu_ride_pilot/services/common/permission/media_permission.dart';
import 'package:ntu_ride_pilot/services/common/permission/notification_permission.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:typed_data';

class MediaService {
  final MediaPermission _mediaPermission = MediaPermission();
  final String cloudinaryCloudName = 'dytxo7qt1';
  final String cloudinaryUploadPreset = 'unsigned_preset';
  final String cloudinaryApiKey = '665531396735773';
  final String cloudinaryApiSecret = 'TjO9eDlXm8gAaFPhTyfcVt5ndx0';

  void preCacheImages(BuildContext context) {
    precacheImage(const AssetImage('assets/pictures/logoDark.jpg'), context);
    precacheImage(const AssetImage('assets/pictures/logoLight.jpg'), context);
    precacheImage(
        const AssetImage(
            'assets/pictures/National_Textile_University_Logo.png'),
        context);
    precacheImage(const AssetImage('assets/pictures/google_logo.png'), context);
  }

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

      final shareText =
          'Check out this announcement on NTU RIDE PILOT!\n\nTitle: $title\n\nMessage: $message\n\nAttached Files:\n$numberedLinks';

      await Share.share(shareText);
    } catch (e) {
      throw Exception('Failed to share notification: $e');
    }
  }

  Future<void> downloadImage(String url, BuildContext context) async {
    bool permissionGranted = await _mediaPermission.checkStoragePermission();
    if (!permissionGranted) {
      MediaPermission.showPermissionDialog(context);
      throw Exception('Storage permission not granted');
    }

    final notificationPermission = NotificationPermission();
    bool notificationPermissionGranted =
        await notificationPermission.requestPermission();

    final int notificationId = generateNotificationId(url);

    try {
      final dio = Dio();

      final response = await dio.get<List<int>>(
        url,
        options: Options(responseType: ResponseType.bytes),
        onReceiveProgress: (received, total) {
          if (total != -1 && notificationPermissionGranted) {
            int progress = ((received / total) * 100).toInt();
            NotificationService()
                .showProgressNotification(notificationId, progress);
          }
        },
      );

      final Uint8List imageData = Uint8List.fromList(response.data!);
      final result = await ImageGallerySaverPlus.saveImage(imageData);

      if (result['isSuccess'] != true) {
        throw Exception('Failed to save image to gallery');
      }

      if (notificationPermissionGranted) {
        await NotificationService().cancelNotification(notificationId);
        await NotificationService()
            .showDownloadCompleteNotification(notificationId);
      }
    } catch (e) {
      if (notificationPermissionGranted) {
        await NotificationService().cancelNotification(notificationId);
      }
      throw Exception('Error saving image: $e');
    }
  }

  int generateNotificationId(String url) {
    return url.hashCode;
  }

  Future<Map<String, List<String>>> uploadImagesToCloudinary(
      List<String> imagePaths) async {
    List<String> imageUrls = [];
    List<String> publicIds = [];

    for (String imagePath in imagePaths) {
      var uri = Uri.parse(
          'https://api.cloudinary.com/v1_1/$cloudinaryCloudName/image/upload');
      var request = http.MultipartRequest('POST', uri);
      request.fields['upload_preset'] = cloudinaryUploadPreset;
      request.files.add(await http.MultipartFile.fromPath('file', imagePath));

      // Send the request to Cloudinary
      var response = await request.send();
      var responseBody = await response.stream.bytesToString();
      var jsonResponse = json.decode(responseBody);

      if (jsonResponse['secure_url'] != null &&
          jsonResponse['public_id'] != null) {
        imageUrls.add(jsonResponse['secure_url']);
        publicIds.add(jsonResponse['public_id']);
      } else {
        throw Exception('Failed to upload image');
      }
    }

    return {
      'urls': imageUrls,
      'publicIds': publicIds,
    };
  }
}
