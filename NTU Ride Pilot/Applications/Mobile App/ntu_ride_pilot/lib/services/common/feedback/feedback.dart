import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';
import 'package:ntu_ride_pilot/model/driver/driver.dart';
import 'package:ntu_ride_pilot/model/student/student.dart';
import 'package:ntu_ride_pilot/services/common/media/media_service.dart';

class FeedbackService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final MediaService _mediaService = MediaService();

  // Simulated method for submitting feedback
  Future<bool> submitFeedback(
      String feedbackText, List<String>? imagePaths) async {
    try {
      // Retrieve current user data (driver or student) from Hive
      final driverBox = Hive.box<DriverModel>('driverBox');
      final studentBox = Hive.box<StudentModel>('studentBox');

      String? userIdentifier;
      String userType = "Unknown";

      // Check if a driver is logged in
      if (driverBox.containsKey('current_driver')) {
        var driver = driverBox.get('current_driver');
        userIdentifier = driver?.email;
        userType = "Driver"; // Identifying the user type as a driver
      }
      // Check if a student is logged in
      else if (studentBox.containsKey('current_student')) {
        var student = studentBox.get('current_student');
        userIdentifier = student?.rollNo;
        userType = "Student"; // Identifying the user type as a student
      }

      // If no user found, throw an error
      if (userIdentifier == null) {
        throw Exception("No user found");
      }

      // Cloudinary image upload (if images are provided)
      List<String>? mediaLinks;
      List<String>? mediaPublicIds;

      if (imagePaths != null && imagePaths.isNotEmpty) {
        final uploadedImages =
            await _mediaService.uploadImagesToCloudinary(imagePaths);
        mediaLinks = uploadedImages['urls'];
        mediaPublicIds = uploadedImages['publicIds'];
      }

      // Prepare the feedback data (without the title)
      final feedbackData = {
        // Conditionally add the relevant field based on user type
        if (userType == "Student") 'studentRollNo': userIdentifier,
        if (userType == "Driver") 'driverEmail': userIdentifier,
        'message': feedbackText,
        'createdAt': Timestamp.fromDate(DateTime.now()),
        'mediaLinks': mediaLinks ?? [],
        'mediaPublicIds': mediaPublicIds ?? [],
      };

      // Save to Firestore collection 'feedback' with auto-generated ID
      DocumentReference docRef =
          await _firestore.collection('feedback').add(feedbackData);

      // Log feedback to console (can be replaced with actual backend call)
      // print('Feedback submitted with ID: ${docRef.id}');

      return true;
    } catch (e) {
      // print('Error submitting feedback: $e');
      return false;
    }
  }
}
