import 'package:flutter/material.dart';

class CustomDrawerHeader extends StatelessWidget {
  final bool isColapsed;

  const CustomDrawerHeader({
    super.key,
    required this.isColapsed,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      height: 60,
      width: double.infinity,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            'assets/pictures/National_Textile_University_Logo.png',
            height: 50,
          ),
          if (isColapsed) const SizedBox(width: 10),
          if (isColapsed)
            const Expanded(
              flex: 3,
              child: Text(
                'NTU Ride Pilot',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                ),
                maxLines: 1,
              ),
            ),
        ],
      ),
    );
  }
}
