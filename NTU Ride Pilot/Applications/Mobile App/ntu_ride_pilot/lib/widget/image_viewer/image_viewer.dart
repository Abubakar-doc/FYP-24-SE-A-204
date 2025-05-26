import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:ntu_ride_pilot/services/common/media/media_service.dart';
import 'package:ntu_ride_pilot/services/common/permission/media_permission.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';

class ImageViewer extends StatefulWidget {
  final List<dynamic> images;
  final int initialIndex;
  final MediaService mediaService;
  final MediaPermission mediaPermission;
  final bool enableSharing;
  final String? appBarTitle;

  const ImageViewer({
    super.key,
    required this.images,
    required this.initialIndex,
    required this.mediaService,
    required this.mediaPermission,
    this.enableSharing = true,
    this.appBarTitle,
  });

  @override
  State<ImageViewer> createState() => _ImageViewerState();
}

class _ImageViewerState extends State<ImageViewer> {
  late PageController _pageController;
  late int _currentPage;
  double _dragStartY = 0;

  @override
  void initState() {
    super.initState();
    _currentPage = widget.initialIndex;
    _pageController = PageController(initialPage: _currentPage);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _handleDownload() async {
    try {
      await widget.mediaService.downloadImage(widget.images[_currentPage], context);
      if (mounted) {
        SnackbarUtil.showSuccess('Downloaded', 'Image saved to gallery');
      }
    } catch (e) {
      if (e.toString().contains('Storage permission')) {
        MediaPermission.showPermissionDialog(context);
      } else if (mounted) {
        SnackbarUtil.showError('Error', 'Failed to save image: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.brightness == Brightness.dark
            ? darkBackgroundColor
            : LightCardFillColor,
        title: Text(
          widget.appBarTitle ?? '${_currentPage + 1} / ${widget.images.length}',
        ),
        actions: [
          if (widget.enableSharing) // Only show share button if enabled
            IconButton(
              icon: const Icon(Icons.share),
              onPressed: () async {
                try {
                  await widget.mediaService
                      .shareMedia(widget.images[_currentPage]);
                } catch (e) {
                  if (mounted) {
                    SnackbarUtil.showError('Error', 'Failed to share: $e');
                  }
                }
              },
            ),
          const SizedBox(width: 10),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: _handleDownload,
          ),
        ],
      ),
      body: GestureDetector(
        onVerticalDragStart: (details) {
          _dragStartY = details.globalPosition.dy;
        },
        onVerticalDragUpdate: (details) {
          final dragDistance = details.globalPosition.dy - _dragStartY;
          if (dragDistance.abs() > 30) {
            Navigator.of(context).pop();
          }
        },
        child: PhotoViewGallery.builder(
          itemCount: widget.images.length,
          builder: (context, index) {
            return PhotoViewGalleryPageOptions(
              imageProvider: CachedNetworkImageProvider(widget.images[index]),
              minScale: PhotoViewComputedScale.contained,
              maxScale: PhotoViewComputedScale.covered,
              heroAttributes:
              PhotoViewHeroAttributes(tag: widget.images[index]),
            );
          },
          scrollPhysics: const BouncingScrollPhysics(),
          backgroundDecoration: BoxDecoration(
              color: theme.brightness == Brightness.dark
                  ? darkBackgroundColor
                  : LightCardFillColor),
          pageController: _pageController,
          onPageChanged: (index) {
            setState(() {
              _currentPage = index;
            });
          },
        ),
      ),
    );
  }
}