import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/bottom_user_info_controller.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:ntu_ride_pilot/services/common/authentication.dart';

class BottomUserInfo extends StatelessWidget {
  final bool isCollapsed;

  const BottomUserInfo({super.key, required this.isCollapsed});

  @override
  Widget build(BuildContext context) {
    final BottomUserInfoController controller = Get.put(BottomUserInfoController());
    final AuthService authService = Get.find<AuthService>();

    bool isDarkTheme = Theme.of(context).brightness == Brightness.dark;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      height: isCollapsed ? 70 : 100,
      width: double.infinity,
      decoration: BoxDecoration(
        color: isDarkTheme ? Colors.white10 : Colors.grey.shade200,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            child: Obx(() => Row(
              children: [
                if (controller.role.value == 'driver' && controller.profilePic.value != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: CircleAvatar(
                      radius: 20,
                      backgroundColor: Colors.grey,
                      backgroundImage: controller.profilePic.value != null
                          ? NetworkImage(controller.profilePic.value!)
                          : null,
                      onBackgroundImageError: (_, __) =>
                      const Icon(Icons.person, size: 40, color: Colors.grey),
                    ),
                  ),
                Expanded(
                  flex: 5,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Skeletonizer(
                        enabled: controller.isLoading.value,
                        child: Text(
                          controller.name.value,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Skeletonizer(
                        enabled: controller.isLoading.value,
                        child: Text(
                          controller.role.value.isNotEmpty
                              ? controller.role.value.capitalizeFirst!
                              : "Unknown Role",
                          style: TextStyle(
                              color: isDarkTheme ? Colors.grey : Colors.grey.shade600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            )),
          ),
          IconButton(
            onPressed: () => authService.logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
    );
  }
}
