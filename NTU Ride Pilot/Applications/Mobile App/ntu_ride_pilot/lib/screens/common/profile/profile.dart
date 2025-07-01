import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/widget/stat_row/stat_row.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:ntu_ride_pilot/widget/image_viewer/image_viewer.dart';
import 'package:ntu_ride_pilot/services/common/media/media_service.dart';
import 'package:ntu_ride_pilot/services/common/permission/media_permission.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    // Retrieve the existing instance of the controller.
    final ProfileController controller =
        Get.find<ProfileController>();

    // Create instances of MediaService and MediaPermission
    final MediaService mediaService = MediaService();
    final MediaPermission mediaPermission = MediaPermission();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Profile"),
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),
          // Profile Picture - Now wrapped with GestureDetector
          Obx(() {
            final url = controller.profilePic.value;
            final isValidUrl = url != null &&
                url.isNotEmpty &&
                (url.startsWith('http://') || url.startsWith('https://'));

            // Pre-cache the image when it's available
            if (isValidUrl) {
              precacheImage(CachedNetworkImageProvider(url), context);
            }

            return GestureDetector(
              onTap: isValidUrl
                  ? () {
                      Get.to(
                        ImageViewer(
                          images: [url],
                          initialIndex: 0,
                          mediaService: mediaService,
                          mediaPermission: mediaPermission,
                          enableSharing: false,
                          appBarTitle: 'Profile Picture',
                        ),
                        transition: Transition.cupertino,
                        duration: const Duration(milliseconds: 300),
                      );
                    }
                  : null,
              child: Hero(
                tag: isValidUrl ? url : 'default-profile',
                child: CircleAvatar(
                  radius: 80,
                  backgroundColor: isValidUrl ? Colors.transparent : Colors.blue,
                  child: isValidUrl
                      ? ClipOval(
                          child: CachedNetworkImage(
                            imageUrl: url,
                            fit: BoxFit.cover,
                            width: 160,
                            height: 160,
                            errorWidget: (context, url, error) => const Icon(
                                Icons.person,
                                size: 100,
                                color: Colors.white),
                          ),
                        )
                      : const Icon(Icons.person,
                          size: 100, color: Colors.white),
                ),
              ),
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
