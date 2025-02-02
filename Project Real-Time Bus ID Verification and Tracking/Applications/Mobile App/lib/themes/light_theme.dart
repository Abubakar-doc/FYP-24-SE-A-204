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
    bodyLarge: TextStyle(color: lightTextColor, fontSize: 18),
    bodyMedium: TextStyle(color: Colors.black54, fontSize: 16),
  ),
  textButtonTheme: TextButtonThemeData(
    style: ButtonStyle(
      foregroundColor: MaterialStateProperty.all(textButtonColor),
      backgroundColor: MaterialStateProperty.all(primaryColor),
      shape: MaterialStateProperty.all(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      textStyle: MaterialStateProperty.all(
        TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
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
