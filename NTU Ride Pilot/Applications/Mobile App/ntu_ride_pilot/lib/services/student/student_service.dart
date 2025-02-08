import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';

class StudentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<StudentModel?> getStudentByEmail(String email) async {
    try {
      DocumentSnapshot doc = await _firestore
          .collection('users')
          .doc('user_roles')
          .collection('students')
          .doc(email)
          .get();

      if (doc.exists) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        return StudentModel(
          email: email,
          name: data['name'] ?? '',
          rollNo: data['roll_no'],
          feePaid: data['fee_paid'] ?? false,
          busCardId: data['bus_card_id'],
          busCardStatus: data['bus_card_status'],
        );
      }
    } catch (e) {
      print("Error fetching student: $e");
    }
    return null;
  }
}
