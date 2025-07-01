import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/screens/common/authentication/forgot_password.dart';
import 'package:ntu_ride_pilot/screens/common/help/driver/driver_help_signin.dart';
import 'package:ntu_ride_pilot/services/driver/driver_auth.dart';

class DriverSignInScreen extends StatefulWidget {
  const DriverSignInScreen({super.key});

  @override
  State<DriverSignInScreen> createState() => _DriverSignInScreenState();
}

class _DriverSignInScreenState extends State<DriverSignInScreen> {
  bool _passwordVisible = false;
  bool _isEmailLoading = false; // For email/password sign-in
  bool _isGoogleLoading = false; // For Google sign-in
  final _formKey = GlobalKey<FormState>();

  TextEditingController emailController = TextEditingController();
  TextEditingController passwordController = TextEditingController();

  final DriverAuthService _driverAuthService = Get.put(DriverAuthService());

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  // Email/Password Sign-In
  void _signIn() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() {
        _isEmailLoading = true; // Set email loading indicator true
      });

      await _driverAuthService.signIn(
          emailController.text.trim(), passwordController.text.trim(), context);

      setState(() {
        _isEmailLoading = false; // Hide email loading indicator after sign-in
      });
    }
  }

  // Google Sign-In
  void _signInWithGoogle() async {
    setState(() {
      _isGoogleLoading = true; // Set Google loading indicator true
    });

    await _driverAuthService.signInWithGoogle(context);

    setState(() {
      _isGoogleLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Driver Login',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            IconButton(
              icon: const Icon(Icons.help_outline),
              onPressed: () {
                Get.to(DriverSignInHelpScreen());
              },
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Welcome back you've been missed!",
                  style: TextStyle(fontSize: 16)),
              const SizedBox(height: 16),

              Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your email';
                        }
                        String emailPattern =
                            r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
                        if (!RegExp(emailPattern).hasMatch(value)) {
                          return 'Please enter a valid email address';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: passwordController,
                      obscureText: !_passwordVisible,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _passwordVisible
                                ? Icons.visibility
                                : Icons.visibility_off,
                          ),
                          onPressed: () {
                            setState(() {
                              _passwordVisible = !_passwordVisible;
                            });
                          },
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your password';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Sign-In Buttons
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Google Sign-In Button
                  ElevatedButton.icon(
                    onPressed: _isGoogleLoading ? null : _signInWithGoogle,
                    icon: Image.asset(
                      'assets/pictures/google_logo.png',
                      width: 20.0,
                    ),
                    label: _isGoogleLoading
                        ? const Text('Signing in with Google...')
                        : const Text('Sign in with Google'),
                    style: ElevatedButton.styleFrom(
                      side: BorderSide(color: Colors.grey.shade300),
                      padding: EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Divider(
                          color: Colors.grey.shade500, // Divider color
                          thickness: 1, // Divider thickness
                          endIndent:
                          10, // Space between divider and text on the right
                        ),
                      ),
                      Center(
                        child: Text(
                          'or',
                          style: TextStyle(color: Colors.grey, fontSize: 18),
                        ),
                      ),
                      Expanded(
                        child: Divider(
                          color: Colors.grey.shade500, // Divider color
                          thickness: 1, // Divider thickness
                          indent:
                          10, // Space between divider and text on the left
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Email/Password Sign-In Button
                  TextButton(
                    onPressed: _isEmailLoading ? null : _signIn,
                    style: ElevatedButton.styleFrom(
                      disabledBackgroundColor: Colors.grey,
                    ),
                    child: _isEmailLoading
                        ? const Text('Signing In...')
                        : const Text('Sign In'),
                  ),
                  const SizedBox(height: 16),

                  // Forgot Password Link
                  Center(
                    child: GestureDetector(
                      onTap: () {
                        Get.to(() => ForgotPasswordScreen(),
                            transition: Transition.rightToLeft);
                      },
                      child: const Text('Forgot Password?'),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
