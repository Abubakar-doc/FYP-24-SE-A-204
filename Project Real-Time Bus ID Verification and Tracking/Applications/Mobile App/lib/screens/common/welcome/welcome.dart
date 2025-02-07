import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtbivt/screens/common/authentication/signIn.dart';

class WelcomeScreen extends StatefulWidget {
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
                  WelcomePageView(), // New Welcome Page
                  StudentPage(),
                  DriverPage(),
                ],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                3, // Updated to match the number of pages
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
                    if (_currentPage < 2) {
                      _pageController.nextPage(
                        duration: Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    } else {
                      Get.off(SignInScreen());
                    }
                  },
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.blue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    _currentPage < 2 ? "Next" : "Finish",
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

// Welcome Page - Introduces the app
class WelcomePageView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return WelcomePage(
      title: "NTU RIDE PILOT",
      description: "Stay connected with live bus tracking and important announcements. Travel smarter with real-time updates.",
      imagePath: "assets/pictures/National_Textile_University_Logo.png",
    );
  }
}

// Student Page - Features for Students
class StudentPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return WelcomePage(
      title: "For Students",
      description: "Track your university buses in real-time, receive important transport announcements, and ensure hassle-free commuting.",
      imagePath: "assets/pictures/student.png",
    );
  }
}

// Driver Page - Features for Drivers
class DriverPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return WelcomePage(
      title: "For Bus Staff",
      description: "Share live bus location, verify student cards, and keep students informed with updates for a smooth transportation experience.",
      imagePath: "assets/pictures/driver.png",
    );
  }
}

// Generic Welcome Page Widget
class WelcomePage extends StatelessWidget {
  final String title;
  final String description;
  final String imagePath;

  WelcomePage({
    required this.title,
    required this.description,
    required this.imagePath,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Spacer(),
          Image.asset(
            imagePath,
            height: 200,
          ),
          Spacer(),
          Text(
            title,
            style: TextStyle(
              fontSize: 24,
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
