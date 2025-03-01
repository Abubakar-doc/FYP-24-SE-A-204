import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
import 'package:skeletonizer/skeletonizer.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Widget _buildStatRow(String title, String value, bool isDarkMode, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              color: isDarkMode ? Colors.grey.shade400 : Colors.grey.shade700,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    // Retrieve the existing instance of the controller.
    final DriverProfileController controller = Get.find<DriverProfileController>();

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
              controller.name.value.isNotEmpty ? controller.name.value : "Unknown",
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
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
              style: const TextStyle(fontSize: 16, color: Colors.blue, fontWeight: FontWeight.bold),
            ),
          )),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDarkMode ? Colors.grey.shade900 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Obx(() {
                return Skeletonizer(
                  enabled: controller.isLoading.value,
                  child: Column(
                    children: [
                      _buildStatRow("Total Rides", controller.totalRides.value.toString(), isDarkMode),
                      Divider(color: isDarkMode ? Colors.grey.shade700 : Colors.grey.shade400),
                      _buildStatRow("Total Hours", controller.totalHours.value, isDarkMode),
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
