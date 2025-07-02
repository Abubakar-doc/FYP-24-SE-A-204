import 'package:flutter/material.dart';
import 'app_colors.dart';

ThemeData darkTheme = ThemeData(
  brightness: Brightness.dark,
  primaryColor: primaryColor,
  scaffoldBackgroundColor: darkBackgroundColor,
  fontFamily: 'OpenSans',
  colorScheme: ColorScheme.dark(
    primary: primaryColor,
    onPrimary: textButtonColor,
    secondary: secondaryColor,
  ),
  appBarTheme: AppBarTheme(
    backgroundColor: darkBackgroundColor,
    elevation: 0,
    titleTextStyle: TextStyle(
      fontWeight: FontWeight.bold,
      color: darkTextColor,
      fontSize: 21,
    ),
    iconTheme: IconThemeData(color: darkTextColor),
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
        TextStyle(
            fontWeight: FontWeight.bold, fontSize: 18, fontFamily: 'OpenSans'),
      ),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: DarkInputFieldFillColor, // Dark input background
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
      color: DarkhintTextColor,
      fontWeight: FontWeight.bold,
    ),
  ),
);
