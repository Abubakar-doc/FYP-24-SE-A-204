import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/driver/authentication/driver_signIn.dart';
import 'package:ntu_ride_pilot/screens/student/authentication/student_signIn.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  _WelcomeScreenState createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                children: [
                  StudentPage(),
                  DriverPage(),
                ],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                2, // Adjusted to match the number of pages
                    (index) => GestureDetector(
                  onTap: () {
                    _pageController.animateToPage(
                      index,
                      duration: Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  },
                  child: AnimatedContainer(
                    duration: Duration(milliseconds: 300),
                    margin: EdgeInsets.symmetric(horizontal: 4),
                    height: 10,
                    width: _currentPage == index ? 20 : 10,
                    decoration: BoxDecoration(
                      color: _currentPage == index ? Colors.blue : Colors.grey,
                      borderRadius: BorderRadius.circular(5),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () {
                    if (_currentPage == 0) {
                      // Navigate to Student Sign-In Screen
                      Get.to(() => StudentSignInScreen(),
                          transition: Transition.rightToLeft);
                    } else {
                      // Navigate to Driver Sign-In Screen
                      Get.to(() => DriverSignInScreen(),
                          transition: Transition.rightToLeft);
                    }
                  },
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.blue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    _currentPage == 0 ? "Continue as Student" : "Continue as Driver",
                    style: TextStyle(fontSize: 18, color: Colors.white),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Student Page - Features for Students
class StudentPage extends StatelessWidget {
  const StudentPage({super.key});

  @override
  Widget build(BuildContext context) {
    return WelcomePage(
      title: "Your safety is our priority",
      description:
      "Track your university buses in real-time, receive important transport announcements, and ensure hassle-free commuting.",
      imagePath: "assets/pictures/student.png",
      roleLabel: "Student",
    );
  }
}

// Driver Page - Features for Drivers
class DriverPage extends StatelessWidget {
  const DriverPage({super.key});

  @override
  Widget build(BuildContext context) {
    return WelcomePage(
      title: "Smoothly verify and operate",
      description:
      "Share live bus location, verify student cards, and keep students informed with updates for a smooth transportation experience.",
      imagePath: "assets/pictures/driver.png",
      roleLabel: "Driver",
    );
  }
}

// Generic Welcome Page Widget with top logo and role row
class WelcomePage extends StatelessWidget {
  final String title;
  final String description;
  final String imagePath;
  final String roleLabel;

  const WelcomePage({
    super.key,
    required this.title,
    required this.description,
    required this.imagePath,
    required this.roleLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        children: [
          SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/pictures/National_Textile_University_Logo.png',
                height: 40,
              ),
              SizedBox(width: 8),
              Text(
                roleLabel,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Spacer(),
          Image.asset(
            imagePath,
            height: 200,
          ),
          Spacer(),
          Text(
            title,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 16),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          Spacer(),
        ],
      ),
    );
  }
}
