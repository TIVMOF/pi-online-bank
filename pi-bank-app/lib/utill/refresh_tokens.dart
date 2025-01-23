import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/material.dart';

final storage = FlutterSecureStorage();

Future<void> ensureAccessTokenValidity(BuildContext context) async {
  final accessToken = await storage.read(key: 'backendAccessToken');
  final refreshToken = await storage.read(key: 'backendRefreshToken');

  if (accessToken == null || refreshToken == null) {
    _navigateToLoginPage(context);
    return;
  }

  try {
    final response = await http.post(
      Uri.parse(
          'https://keycloak.proper-invest.tech/realms/pi-bank/protocol/openid-connect/token'),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: {
        'grant_type': 'refresh_token',
        'client_id': 'pi-bank-mobile',
        'refresh_token': refreshToken,
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final newAccessToken = data['access_token'];
      final newRefreshToken = data['refresh_token'];

      await storage.write(key: 'backendAccessToken', value: newAccessToken);
      await storage.write(key: 'backendRefreshToken', value: newRefreshToken);
    } else if (response.statusCode == 400 || response.statusCode == 401) {
      // Refresh token is invalid or expired
      _navigateToLoginPage(context);
    } else {
      throw Exception("Failed to refresh access token.");
    }
  } catch (e) {
    throw Exception("Error refreshing access token: $e");
  }
}

void _navigateToLoginPage(BuildContext context) {
  storage.deleteAll();
  Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
}
