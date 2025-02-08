import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';
import 'package:ntu_ride_pilot/screens/student/student_home/student_home_screen.dart';
import 'package:ntu_ride_pilot/services/student/student_service.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class StudentAuthService extends GetxController {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final StudentService _studentService = StudentService();

  Future<void> signIn(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      Get.off(() => StudentHomeScreen());
      await _saveStudentToHive(email);
    } catch (e) {
      SnackbarUtil.showError("Authentication Error", e.toString());
    }
  }

  Future<void> _saveStudentToHive(String email) async {
    try {
      var studentDoc = await _studentService.getStudentByEmail(email);
      if (studentDoc != null) {
        final box = Hive.box<StudentModel>('studentBox');
        box.put('current_student', studentDoc);
        SnackbarUtil.showSuccess("hive", "student saved.");
      } else {
        SnackbarUtil.showError("Sign-in Failed", "Student not found.");
      }
    } catch (e) {
      SnackbarUtil.showError("Error Saving Student", e.toString());
    }
  }

  StudentModel? getCurrentStudent() {
    final box = Hive.box<StudentModel>('studentBox');
    return box.get('current_student');
  }
}
