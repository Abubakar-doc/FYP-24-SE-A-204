import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ntu_ride_pilot/screens/common/help/common/help_feedback.dart';
import 'package:ntu_ride_pilot/services/common/feedback/feedback.dart';
import 'package:ntu_ride_pilot/services/common/permission/media_permission.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _feedbackController = TextEditingController();
  bool _isLoading = false;
  List<XFile>? _imageFiles = [];

  final ImagePicker _picker = ImagePicker();
  final MediaPermission _mediaPermission = MediaPermission();
  final FeedbackService _feedbackService =
      FeedbackService();
  Future<void> _pickImages() async {
    final pickedFiles = await _picker.pickMultiImage();
    if (pickedFiles.length > 4) {
      // Show error snackbar if more than 4 images are selected
      SnackbarUtil.showError(
          "Image Limit Exceeded", "You can only select up to 4 images.");
    } else {
      setState(() {
        _imageFiles = pickedFiles; // Update image files
      });
    }
    }

  Future<void> _requestPermissionAndPickImages() async {
    final hasPermission = await _mediaPermission.checkStoragePermission();
    if (hasPermission) {
      _pickImages(); // If permission is granted, pick images
    } else {
      MediaPermission.showPermissionDialog(context); // If not, show the dialog
    }
  }

  void _submitFeedback() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final feedbackText = _feedbackController.text.trim();
    final imagePaths = _imageFiles?.map((file) => file.path).toList();

    // Call the FeedbackService to submit the feedback
    final isSuccess =
        await _feedbackService.submitFeedback(feedbackText, imagePaths);

    if (isSuccess) {
      // Show success snackbar
      SnackbarUtil.showSuccess("Feedback Submitted",
          "Your feedback has been successfully submitted.");
      Navigator.pop(context);
    } else {
      // Show error snackbar
      SnackbarUtil.showError("Submission Failed",
          "There was an issue submitting your feedback. Please try again.");
    }

    setState(() => _isLoading = false);
  }

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(

        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Feedback',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            IconButton(
              icon: const Icon(Icons.help_outline),
              onPressed: () {
                Get.to(FeedBackHelpScreen());
              },
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'We value your feedback. Please let us know what you think about our service.',
                    style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _feedbackController,
                    maxLines: 8,
                    decoration: const InputDecoration(
                      hintText: 'Please write your feedback here...',
                      hintStyle: TextStyle(color: Colors.grey),
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Feedback cannot be empty';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  GestureDetector(
                    onTap: _requestPermissionAndPickImages,
                    child: Container(
                      height: 150,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: theme.brightness == Brightness.dark
                            ? DarkInputFieldFillColor
                            : LightInputFieldFillColor,
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.image,
                                  size: 30, color: Colors.grey),
                              const SizedBox(width: 8),
                              const Text(
                                'Optional: Upload up to 4 images.',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (_imageFiles != null &&
                              _imageFiles!.isNotEmpty) ...[
                            Wrap(
                              spacing: 8.0,
                              children: _imageFiles!
                                  .map((file) => Image.file(
                                        File(file.path),
                                        width: 50,
                                        height: 50,
                                        fit: BoxFit.cover,
                                      ))
                                  .toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20), // Adds space to avoid overlap
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: _isLoading ? null : _submitFeedback,
                      style: ElevatedButton.styleFrom(
                        disabledBackgroundColor: Colors.grey,
                      ),
                      child: _isLoading
                          ? const Text('Submitting...')
                          : const Text('Submit'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
