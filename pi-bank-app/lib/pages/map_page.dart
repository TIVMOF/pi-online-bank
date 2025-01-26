import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:location/location.dart';
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';
import 'package:online_bank/utill/refresh_tokens.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final Completer<GoogleMapController> _controller = Completer();
  LocationData? currentLocation;
  StreamSubscription<LocationData>? locationSubscription;
  List<Map<String, dynamic>> _bankFacilities = [];
  bool isMapInitialized = false;
  String? _errorMessage;
  Set<Marker> _markers = {};
  double currentZoom = 13.5;

  Future<void> getCurrentLocation() async {
    Location location = Location();

    try {
      bool serviceEnabled = await location.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await location.requestService();

        if (serviceEnabled) {
          await getCurrentLocation();
          return;
        } else {
          throw Exception("Location services are disabled.");
        }
      }

      PermissionStatus permissionGranted = await location.hasPermission();
      if (permissionGranted == PermissionStatus.denied) {
        permissionGranted = await location.requestPermission();
        if (permissionGranted != PermissionStatus.granted) {
          throw Exception("Location permission is denied.");
        }
      }

      final initialLocation = await location.getLocation();
      setState(() {
        currentLocation = initialLocation;
      });

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
                zoom: currentZoom,
              ),
            ),
          );
        }
      });
    } catch (e) {
      print("Error getting location: $e");
    }
  }

  Future<void> getFacilities() async {
    try {
      await ensureAccessTokenValidity(context);

      final userId = await storage.read(key: 'userId');
      final accessToken = await storage.read(key: 'backendAccessToken');

      if (userId == null || accessToken == null) {
        throw Exception("User ID or access token is missing.");
      }

      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/bankFacilities'),
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> bankFacilities = json.decode(response.body);

        setState(() {
          _bankFacilities = bankFacilities
              .map((facility) => {
                    'Name': facility['Name'],
                    'Latitude': facility['Latitude'],
                    'Longitude': facility['Longitude'],
                    'Type': facility['Type'],
                    'Status': facility['Status'],
                  })
              .toList();
        });

        _updateMarkers();
      } else {
        setState(() {
          _errorMessage =
              "Failed to load bank facilities. Please try again later.";
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage =
            "An error occurred. Please check your connection and try again.";
      });
    }
  }

  void _updateMarkers() {
    Set<Marker> newMarkers = {};

    for (var facility in _bankFacilities) {
      final name = facility['Name'] ?? 'Unknown';
      final latitude = double.tryParse(facility['Latitude'].toString());
      final longitude = double.tryParse(facility['Longitude'].toString());
      final type = facility['Type'] ?? 'Unknown';
      final status = facility['Status'] ?? 'Unknown';

      if (latitude != null && longitude != null) {
        newMarkers.add(
          Marker(
            markerId: MarkerId('$latitude,$longitude'),
            position: LatLng(latitude, longitude),
            infoWindow: InfoWindow(
              title: name,
              snippet: 'Tap for more details',
            ),
            icon:
                BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
            onTap: () {
              _showFacilityDetails(
                name: name,
                type: type,
                status: status,
                latitude: latitude,
                longitude: longitude,
              );
            },
          ),
        );
      }
    }

    setState(() {
      _markers = newMarkers;
    });
  }

  Future<void> _showFacilityDetails({
    required String name,
    required String type,
    required String status,
    required double latitude,
    required double longitude,
  }) async {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Center(
            child: Text(
              name,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.blueAccent,
              ),
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Type: $type',
                style: TextStyle(fontSize: 16, color: Colors.black87),
              ),
              SizedBox(height: 8),
              Text(
                'Status: $status',
                style: TextStyle(fontSize: 16, color: Colors.black87),
              ),
            ],
          ),
          actionsAlignment: MainAxisAlignment.spaceBetween,
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(
                'Close',
                style: TextStyle(color: Colors.blueAccent),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueAccent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () {
                Navigator.of(context).pop();
                _launchGoogleMaps(latitude, longitude);
              },
              child: Text(
                'Start',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _launchGoogleMaps(double latitude, double longitude) async {
    final url =
        'https://www.google.com/maps/dir/?api=1&destination=$latitude,$longitude';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    } else {
      throw 'Could not launch $url';
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
    getFacilities();
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
                : _errorMessage != null
                    ? Center(
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(color: Colors.red),
                        ),
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
                          markers: _markers.union({
                            Marker(
                              markerId: const MarkerId("currentLocation"),
                              position: LatLng(
                                currentLocation!.latitude!,
                                currentLocation!.longitude!,
                              ),
                              icon: BitmapDescriptor.defaultMarkerWithHue(
                                  BitmapDescriptor.hueCyan),
                            ),
                          }),
                          onMapCreated: (mapController) {
                            if (!_controller.isCompleted) {
                              _controller.complete(mapController);
                            }
                            setState(() {
                              isMapInitialized = true;
                            });
                          },
                          onCameraMove: (CameraPosition position) {
                            currentZoom = position.zoom;
                          },
                        ),
                      ),
          ],
        ),
      ),
    );
  }
}
