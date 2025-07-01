import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';

class StudentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Check if the student exists in Firestore by email
  Future<bool> checkStudentExistsInFirestore(String email) async {
    try {
      var studentDoc = await getStudentByEmail(email);
      return studentDoc != null; // Return true if student exists, else false
    } catch (e) {
      print("Error checking student existence in Firestore: $e");
      return false;
    }
  }

  // Fetch student data from Firestore by email
  Future<StudentModel?> getStudentByEmail(String email) async {
    try {
      QuerySnapshot querySnapshot = await _firestore
          .collection('users')
          .doc('user_roles')
          .collection('students')
          .where('email', isEqualTo: email)
          .limit(1)
          .get();

      if (querySnapshot.docs.isNotEmpty) {
        var doc = querySnapshot.docs.first;
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

        return StudentModel(
          email: email,
          name: data['name'] ?? '',
          rollNo: data['roll_no'],
          feePaid: data['fee_paid'] ?? false,
          busCardId: data['bus_card_id'],
        );
      } else {
        print("No student found with email: $email");
      }
    } catch (e) {
      print("Error fetching student: $e");
    }
    return null;
  }

  Future<bool> saveStudentToHive(String email) async {
    try {
      var studentDoc = await getStudentByEmail(email);
      if (studentDoc != null) {
        // Ensure the box is open
        final box = await _getStudentBox();

        // Check if the student already exists in Hive, and delete if it does
        if (box.containsKey('current_student')) {
          box.delete('current_student');
        }

        // Save the new student document (or overwrite the existing one)
        box.put('current_student', studentDoc);
        return true; // Indicate success
      } else {
        print("Student not found");
        return false; // Indicate failure (student not found)
      }
    } catch (e) {
      print("Error saving student to Hive: $e");
      return false; // Return false if any error occurs
    }
  }

// Helper method to open or get the Hive box for student
  Future<Box<StudentModel>> _getStudentBox() async {
    if (!Hive.isBoxOpen('studentBox')) {
      await Hive.openBox<StudentModel>('studentBox');
    }
    return Hive.box<StudentModel>('studentBox');
  }

// Retrieve the current student from Hive
  Future<StudentModel?> getCurrentStudent() async {
    try {
      // Ensure the box is open
      final box = await _getStudentBox();
      return box.get('current_student');
    } catch (e) {
      print("Error fetching student from Hive: $e");
      return null;
    }
  }
}
