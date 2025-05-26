// import 'package:flutter/material.dart';
// import 'package:get/get.dart';
// import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
// import 'package:ntu_ride_pilot/screens/common/profile/profile.dart';
// import 'package:skeletonizer/skeletonizer.dart';
//
// class BottomUserInfo extends StatelessWidget {
//   final bool isCollapsed;
//
//   const BottomUserInfo({super.key, required this.isCollapsed});
//
//   @override
//   Widget build(BuildContext context) {
//     final DriverProfileController controller =
//         Get.put(DriverProfileController());
//
//     bool isDarkTheme = Theme.of(context).brightness == Brightness.dark;
//
//     return GestureDetector(
//       onTap: () {
//         Navigator.pop(context);
//         Get.to(ProfileScreen(), transition: Transition.rightToLeft);
//       },
//       child: AnimatedContainer(
//         duration: const Duration(milliseconds: 300),
//         height: isCollapsed ? 70 : 100,
//         width: double.infinity,
//         decoration: BoxDecoration(
//           color: isDarkTheme ? Colors.white10 : Colors.grey.shade200,
//           borderRadius: BorderRadius.circular(20),
//         ),
//         child: Skeletonizer(
//           enabled: controller.isLoading.value,
//           child: Row(
//             children: [
//               Expanded(
//                 child: Obx(() => Row(
//                       children: [
//                         if (controller.role.value == 'driver' &&
//                             controller.profilePic.value != null)
//                           Padding(
//                               padding:
//                                   const EdgeInsets.symmetric(horizontal: 10),
//                               child: CircleAvatar(
//                                 radius: 20,
//                                 backgroundColor: Colors.blue,
//                                 backgroundImage: (controller.profilePic.value !=
//                                             null &&
//                                         controller
//                                             .profilePic.value!.isNotEmpty &&
//                                         Uri.tryParse(controller
//                                                     .profilePic.value!)
//                                                 ?.hasAbsolutePath ==
//                                             true)
//                                     ? NetworkImage(controller.profilePic.value!)
//                                     : null,
//                                 child: (controller.profilePic.value == null ||
//                                         controller.profilePic.value!.isEmpty ||
//                                         Uri.tryParse(controller
//                                                     .profilePic.value!)
//                                                 ?.hasAbsolutePath !=
//                                             true)
//                                     ? const Icon(Icons.person,
//                                         size: 35, color: Colors.white)
//                                     : null,
//                               )),
//                         Expanded(
//                           flex: 5,
//                           child: Column(
//                             mainAxisAlignment: MainAxisAlignment.center,
//                             crossAxisAlignment: CrossAxisAlignment.start,
//                             children: [
//                               Skeletonizer(
//                                 enabled: controller.isLoading.value,
//                                 child: Text(
//                                   controller.name.value,
//                                   style: const TextStyle(
//                                       fontWeight: FontWeight.bold,
//                                       fontSize: 18),
//                                   maxLines: 1,
//                                   overflow: TextOverflow.ellipsis,
//                                 ),
//                               ),
//                               Text(
//                                 controller.role.value.isNotEmpty
//                                     ? controller.role.value.capitalizeFirst!
//                                     : "Unknown Role",
//                                 style: TextStyle(
//                                     color: isDarkTheme
//                                         ? Colors.grey
//                                         : Colors.grey.shade600),
//                                 maxLines: 1,
//                                 overflow: TextOverflow.ellipsis,
//                               ),
//                             ],
//                           ),
//                         ),
//                       ],
//                     )),
//               ),
//               IconButton(
//                 onPressed: () => Get.to(ProfileScreen()),
//                 icon: const Icon(Icons.keyboard_arrow_right),
//               ),
//             ],
//           ),
//         ),
//       ),
//     );
//   }
// }

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/profile_controller.dart';
import 'package:ntu_ride_pilot/screens/common/profile/profile.dart';
import 'package:skeletonizer/skeletonizer.dart';

class BottomUserInfo extends StatelessWidget {
  final bool isCollapsed;

  const BottomUserInfo({super.key, required this.isCollapsed});

  @override
  Widget build(BuildContext context) {
    final DriverProfileController controller =
    Get.put(DriverProfileController());

    bool isDarkTheme = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        Get.to(ProfileScreen(), transition: Transition.rightToLeft);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: isCollapsed ? 70 : 100,
        width: double.infinity,
        decoration: BoxDecoration(
          color: isDarkTheme ? Colors.white10 : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Skeletonizer(
          enabled: controller.isLoading.value,
          child: Row(
            children: [
              Expanded(
                child: Obx(() {
                  final url = controller.profilePic.value;
                  final isValidUrl = url != null &&
                      url.isNotEmpty &&
                      (url.startsWith('http://') || url.startsWith('https://'));

                  return Row(
                    children: [
                      if (controller.role.value == 'driver')
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: CircleAvatar(
                            radius: 20,
                            backgroundColor: isValidUrl ? Colors.transparent : Colors.blue,
                            child: isValidUrl
                                ? ClipOval(
                              child: CachedNetworkImage(
                                imageUrl: url,
                                width: 40,
                                height: 40,
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) => const Icon(
                                  Icons.person,
                                  size: 20,
                                  color: Colors.white,
                                ),
                              ),
                            )
                                : const Icon(
                              Icons.person,
                              size: 20,
                              color: Colors.white,
                            ),
                          )
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
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              controller.role.value.isNotEmpty
                                  ? controller.role.value.capitalizeFirst!
                                  : "Unknown Role",
                              style: TextStyle(
                                  color: isDarkTheme
                                      ? Colors.grey
                                      : Colors.grey.shade600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                }),
              ),
              IconButton(
                onPressed: () => Get.to(ProfileScreen()),
                icon: const Icon(Icons.keyboard_arrow_right),
              ),
            ],
          ),
        ),
      ),
    );
  }
}