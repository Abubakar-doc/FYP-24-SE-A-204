import 'package:get/get.dart';
import 'package:ntu_ride_pilot/services/common/user_profile_service.dart';

class DriverProfileController extends GetxController {
  final UserProfileService _userProfileService = UserProfileService();

  var name = "Guest".obs;
  var role = "".obs;
  var profilePic = Rxn<String>();
  var isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    var userData = await _userProfileService.loadUserData();
    name.value = userData['name'];
    role.value = userData['role'];
    profilePic.value = userData['profilePic'];
    isLoading.value = false;
  }
}
