import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/services/common/media/media_service.dart';
import 'package:ntu_ride_pilot/services/common/permission/media_permission.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:ntu_ride_pilot/widget/image_viewer/image_viewer.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:url_launcher/url_launcher.dart';

class NotificationItem extends StatelessWidget {
  final NotificationModel notification;
  final ThemeData theme;
  final bool isLoading;
  final String Function(DateTime) formatTimestamp;
  final MediaService _mediaService = MediaService();

  NotificationItem({
    super.key,
    required this.notification,
    required this.theme,
    required this.isLoading,
    required this.formatTimestamp,
  });

  @override
  Widget build(BuildContext context) {
    final mediaLinks = notification.mediaLinks ?? [];
    final timestamp = notification.createdAt;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 10),
      color: theme.brightness == Brightness.dark
          ? DarkCardFillColor
          : LightCardFillColor,
      child: ListTile(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                notification.title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
            IconButton(
                icon: const Icon(Icons.share),
                onPressed: () async {
                  await _mediaService.shareNotification(notification);
                }),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Text(notification.message),
            _buildMessageWithLinks(notification.message, context),
            const SizedBox(height: 8),
            if (mediaLinks.isNotEmpty) ...[
              // Get all images first
              ..._buildImageGrid(context, mediaLinks),

              // PDF links
              ...mediaLinks.where((link) => (link).endsWith('.pdf')).map(
                (pdfLink) {
                  final url = pdfLink;
                  final fileName = Uri.parse(url)
                      .pathSegments
                      .last; // Get file name from URL
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: GestureDetector(
                      onTap: () async {
                        try {
                          await launch(url);
                        } catch (e) {
                          SnackbarUtil.showError('Error', 'Could not open PDF');
                        }
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.picture_as_pdf, color: Colors.red),
                          const SizedBox(width: 8),
                          // Use Text widget with overflow handling
                          Expanded(
                            child: Text(
                              fileName, // Display the PDF file name
                              style: TextStyle(
                                color: Colors.blue,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow:
                                  TextOverflow.ellipsis, // Handle long text
                              maxLines: 1, // Ensure it stays on one line
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.bottomRight,
              child: Text(
                formatTimestamp(timestamp),
                style: TextStyle(
                  color: theme.brightness == Brightness.dark
                      ? DarkhintTextColor
                      : LighthintTextColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageWidget(String imageUrl,
      {double? height, double? width, BoxFit? fit, required String heroTag}) {
    return Hero(
      tag: heroTag,
      child: CachedNetworkImage(
        imageUrl: imageUrl,
        width: width,
        height: height,
        fit: fit ?? BoxFit.cover,
        placeholder: (context, url) => Stack(
          alignment: Alignment.center,
          children: [
            _buildImageSkeleton(height: height, width: width),
          ],
        ),
        errorWidget: (context, url, error) => const Icon(Icons.error),
      ),
    );
  }

  Widget _buildImageSkeleton({double? height, double? width}) {
    return Skeletonizer(
      enabled: true,
      child: Container(
        height: height,
        width: width,
        color: Colors.grey[300],
      ),
    );
  }

  void _showImageViewer(
      BuildContext context, List<dynamic> images, int initialIndex) {
    Get.to(
      ImageViewer(
        images: images,
        initialIndex: initialIndex,
        mediaService: _mediaService,
        mediaPermission: MediaPermission(),
      ),
      transition: Transition.fadeIn,
      duration: const Duration(milliseconds: 300),
    );
  }

  List<Widget> _buildImageGrid(BuildContext context, List<dynamic> mediaLinks) {
    final images = mediaLinks
        .where((link) =>
            (link as String).endsWith('.jpg') || (link).endsWith('.png'))
        .toList();

    if (images.isEmpty) return [];

    if (images.length == 1) {
      // 1 image: full width square
      return [
        GestureDetector(
          onTap: () => _showImageViewer(context, images, 0),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: 1,
              child: _buildImageWidget(
                images[0] as String,
                fit: BoxFit.cover,
                heroTag: images[0],
              ),
            ),
          ),
        ),
      ];
    } else if (images.length == 2) {
      // 2 images: row of two squares
      return [
        Row(
          children: List.generate(2, (i) {
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                    right: i == 0 ? 4 : 0, left: i == 1 ? 4 : 0),
                child: GestureDetector(
                  onTap: () => _showImageViewer(context, images, i),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: _buildImageWidget(
                        images[i] as String,
                        fit: BoxFit.cover,
                        heroTag: images[i],
                      ),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ];
    } else if (images.length == 3) {
      // 3 images: first row one big image, second row two smaller side-by-side squares
      return [
        GestureDetector(
          onTap: () => _showImageViewer(context, images, 0),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: 1,
              child: _buildImageWidget(
                images[0] as String,
                fit: BoxFit.cover,
                heroTag: images[0],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: List.generate(2, (i) {
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                    right: i == 0 ? 4 : 0, left: i == 1 ? 4 : 0),
                child: GestureDetector(
                  onTap: () => _showImageViewer(context, images, i + 1),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: _buildImageWidget(
                        images[i + 1] as String,
                        fit: BoxFit.cover,
                        heroTag: images[i + 1],
                      ),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ];
    } else if (images.length == 4) {
      // 4 images: 2 x 2 grid of equal squares
      return [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: 4,
          itemBuilder: (context, i) => GestureDetector(
            onTap: () => _showImageViewer(context, images, i),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 1,
                child: _buildImageWidget(
                  images[i] as String,
                  fit: BoxFit.cover,
                  heroTag: images[i],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
      ];
    } else {
      // More than 4 images fallback to grid with 3 columns
      return [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: images.length,
          itemBuilder: (context, i) => GestureDetector(
            onTap: () => _showImageViewer(context, images, i),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _buildImageWidget(
                images[i] as String,
                width: 100,
                height: 100,
                heroTag: images[i],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
      ];
    }
  }

  Text _buildMessageWithLinks(String message, BuildContext context) {
    final textSpans = <TextSpan>[];
    int currentIndex = 0;

    final urlRegExp = RegExp(r'(https?://[^\s]+)');

    final matches = urlRegExp.allMatches(message);

    if (matches.isEmpty) {
      return Text(message);
    }

    for (final match in matches) {
      // Add any text before the match
      if (match.start > currentIndex) {
        textSpans.add(TextSpan(
          text: message.substring(currentIndex, match.start),
        ));
      }

      // Extract the URL from the match
      String url = match.group(1)!;
      // Make sure the URL has a valid scheme
      if (!url.startsWith(RegExp(r'https?://'))) {
        url = 'https://$url';
      }

      // Add the clickable URL text
      textSpans.add(
        TextSpan(
          text: url,
          style: TextStyle(
            color: Colors.blue,
          ),
          recognizer: TapGestureRecognizer()
            ..onTap = () async {
              try {
                final uri = Uri.parse(url);
                await launchUrl(uri);
              } catch (e) {
                SnackbarUtil.showError('Error', 'Error opening link!');
              }
            },
        ),
      );

      // Update the current index to continue after the link
      currentIndex = match.end;
    }

    // Add any remaining text after the last match
    if (currentIndex < message.length) {
      textSpans.add(
        TextSpan(
          text: message.substring(currentIndex),
        ),
      );
    }

    return Text.rich(
      TextSpan(children: textSpans),
    );
  }
}
