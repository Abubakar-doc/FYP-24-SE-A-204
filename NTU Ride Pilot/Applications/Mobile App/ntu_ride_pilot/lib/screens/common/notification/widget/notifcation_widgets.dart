import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/model/notification/notification.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:url_launcher/url_launcher.dart';

class NotificationList extends StatelessWidget {
  final ScrollController scrollController;
  final Map<String, List<NotificationModel>> groupedNotifications;
  final bool isLoadingMore;
  final bool hasMore;
  final ThemeData theme;
  final bool isLoading;
  final String Function(DateTime) formatTimestamp;

  const NotificationList({
    super.key,
    required this.scrollController,
    required this.groupedNotifications,
    required this.isLoadingMore,
    required this.hasMore,
    required this.theme,
    required this.isLoading,
    required this.formatTimestamp,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: scrollController,
      reverse: true,
      itemCount: groupedNotifications.keys.length + (hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == groupedNotifications.keys.length && hasMore) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: isLoadingMore
                  ? const CircularProgressIndicator()
                  : const Text(''),
            ),
          );
        }

        final dateLabel = groupedNotifications.keys.toList()[index];
        final notificationsForDate = groupedNotifications[dateLabel] ?? [];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Center(
                child: Text(
                  dateLabel,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: theme.brightness == Brightness.dark
                        ? DarkhintTextColor
                        : LighthintTextColor,
                  ),
                ),
              ),
            ),
            ...notificationsForDate.map((notification) {
              return NotificationItem(
                notification: notification,
                theme: theme,
                isLoading: isLoading,
                formatTimestamp: formatTimestamp,
              );
            }).toList(),
          ],
        );
      },
    );
  }
}

class NotificationItem extends StatelessWidget {
  final NotificationModel notification;
  final ThemeData theme;
  final bool isLoading;
  final String Function(DateTime) formatTimestamp;

  const NotificationItem({
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

    return GestureDetector(
      onTap: () {
        // Handle the tap to open the media or show more details
      },
      child: Card(
        margin: const EdgeInsets.symmetric(vertical: 10),
        color: theme.brightness == Brightness.dark
            ? DarkCardFillColor
            : LightCardFillColor,
        child: ListTile(
          title: Row(
            children: [
              isLoading
                  ? _buildImageSkeleton(height: 50, width: 50)
                  : Image.asset(
                      'assets/pictures/National_Textile_University_Logo.png',
                      height: 50,
                    ),
              const SizedBox(width: 8),
              Text(
                notification.title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(notification.message),
              const SizedBox(height: 8),
              if (mediaLinks.isNotEmpty) ...[
                // Get all images first
                ..._buildImageGrid(context, mediaLinks),

                // PDF links
                ...mediaLinks
                    .where((link) => (link as String).endsWith('.pdf'))
                    .map(
                      (pdfLink) => Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: GestureDetector(
                          onTap: () async {
                            final url = pdfLink as String;
                            try {
                              await launch(url);
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text('Could not open PDF')),
                              );
                            }
                          },
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.picture_as_pdf,
                                  color: Colors.red),
                              const SizedBox(width: 8),
                              Text(
                                'View PDF',
                                style: TextStyle(
                                  color: Colors.blue,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(),
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
      ),
    );
  }

  Widget _buildImageWidget(String imageUrl,
      {double? height, double? width, BoxFit? fit}) {
    return CachedNetworkImage(
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
      errorWidget: (context, url, error) => Container(
        child: const Icon(Icons.error),
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

  void _showImageViewer(BuildContext context, List<dynamic> images) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
              title: Text(
            notification.title,
          )),
          body: PhotoViewGallery.builder(
            itemCount: images.length,
            builder: (context, index) {
              return PhotoViewGalleryPageOptions(
                imageProvider: CachedNetworkImageProvider(images[index]),
                minScale: PhotoViewComputedScale.contained,
                maxScale: PhotoViewComputedScale.covered,
                heroAttributes: PhotoViewHeroAttributes(tag: images[index]),
              );
            },
            scrollPhysics: BouncingScrollPhysics(),
            backgroundDecoration: BoxDecoration(
              color: Colors.black,
            ),
            pageController: PageController(initialPage: 0),
          ),
          floatingActionButton: FloatingActionButton(
            onPressed: () async {
              String imageUrl =
                  images[0]; // You can get the URL based on current index
              await _downloadImage(imageUrl, context);
            },
            child: Icon(Icons.download),
          ),
        ),
      ),
    );
  }

  Future<void> _downloadImage(String url, BuildContext context) async {}

  List<Widget> _buildImageGrid(BuildContext context, List<dynamic> mediaLinks) {
    final images = mediaLinks
        .where((link) =>
            (link as String).endsWith('.jpg') ||
            (link as String).endsWith('.png'))
        .toList();

    if (images.isEmpty) return [];

    if (images.length == 1) {
      // For a single image, show it in full width and on tap, show it in the image viewer
      return [
        GestureDetector(
          onTap: () {
            _showImageViewer(context, images);
          },
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: _buildImageWidget(
              images[0] as String,
              width: double.infinity,
              height: 300,
              fit: BoxFit.cover,
            ),
          ),
        )
      ];
    } else {
      // For multiple images, show them in a grid
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
            onTap: () {
              _showImageViewer(context, images);
            },
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _buildImageWidget(
                images[i] as String,
                width: 100,
                height: 100,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
      ];
    }
  }
}
