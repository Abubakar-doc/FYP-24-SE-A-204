import 'package:flutter/material.dart';
import 'package:get/get.dart';

class RideControlController extends GetxController {
  final String lightThemeImage = 'assets/pictures/black_id_card.png';
  final String darkThemeImage = 'assets/pictures/white_id_card.png';

  String getImage(Brightness brightness) {
    return brightness == Brightness.dark ? darkThemeImage : lightThemeImage;
  }
}
