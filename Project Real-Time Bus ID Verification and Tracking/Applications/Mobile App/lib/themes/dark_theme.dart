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
      foregroundColor: MaterialStateProperty.all(textButtonColor),
      backgroundColor: MaterialStateProperty.all(primaryColor),
      shape: MaterialStateProperty.all(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      textStyle: MaterialStateProperty.all(
        TextStyle(fontWeight: FontWeight.bold, fontSize: 18, fontFamily: 'OpenSans'),
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
