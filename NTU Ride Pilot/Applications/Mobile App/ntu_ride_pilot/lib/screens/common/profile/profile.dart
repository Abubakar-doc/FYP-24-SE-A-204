import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/stat_row/stat_row.dart';
import 'package:skeletonizer/skeletonizer.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    // Retrieve the existing instance of the controller.
    final DriverProfileController controller =
        Get.find<DriverProfileController>();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Profile"),
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),
          // Profile Picture
          Obx(() {
            final url = controller.profilePic.value;
            final isValidUrl = url != null &&
                url.isNotEmpty &&
                (url.startsWith('http://') || url.startsWith('https://'));
            return CircleAvatar(
              radius: 80,
              backgroundColor: Colors.blue,
              backgroundImage: isValidUrl ? NetworkImage(url) : null,
              child: !isValidUrl
                  ? const Icon(Icons.person, size: 100, color: Colors.white)
                  : null,
            );
          }),
          const SizedBox(height: 10),
          // Name
          Obx(() => Skeletonizer(
                enabled: controller.isLoading.value,
                child: Text(
                  controller.name.value.isNotEmpty
                      ? controller.name.value
                      : "Unknown",
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.bold),
                ),
              )),
          const SizedBox(height: 5),
          // Role
          Obx(() => Skeletonizer(
                enabled: controller.isLoading.value,
                child: Text(
                  controller.role.value.isNotEmpty
                      ? controller.role.value.capitalizeFirst!
                      : "Unknown Role",
                  style: const TextStyle(
                      fontSize: 16,
                      color: Colors.blue,
                      fontWeight: FontWeight.bold),
                ),
              )),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.brightness == Brightness.dark
                    ? DarkInputFieldFillColor
                    : LightInputFieldFillColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Obx(() {
                return Skeletonizer(
                  enabled: controller.isLoading.value,
                  child: Column(
                    children: [
                      StatRow(
                        title: "Total Rides",
                        value: controller.totalRides.value.toString(),
                        isDarkMode: isDarkMode,
                      ),
                      Divider(
                          color: isDarkMode
                              ? Colors.grey.shade700
                              : Colors.grey.shade400),
                      StatRow(
                        title: "Total Hours",
                        value: controller.totalHours.value,
                        isDarkMode: isDarkMode,
                      ),
                    ],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
