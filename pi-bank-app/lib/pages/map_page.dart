import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart';
import 'package:online_bank/constants.dart';
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final Completer<GoogleMapController> _controller = Completer();
  static const LatLng sourceLocation = LatLng(37.33500926, -122.03272188);
  static const LatLng destination = LatLng(37.33429383, -122.06600055);
  List<LatLng> polylineCoordinates = [];
  LocationData? currentLocation;
  StreamSubscription<LocationData>? locationSubscription;

  bool isMapInitialized = false;

  void getCurrentLocation() async {
    Location location = Location();

    try {
      final initialLocation = await location.getLocation();
      setState(() {
        currentLocation = initialLocation;
      });
      print(
          "Initial location: ${currentLocation?.latitude}, ${currentLocation?.longitude}");

      locationSubscription = location.onLocationChanged.listen((newLoc) async {
        if (!mounted) return;

        setState(() {
          currentLocation = newLoc;
        });

        if (isMapInitialized) {
          final mapController = await _controller.future;
          mapController.animateCamera(
            CameraUpdate.newCameraPosition(
              CameraPosition(
                target: LatLng(newLoc.latitude!, newLoc.longitude!),
                zoom: 13.5,
              ),
            ),
          );
        }
      });
    } catch (e) {
      print("Error getting location: $e");
    }
  }

  void getPolyPoints() async {
    try {
      PolylinePoints polylinePoints = PolylinePoints();
      PolylineResult result = await polylinePoints.getRouteBetweenCoordinates(
        request: PolylineRequest(
          origin:
              PointLatLng(sourceLocation.latitude, sourceLocation.longitude),
          destination: PointLatLng(destination.latitude, destination.longitude),
          mode: TravelMode.driving,
        ),
        googleApiKey: google_api_key,
      );

      if (result.points.isNotEmpty) {
        setState(() {
          polylineCoordinates.addAll(result.points
              .map((point) => LatLng(point.latitude, point.longitude)));
        });
      }
    } catch (e) {
      print("Error getting polylines: $e");
    }
  }

  @override
  void dispose() {
    locationSubscription?.cancel();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    getCurrentLocation();
    getPolyPoints();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(),
      body: SafeArea(
        child: Column(
          children: [
            MyAppBar(first_name: 'Proper Invest', second_name: 'Bank'),
            currentLocation == null
                ? Column(
                    children: [
                      SizedBox(height: 30),
                      const Center(child: CircularProgressIndicator()),
                    ],
                  )
                : Expanded(
                    child: GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: LatLng(
                          currentLocation!.latitude!,
                          currentLocation!.longitude!,
                        ),
                        zoom: 13.5,
                      ),
                      polylines: {
                        Polyline(
                          polylineId: const PolylineId("route"),
                          points: polylineCoordinates,
                          color: Colors.lightBlueAccent,
                          width: 6,
                        ),
                      },
                      markers: {
                        Marker(
                          markerId: const MarkerId("currentLocation"),
                          position: LatLng(
                            currentLocation!.latitude!,
                            currentLocation!.longitude!,
                          ),
                        ),
                        const Marker(
                          markerId: MarkerId("source"),
                          position: sourceLocation,
                        ),
                        const Marker(
                          markerId: MarkerId("destination"),
                          position: destination,
                        ),
                      },
                      onMapCreated: (mapController) {
                        if (!_controller.isCompleted) {
                          _controller.complete(mapController);
                        }
                        setState(() {
                          isMapInitialized = true;
                        });
                      },
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}
