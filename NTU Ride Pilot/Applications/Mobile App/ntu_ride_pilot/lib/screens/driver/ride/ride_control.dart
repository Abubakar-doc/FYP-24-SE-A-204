import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:hive/hive.dart';
import 'package:intl/intl.dart';
import 'package:ntu_ride_pilot/controllers/ride_control_controller.dart';
import 'package:ntu_ride_pilot/model/bus_card/bus_card.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/screens/common/help/driver/driver_help_ride_control.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/start_ride.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/widget/ride_details_modal.dart';
import 'package:ntu_ride_pilot/services/ride/live_location.dart';
import 'package:ntu_ride_pilot/services/ride/ride_service.dart';
import 'package:ntu_ride_pilot/themes/app_colors.dart';
import 'package:ntu_ride_pilot/utils/utils.dart';
import 'package:ntu_ride_pilot/widget/alert_dialog/alert_dialog.dart';
import 'package:ntu_ride_pilot/widget/detail_row/detail_row.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:ntu_ride_pilot/services/route/route_service.dart';
import 'widget/bus_card_verification_widget.dart';

class RideControlScreen extends StatefulWidget {
  const RideControlScreen({super.key});

  @override
  State<RideControlScreen> createState() => _RideControlScreenState();
}

class _RideControlScreenState extends State<RideControlScreen> {
  final RideControlController controller = Get.put(RideControlController());
  final RideService _rideService = RideService();
  final RouteService _routeService = RouteService();
  RideModel? _currentRide;
  RouteModel? _currentRoute;
  bool _isLoading = true;
  bool _isProcessing = false;
  String _buttonProgressText = '';
  String _formattedETA = 'N/A';
  String _nextStopName = 'N/A';

  @override
  void initState() {
    super.initState();
    _loadRideData();
    _startRideETAStream();
  }

  void _startRideETAStream() {
    final rideBox = Hive.box<RideModel>('rides');

    // Listen to changes for the 'currentRide' key
    rideBox.watch(key: 'currentRide').listen((event) {
      if (event.value is RideModel) {
        final updatedRide = event.value as RideModel;
        final eta = updatedRide.etaNextStop;
        final stopName = updatedRide.nextStopName ?? 'N/A';

        // Format ETA as 8:00 AM/PM
        final DateFormat formatter = DateFormat('h:mm a');
        final formattedETA = eta != null ? formatter.format(eta) : 'N/A';

        // Update the state with the new values to refresh the UI
        setState(() {
          _formattedETA = formattedETA;
          _nextStopName = stopName;
        });
      } else {
        print('No ride data found in the box!');
      }
    });
  }

  Future<void> _loadRideData() async {
    try {
      final ride = await _rideService.fetchRideFromHive();
      if (ride != null) {
        final route = await _routeService.getRouteById(ride.routeId);
        setState(() {
          _currentRide = ride;
          _currentRoute = route;
          _isLoading = false;
        });
      } else {
        setState(() {
          _currentRide = null;
          _currentRoute = null;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleRideStatus() async {
    if (_currentRide == null) return;

    // Determine the action based on the current ride status.
    final bool isRideInProgress = _currentRide!.rideStatus == 'inProgress';
    final String action = isRideInProgress ? 'End' : 'Start';

    // Show the confirmation dialog using the CustomAlertDialog widget.
    final bool confirm = (await showDialog<bool>(
          context: context,
          builder: (context) {
            return CustomAlertDialog(
              title: '$action Ride?',
              message: 'Are you sure you want to $action this ride?',
              onCancel: () => Navigator.of(context).pop(false),
              onConfirm: () => Navigator.of(context).pop(true),
              yesColor: Colors.blue,
            );
          },
        )) ??
        false;

    if (!confirm) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      if (isRideInProgress) {
        // Ending the ride.
        setState(() {
          _buttonProgressText = 'Ending Ride...';
        });
        await _rideService.endRide(_currentRide!, context);
        SnackbarUtil.showSuccess("Success", "Ride ended successfully.");
        // After ending the ride, navigate back to the StartRideScreen.
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => StartRideScreen()),
          (Route<dynamic> route) => false,
        );
      } else {
        // Starting the ride.
        setState(() {
          _buttonProgressText = 'Starting Ride...';
        });
        await _rideService.startRide(_currentRide!, _currentRoute!, context);
        SnackbarUtil.showSuccess("Success", "Ride started successfully.");
      }
    } catch (e) {
      print('Error toggling ride status: $e');
      SnackbarUtil.showError("Error", "Please try again.");
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Future<void> _cancelRide() async {
    if (_currentRide == null) return;

    setState(() {
      _isProcessing = true;
      _buttonProgressText = 'Cancelling Ride...';
    });

    try {
      // Cancel the ride in Firestore and clear local Hive storage
      await _rideService.cancelRide(_currentRide!, context);

      // Stop live location updates
      LiveLocationService liveLocationService = LiveLocationService(context);
      liveLocationService.stopPeriodicLocationUpdates();

      // Navigate to the StartRideScreen after the ride is canceled
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => StartRideScreen()),
        (Route<dynamic> route) => false, // This removes all previous routes
      );
    } catch (e) {
      print('Error cancelling ride: $e');
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Future<bool> _showCancelConfirmationDialog() async {
    return (await showDialog<bool>(
          context: context,
          builder: (context) {
            return CustomAlertDialog(
              onCancel: () => Navigator.of(context).pop(false),
              onConfirm: () => Navigator.of(context).pop(true),
              title: 'Cancel Ride?',
              message: 'Are you sure you want to cancel this ride?',
            );
          },
        )) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final rawStatus = _currentRide?.rideStatus ?? 'idle';
    String rideStatusDisplay;
    switch (rawStatus) {
      case 'inProgress':
        rideStatusDisplay = 'In Progress';
        break;
      case 'completed':
        rideStatusDisplay = 'Completed';
        break;
      default:
        rideStatusDisplay = 'Idle';
        break;
    }

    final bool isRideInProgress = (rawStatus == 'inProgress');

    // If we're processing, show the progress text in the button
    // otherwise show Start Ride or End Ride
    String buttonText;
    if (_isProcessing) {
      buttonText = _buttonProgressText;
    } else {
      buttonText = isRideInProgress ? 'End Ride' : 'Start Ride';
    }

    // Wrap entire UI in WillPopScope to intercept back button
    return WillPopScope(
      onWillPop: () async {
        // If there's no ride or if we're already processing, just pop
        if (_currentRide == null || _isProcessing) {
          return true;
        }
        // Otherwise, ask user if they want to cancel
        final confirm = await _showCancelConfirmationDialog();
        if (confirm) {
          await _cancelRide();
          // Return false so we don't do a double-pop,
          // because _cancelRide() already called pop()
          return false;
        } else {
          return false; // user pressed "No"
        }
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            onPressed: () async {
              // Show the cancel confirmation dialog
              final confirm = await _showCancelConfirmationDialog();
              if (confirm) {
                await _cancelRide();
              }
            },
            icon: Icon(Icons.arrow_back),
          ),
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Skeletonizer(
                enabled: _isLoading,
                child: Text(
                  '${_currentRide?.busId ?? 'N/A'} - ${_currentRoute?.name ?? 'N/A'}'
                              .length >
                          25
                      ? '${'${_currentRide?.busId ?? 'N/A'} - ${_currentRoute?.name ?? 'N/A'}'.substring(0, 22)}...'
                      : '${_currentRide?.busId ?? 'N/A'} - ${_currentRoute?.name ?? 'N/A'}',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              const SizedBox(
                width: 5,
              ),
              IconButton(
                icon: const Icon(Icons.help_outline),
                onPressed: () {
                  Get.to(const DriverRideControlHelpScreen());
                },
              ),
            ],
          ),
        ),
        body: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final screenHeight = constraints.maxHeight;

              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Bus Card Verification',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: screenHeight * 0.4,
                      width: double.infinity,
                      child: BusCardVerificationWidget(
                        controller: controller,
                        rideService: _rideService,
                      ),
                    ),
                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Ride Details',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            // handle show more if needed
                          },
// Inside your widget
                          child: GestureDetector(
                            onTap: () async {
                              // Open both boxes up front
                              final rideBox =
                                  await Hive.openBox<RideModel>('rides');
                              final busCardBox =
                                  await Hive.openBox<BusCardModel>('bus_cards');

                              // Show the modal when the button is tapped
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor:
                                    Theme.of(context).scaffoldBackgroundColor,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.vertical(
                                      top: Radius.circular(16)),
                                ),
                                builder: (_) {
                                  return RideDetailsModal(
                                    rideBox: rideBox,
                                    busCardBox: busCardBox,
                                  );
                                },
                              );
                            },
                            child: const Text(
                              'show more',
                              style: TextStyle(
                                color: Colors.blue,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Skeletonizer(
                      enabled: _isLoading,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16.0),
                        decoration: BoxDecoration(
                          color: theme.brightness == Brightness.dark
                              ? DarkInputFieldFillColor
                              : LightInputFieldFillColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            DetailRow(
                              title: 'Ride Status',
                              value: rideStatusDisplay,
                            ),
                            const Divider(color: Colors.grey),
                            DetailRow(
                              title: 'Next Stop',
                              value: _nextStopName,
                            ),
                            const Divider(color: Colors.grey),
                            DetailRow(
                              title: 'Next Stop ETA',
                              value: _formattedETA,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: _isProcessing ? null : _toggleRideStatus,
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            isRideInProgress ? Colors.red : Colors.blue,
                        disabledBackgroundColor: Colors.grey,
                      ),
                      child: Text(buttonText),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
