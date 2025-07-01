import 'package:flutter/material.dart';
import 'package:skeletonizer/skeletonizer.dart';

class NotificationListLoadingPlaceholder extends StatelessWidget {
  const NotificationListLoadingPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final int itemCount = 6;

    return Scaffold(
      body: Skeletonizer(
        enabled: true,
        child: Container(
          color: theme.scaffoldBackgroundColor,
          width: double.infinity,
          height: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Flexible(
                child: SingleChildScrollView(
                  physics: const NeverScrollableScrollPhysics(),
                  reverse: true,
                  child: Column(
                    children: List.generate(
                        itemCount, (index) => _buildPlaceholderCard(theme)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholderCard(ThemeData theme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: theme.brightness == Brightness.dark
          ? Colors.grey[850]
          : Colors.grey[100],
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title skeleton
            Container(
              width: double.infinity,
              height: 20,
              color: theme.brightness == Brightness.dark
                  ? Colors.grey[700]
                  : Colors.grey[300],
              margin: const EdgeInsets.only(bottom: 8),
            ),
            // Message skeleton
            Container(
              width: double.infinity,
              height: 14,
              color: theme.brightness == Brightness.dark
                  ? Colors.grey[700]
                  : Colors.grey[300],
              margin: const EdgeInsets.only(bottom: 8),
            ),
            Container(
              width: double.infinity,
              height: 14,
              color: theme.brightness == Brightness.dark
                  ? Colors.grey[700]
                  : Colors.grey[300],
            ),
            const SizedBox(height: 12),
            // Media placeholder row (like images)
            Row(
              children: List.generate(3, (_) {
                return Container(
                  width: 80,
                  height: 80,
                  margin: const EdgeInsets.only(right: 8),
                  color: theme.brightness == Brightness.dark
                      ? Colors.grey[700]
                      : Colors.grey[300],
                );
              }),
            ),
            const SizedBox(height: 12),
            // Timestamp skeleton
            Align(
              alignment: Alignment.bottomRight,
              child: Container(
                width: 80,
                height: 12,
                color: theme.brightness == Brightness.dark
                    ? Colors.grey[700]
                    : Colors.grey[300],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
