import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:rtbivt/model/user.dart';

class UserService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<DocumentSnapshot<Map<String, dynamic>>?> getUserByEmail(String email) async {
    try {
      QuerySnapshot<Map<String, dynamic>> userQuery = await _firestore
          .collection("user")
          .where("email", isEqualTo: email.toLowerCase())
          .limit(1)
          .get();

      if (userQuery.docs.isNotEmpty) {
        return userQuery.docs.first;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  UserModel mapToUserModel(Map<String, dynamic> data) {
    return UserModel.fromMap(data);
  }
}
