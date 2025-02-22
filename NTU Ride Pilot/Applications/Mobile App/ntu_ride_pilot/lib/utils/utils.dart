import 'package:flutter/material.dart';
import 'package:get/get.dart';

class SnackbarUtil {
  // Show Error Snackbar
  static void showError(String title, String message) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.TOP,
      backgroundColor: Get.theme.colorScheme.error,
      colorText: Get.theme.colorScheme.onError,
      duration: Duration(seconds: 4),
    );
  }

  // Show Success Snackbar
  static void showSuccess(String title, String message) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.TOP,
      backgroundColor: Colors.green[500],
      colorText: Get.theme.colorScheme.onSecondary,
      duration: Duration(seconds: 4),
    );
  }

  // Show Info Snackbar
  static void showInfo(String title, String message) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.TOP,
      backgroundColor: Colors.grey[400],
      colorText: Get.theme.colorScheme.onSecondary,
      duration: Duration(seconds: 4),
    );
  }
}
