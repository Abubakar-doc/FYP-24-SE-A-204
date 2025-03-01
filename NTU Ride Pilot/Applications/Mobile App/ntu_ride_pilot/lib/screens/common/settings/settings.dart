import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/theme_controller.dart';
import 'package:ntu_ride_pilot/screens/common/help/settings/help_settings.dart';
import 'package:ntu_ride_pilot/services/common/common_auth.dart';
import 'package:ntu_ride_pilot/widget/alert_dialog/alert_dialog.dart';
import 'package:ntu_ride_pilot/widget/dropdown/driver_ride_dropdown.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AuthService authService = Get.find<AuthService>();
  final ThemeController themeController = Get.find<ThemeController>();

  final List<ThemeMode> themeOptions = [
    ThemeMode.light,
    ThemeMode.dark,
    ThemeMode.system,
  ];

  bool _isLoggingOut = false;

  String displayThemeMode(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return "Light";
      case ThemeMode.dark:
        return "Dark";
      case ThemeMode.system:
        return "System";
      default:
        return "Unknown";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Settings',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            IconButton(
              icon: const Icon(Icons.help_outline),
              onPressed: () {
                Get.to(SettingsHelpScreen());
              },
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                "Change Theme",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              Obx(() => CustomDropdown<ThemeMode>(
                title: "Select Theme",
                selectedValue: themeController.themeMode.value,
                items: themeOptions,
                displayItem: (mode) => displayThemeMode(mode),
                onChanged: (ThemeMode? mode) {
                  if (mode != null) {
                    themeController.setTheme(mode);
                  }
                },
              )),
              const SizedBox(height: 20),
              const Text(
                "Connected Email",
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: TextEditingController(
                    text: authService.currentUserEmail ?? ''),
                readOnly: true,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 20),
              const Spacer(),
              TextButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  disabledBackgroundColor: Colors.grey,
                ),
                onPressed: _isLoggingOut
                    ? null
                    : () {
                  showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return CustomAlertDialog(
                        onCancel: () {
                          Navigator.of(context).pop();
                        },
                        onConfirm: () async {
                          Navigator.of(context).pop();
                          setState(() {
                            _isLoggingOut = true;
                          });
                          await authService.logout();
                          // Optionally, if logout fails and the user remains on this screen,
                          // you can reset _isLoggingOut to false.
                          setState(() {
                            _isLoggingOut = false;
                          });
                        },
                        title: 'Logout?',
                        message: 'Are you sure you want to Logout?',
                      );
                    },
                  );
                },
                child: Text(
                  _isLoggingOut ? 'Logging Out...' : 'Log out',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
