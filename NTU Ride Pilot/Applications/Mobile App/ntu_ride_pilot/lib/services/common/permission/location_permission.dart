import 'dart:async';
import 'package:android_intent_plus/android_intent.dart';
import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:ntu_ride_pilot/widget/alert_dialog/alert_dialog.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationPermission {
  final BuildContext context;

  LocationPermission(this.context);

  Future<bool> checkLocationPermission() async {
    bool isLocationServiceEnabled =
        await Permission.location.serviceStatus.isEnabled;
    if (!isLocationServiceEnabled) {
      bool serviceEnabled = await showEnableLocationServiceDialog();
      if (!serviceEnabled) {
        return false;
      }
    }

    var status = await Permission.location.status;

    if (status.isGranted) {
      return true;
    } else if (status.isDenied) {
      bool shouldRequestPermission = await showPermissionRationale();
      if (shouldRequestPermission) {
        status = await Permission.location.request();
        return status.isGranted;
      }
      return false;
    } else if (status.isPermanentlyDenied) {
      bool openedSettings = await showPermanentlyDeniedDialog();
      if (openedSettings) {
        status = await Permission.location.status;
        return status.isGranted;
      }
      return false;
    }
    return false;
  }

  Future<bool> showEnableLocationServiceDialog() async {
    final completer = Completer<bool>();
    bool dialogShown = false;

    // Listen for app state changes
    WidgetsBinding.instance.addObserver(
      LifecycleEventHandler(
        resumeCallBack: () async {
          if (dialogShown) {
            // Check if service was enabled
            bool isEnabled = await Permission.location.serviceStatus.isEnabled;
            completer.complete(isEnabled);
          }
        },
      ),
    );

    // Show the dialog
    dialogShown = true;
    bool? result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => CustomAlertDialog(
        title: "Enable GPS",
        message: "GPS is disabled. Please enable it to continue.",
        onConfirm: () {
          Navigator.pop(context, true);
        },
        onCancel: () {
          Navigator.pop(context, false);
        },
        yesText: 'Enable',
        noText: 'Cancel',
        yesColor: Colors.blue,
      ),
    );

    if (result == true) {
      await openLocationSettings();
      // Wait for the user to return from settings
      return await completer.future;
    }

    return result ?? false;
  }

  Future<void> openLocationSettings() async {
    try {
      AndroidIntent intent = AndroidIntent(
        action: 'android.settings.LOCATION_SOURCE_SETTINGS',
      );
      await intent.launch();
    } catch (e) {
      SnackbarUtil.showError('Error', 'Failed to open location settings.');
    }
  }

  Future<bool> showPermissionRationale() async {
    bool? result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return CustomAlertDialog(
          title: "GPS Permission",
          message: "Allow access to GPS in order to continue!",
          onConfirm: () {
            Navigator.pop(context, true);
          },
          onCancel: () {
            Navigator.pop(context, false);
          },
          yesText: 'Allow',
          noText: 'Cancel',
          yesColor: Colors.blue,
        );
      },
    );

    return result ?? false;
  }

  Future<bool> showPermanentlyDeniedDialog() async {
    bool? result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return CustomAlertDialog(
          title: "Permission Required",
          message:
              "Location permission is permanently denied. Please enable it in app settings.",
          onConfirm: () {
            Navigator.pop(context, true);
          },
          onCancel: () {
            Navigator.pop(context, false);
          },
          yesText: 'Open Settings',
          noText: 'Cancel',
          yesColor: Colors.blue,
        );
      },
    );

    if (result == true) {
      await openAppSettings();
    }

    return result ?? false;
  }
}

class LifecycleEventHandler extends WidgetsBindingObserver {
  final VoidCallback resumeCallBack;

  LifecycleEventHandler({required this.resumeCallBack});

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      resumeCallBack();
    }
  }
}
