import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ntu_ride_pilot/controllers/ride_control_controller.dart';
import 'package:ntu_ride_pilot/model/ride/ride.dart';
import 'package:ntu_ride_pilot/model/route/route.dart';
import 'package:ntu_ride_pilot/screens/common/help/driver/driver_help_ride_control.dart';
import 'package:ntu_ride_pilot/screens/driver/ride/start_ride.dart';
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
  String _buttonProgressText = ''; // "Starting Ride...", "Ending Ride...", or "Cancelling Ride..."

  @override
  void initState() {
    super.initState();
    _loadRideData();
  }

  /// Loads the current ride from Hive, and fetches the associated route.
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

  /// Toggles the ride's status between 'inProgress' and 'idle'/'completed'.
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
    )) ?? false;

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
        Get.off(StartRideScreen());
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


  /// Cancels the ride by deleting the Firestore doc and clearing the local Hive box.
  Future<void> _cancelRide() async {
    if (_currentRide == null) return;

    setState(() {
      _isProcessing = true;
      _buttonProgressText = 'Cancelling Ride...';
    });

    try {
      await _rideService.cancelRide(_currentRide!, context);
      // Pop the screen
      // Navigator.of(context).pop(true);
      Get.off(StartRideScreen());
    } catch (e) {
      print('Error cancelling ride: $e');
      setState(() {
        _isProcessing = false;
      });
    }
  }

  /// Displays a confirmation dialog for canceling the ride.
  Future<bool> _showCancelConfirmationDialog() async {
    return (await showDialog<bool>(
      context: context,
      builder: (context) {
        return CustomAlertDialog(
          onCancel: () => Navigator.of(context).pop(false),
          onConfirm: () => Navigator.of(context).pop(true), title: 'Cancel Ride?', message: 'Are you sure you want to cancel this ride?',
        );
      },
    )) ??
        false;
  }

  @override
  Widget build(BuildContext context) {
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
    final theme = Theme.of(context);

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
        body: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final screenHeight = constraints.maxHeight;

              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          onPressed: () async {
                            final confirm = await _showCancelConfirmationDialog();
                            if (confirm) {
                              await _cancelRide();
                            }
                          },
                          icon: Icon(Icons.arrow_back),
                        ),
                        Skeletonizer(
                          enabled: _isLoading,
                          child: Text(
                            'Bus ${_currentRide?.busId ?? 'N/A'} - ${_currentRoute?.name ?? 'N/A'}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.help_outline),
                          onPressed: () {
                            Get.to(const DriverRideControlHelpScreen());
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
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
                          child: const Text(
                            'show more',
                            style: TextStyle(
                              color: Colors.blue,
                              fontWeight: FontWeight.w600,
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
                            const DetailRow(
                              title: 'Next Stop',
                              value: 'Central Park',
                            ),
                            const Divider(color: Colors.grey),
                            const DetailRow(
                              title: 'ETA',
                              value: '9:20 AM',
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
