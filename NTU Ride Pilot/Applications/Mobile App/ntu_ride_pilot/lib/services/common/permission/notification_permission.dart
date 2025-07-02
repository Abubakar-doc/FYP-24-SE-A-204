import 'package:permission_handler/permission_handler.dart';

class NotificationPermission {
  Future<bool> requestPermission() async {
    if (await Permission.notification.isGranted) {
      return true;
    }

    final status = await Permission.notification.request();
    return status.isGranted;
  }
}
