import 'package:flutter/material.dart';
import 'package:get/get.dart';

class RideControlController extends GetxController {
  final String lightThemeCard = 'assets/pictures/black_id_card.png';
  final String darkThemeCard = 'assets/pictures/white_id_card.png';
  final String greenCard = 'assets/pictures/green_id_card.png';
  final String redCard = 'assets/pictures/red_id_card.png';

  String _currentCardImage = '';

  String getImage(Brightness brightness) {
    return _currentCardImage.isNotEmpty
        ? _currentCardImage
        : brightness == Brightness.dark
            ? darkThemeCard
            : lightThemeCard;
  }

  void setCardImage(String imagePath) {
    _currentCardImage = imagePath;
    update();
  }

  void resetCardImage(Brightness brightness) {
    _currentCardImage =
        brightness == Brightness.dark ? darkThemeCard : lightThemeCard;
    update();
  }
}
