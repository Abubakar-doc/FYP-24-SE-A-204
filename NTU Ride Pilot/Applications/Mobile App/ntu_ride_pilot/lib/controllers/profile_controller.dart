import 'package:get/get.dart';
import 'package:ntu_ride_pilot/services/common/profile/user_profile_service.dart';
import 'package:ntu_ride_pilot/services/driver/profile_stats.dart';

class ProfileController extends GetxController {
  final UserProfileService _userProfileService = UserProfileService();
  final ProfileStatsService _profileStatsService = ProfileStatsService();

  var name = 'Guest'.obs;
  var role = ''.obs;
  var profilePic = Rxn<String>();
  var isLoading = true.obs;
  var totalRides = 0.obs;
  var totalHours = '0.0'.obs;
  var busCardStatus = 'Inactive'.obs;
  var feeStatus = 'Due'.obs;
  var rollNo = ''.obs;

  @override
  void onInit() {
    super.onInit();
    _loadUserData();
    _loadRideStats();
  }

  Future<void> _loadUserData() async {
    try {
      isLoading.value = true;
      final userData = await _userProfileService.loadUserData();

      name.value = userData['name'] as String? ?? 'Guest';
      role.value = userData['role'] as String? ?? '';
      profilePic.value = userData['profilePic'] as String?;
      rollNo.value     = userData['rollNo']       as String? ?? '';

      // bus_card_status comes in as a String ("Active"/"Inactive")
      busCardStatus.value =
          (userData['bus_card_status'] as String?)?.capitalizeFirst ??
              'Inactive';

      // feeStatus comes in as a bool; convert to "Paid"/"Due"
      final rawFee = userData['feeStatus'];
      if (rawFee is bool) {
        feeStatus.value = rawFee ? 'Paid' : 'Due';
      } else if (rawFee is String) {
        feeStatus.value = rawFee.capitalizeFirst!;
      } else {
        feeStatus.value = 'Due';
      }
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _loadRideStats() async {
    final stats = await _profileStatsService.fetchRideStats();
    totalRides.value = stats['totalRides'] ?? 0;
    totalHours.value = stats['totalHours'] ?? '0.0';
  }
}
