import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';

class BiometricAuthUtils {
  final LocalAuthentication _auth = LocalAuthentication();

  /// Check if the device supports biometrics
  Future<bool> isDeviceSupported() async {
    try {
      return await _auth.isDeviceSupported();
    } catch (e) {
      print("Error checking device support: $e");
      return false;
    }
  }

  /// Get available biometric types on the device
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      print("Error getting available biometrics: $e");
      return [];
    }
  }

  /// Authenticate the user using biometrics or device PIN/password
  Future<bool> authenticate({String reason = "Authenticate to proceed"}) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } on PlatformException catch (e) {
      print("Error during authentication: $e");
      return false;
    }
  }
}
