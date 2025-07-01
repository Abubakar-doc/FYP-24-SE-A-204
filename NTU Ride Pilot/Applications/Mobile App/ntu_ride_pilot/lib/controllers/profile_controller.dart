import 'package:get/get.dart';
import 'package:ntu_ride_pilot/services/driver/profile_stats.dart';
import 'package:ntu_ride_pilot/services/profile/user_profile_service.dart';

class ProfileController extends GetxController {
  final UserProfileService _userProfileService = UserProfileService();
  final ProfileStatsService _profileStatsService = ProfileStatsService();

  var name = "Guest".obs;
  var role = "".obs;
  var profilePic = Rxn<String>();
  var isLoading = true.obs;
  var totalRides = 0.obs;
  var totalHours = "0.0".obs;

  @override
  void onInit() {
    super.onInit();
    _loadUserData();
    _loadRideStats();
  }

  Future<void> _loadUserData() async {
    var userData = await _userProfileService.loadUserData();
    name.value = userData['name'];
    role.value = userData['role'];
    profilePic.value = userData['profilePic'];
    isLoading.value = false;
  }

  Future<void> _loadRideStats() async {
    // Now simply call the ProfileStatsService to get stats.
    final stats = await _profileStatsService.fetchRideStats();
    totalRides.value = stats['totalRides'];
    totalHours.value = stats['totalHours'];
  }
}
