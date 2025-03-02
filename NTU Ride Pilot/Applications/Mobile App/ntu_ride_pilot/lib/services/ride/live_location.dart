// import 'package:android_intent_plus/android_intent.dart';
// import 'package:flutter/material.dart';
// import 'package:ntu_ride_pilot/utils/utils.dart';
// import 'package:ntu_ride_pilot/widget/alert_dialog/alert_dialog.dart';
// import 'package:permission_handler/permission_handler.dart';
// import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
//
// class LiveLocationService {
//   final BuildContext context;
//
//   LiveLocationService(this.context);
//
//   Future<bool> checkLocationPermission() async {
//     // Check if location services are enabled
//     bool isLocationServiceEnabled = await Permission.location.serviceStatus.isEnabled;
//     if (!isLocationServiceEnabled) {
//       // Prompt the user to enable location services
//       bool serviceEnabled = await showEnableLocationServiceDialog();
//       if (!serviceEnabled) {
//         return false; // User declined to enable location services
//       }
//     }
//
//     // Check permission status
//     var status = await Permission.location.status;
//
//     if (status.isGranted) {
//       // Permission already granted
//       return true;
//     } else if (status.isDenied) {
//       // Request permission
//       bool shouldRequestPermission = await showPermissionRationale();
//       if (shouldRequestPermission) {
//         status = await Permission.location.request();
//         if (status.isGranted) {
//           return true;
//         } else {
//           return false;
//         }
//       } else {
//         return false;
//       }
//     } else if (status.isPermanentlyDenied) {
//       // Permission permanently denied, guide user to app settings
//       bool openedSettings = await showPermanentlyDeniedDialog();
//       if (openedSettings) {
//         // Recheck permission after returning from settings
//         status = await Permission.location.status;
//         return status.isGranted;
//       } else {
//         return false;
//       }
//     }
//
//     return false;
//   }
//
//   Future<bool> showEnableLocationServiceDialog() async {
//     bool? result = await showDialog<bool>(
//       context: context,
//       builder: (context) {
//         return CustomAlertDialog(
//           title: "Enable GPS",
//           message: "GPS is disabled. Please enable it to continue.",
//           onConfirm: () {
//             Navigator.pop(context, true);
//           },
//           onCancel: () {
//             Navigator.pop(context, false);
//           },
//           yesText: 'Enable',
//           noText: 'Cancel',
//           yesColor: Colors.blue,
//         );
//       },
//     );
//
//     if (result == true) {
//       // Open Android location settings
//       await openLocationSettings();
//     }
//
//     return result ?? false;
//   }
//
//   Future<void> openLocationSettings() async {
//     try {
//       // Create an intent to open location settings
//       AndroidIntent intent = AndroidIntent(
//         action: 'android.settings.LOCATION_SOURCE_SETTINGS',
//       );
//       await intent.launch();
//     } catch (e) {
//       SnackbarUtil.showError('Error', 'Failed to open location settings.');
//     }
//   }
//
//   Future<bool> showPermissionRationale() async {
//     bool? result = await showDialog<bool>(
//       context: context,
//       builder: (context) {
//         return CustomAlertDialog(
//           title: "GPS Permission",
//           message: "Allow access to GPS in order to continue!",
//           onConfirm: () {
//             Navigator.pop(context, true);
//           },
//           onCancel: () {
//             Navigator.pop(context, false);
//           },
//           yesText: 'Allow',
//           noText: 'Cancel',
//           yesColor: Colors.blue,
//         );
//       },
//     );
//
//     return result ?? false;
//   }
//
//   Future<bool> showPermanentlyDeniedDialog() async {
//     bool? result = await showDialog<bool>(
//       context: context,
//       builder: (context) {
//         return CustomAlertDialog(
//           title: "Permission Required",
//           message: "Location permission is permanently denied. Please enable it in app settings.",
//           onConfirm: () {
//             Navigator.pop(context, true);
//           },
//           onCancel: () {
//             Navigator.pop(context, false);
//           },
//           yesText: 'Open Settings',
//           noText: 'Cancel',
//           yesColor: Colors.blue,
//         );
//       },
//     );
//
//     if (result == true) {
//       await openAppSettings();
//     }
//
//     return result ?? false;
//   }
//
//
//
//   void enableLocationSettings(MapboxMap? mapboxMapController) {
//     mapboxMapController?.location.updateSettings(
//       LocationComponentSettings(enabled: true, pulsingEnabled: true),
//     );
//   }
// }

import 'package:android_intent_plus/android_intent.dart';
import 'package:flutter/material.dart';
// import 'package:geolocator/geolocator.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:ntu_ride_pilot/widget/alert_dialog/alert_dialog.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;


class LiveLocationService {
  final BuildContext context;

  LiveLocationService(this.context);

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

  Future<geo.Position?> getCurrentLocation() async {
    bool hasPermission = await checkLocationPermission();
    if (!hasPermission) return null;

    try {
      return await geo.Geolocator.getCurrentPosition(
        desiredAccuracy: geo.LocationAccuracy.high,
      );
    } catch (e) {
      SnackbarUtil.showError('Error', 'Failed to get current location.');
      return null;
    }
  }


  Future<bool> showEnableLocationServiceDialog() async {
    bool? result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return CustomAlertDialog(
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
        );
      },
    );

    if (result == true) {
      await openLocationSettings();
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

  void enableLocationSettings(MapboxMap? mapboxMapController) {
    mapboxMapController?.location.updateSettings(
      LocationComponentSettings(enabled: true, pulsingEnabled: true),
    );
  }
}
