import 'package:flutter/material.dart';
import 'app_colors.dart';

ThemeData lightTheme = ThemeData(
  brightness: Brightness.light,
  primaryColor: primaryColor,
  scaffoldBackgroundColor: lightBackgroundColor,
  fontFamily: 'OpenSans',
  colorScheme: ColorScheme.light(
    primary: primaryColor,
    onPrimary: textButtonColor,
    secondary: secondaryColor,
  ),
  appBarTheme: AppBarTheme(
    backgroundColor: lightBackgroundColor,
    elevation: 0,
    titleTextStyle: TextStyle(
      fontWeight: FontWeight.bold,
      color: lightTextColor,
      fontSize: 21,
    ),
    iconTheme: IconThemeData(color: lightTextColor),
  ),
  textTheme: TextTheme(
    bodyLarge: TextStyle(fontSize: 18),
    bodyMedium: TextStyle(fontSize: 16),
  ),
  textButtonTheme: TextButtonThemeData(
    style: ButtonStyle(
      foregroundColor: WidgetStateProperty.all(textButtonColor),
      backgroundColor: WidgetStateProperty.all(primaryColor),
      padding: WidgetStateProperty.all(EdgeInsets.symmetric(vertical: 16)),
      shape: WidgetStateProperty.all(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      textStyle: WidgetStateProperty.all(
        TextStyle(fontWeight: FontWeight.bold, fontSize: 18, fontFamily: 'OpenSans'),
      ),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: LightInputFieldFillColor,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide.none,
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide(
        color: Colors.red,
      ),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide.none,
    ),
    floatingLabelBehavior: FloatingLabelBehavior.auto,
    labelStyle: TextStyle(
      color: LighthintTextColor,
      fontWeight: FontWeight.bold,
    ),
  ),
);
