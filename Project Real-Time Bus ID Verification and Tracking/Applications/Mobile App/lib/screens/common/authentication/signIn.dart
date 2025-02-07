import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtbivt/screens/common/authentication/forgot_password.dart';
import 'package:rtbivt/screens/common/help/help_signin.dart';
import 'package:rtbivt/services/authentication.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  bool _passwordVisible = false;
  bool _isLoading = false; // Loading state
  final _formKey = GlobalKey<FormState>(); // Form key for validation

  TextEditingController emailController = TextEditingController();
  TextEditingController passwordController = TextEditingController();

  final AuthService _authService = Get.put(AuthService());

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  // Sign-in method that calls the AuthService's signIn
  void _signIn() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() {
        _isLoading = true;
      });

      await _authService.signIn(
        emailController.text.trim(),
        passwordController.text.trim(),
      );

      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Sign In',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.help_outline),
                    onPressed: () {
                      Get.to(SignInHelpScreen());
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text('Enter your credentials to sign in',
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
                        // Regular expression to validate email format
                        String emailPattern =
                            r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
                        RegExp regExp = RegExp(emailPattern);

                        if (!regExp.hasMatch(value)) {
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

              // Sign-In Button
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextButton(
                    onPressed: _isLoading ? null : _signIn,
                    child: _isLoading
                        ? const Text('Signing In...')
                        : const Text('Sign In'),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: GestureDetector(
                      onTap: () {
                        Get.to(() => ForgotPasswordScreen());
                      },
                      child: const Text('Forgot Password?'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
