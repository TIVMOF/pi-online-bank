import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/local_auth.dart';

final storage = FlutterSecureStorage();

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final BiometricAuthUtils _biometricAuthUtils = BiometricAuthUtils();

  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isPasswordVisible = false;
  String? _errorMessage;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkStoredCredentials();
  }

  Future<void> _checkStoredCredentials() async {
    final storedUsername = await storage.read(key: 'username');
    final storedPassword = await storage.read(key: 'password');

    if (storedUsername != null && storedPassword != null) {
      bool isSupported = await _biometricAuthUtils.isDeviceSupported();

      if (!isSupported) {
        setState(() {
          _errorMessage = "Device is not supported!";
          _isLoading = false;
        });
      }

      bool isAuthenticated = await _biometricAuthUtils.authenticate(
        reason: "Login to PI Smart",
      );

      if (isAuthenticated == true) {
        _usernameController.text = storedUsername;
        _passwordController.text = storedPassword;

        await login();
      } else {
        setState(() {
          _errorMessage = "Authentication failed!";
          _isLoading = false;
        });
      }
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      setState(() {
        _isLoading = false;
        _errorMessage = "Please enter both username and password.";
      });
      return;
    }

    try {
      var response = await http.post(
        Uri.parse(
            'https://keycloak.proper-invest.tech/realms/pi-bank/protocol/openid-connect/token'),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'grant_type': 'password',
          'client_id': 'pi-bank-mobile',
          'username': username,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        final accessToken = data['access_token'];
        final refreshToken = data['refresh_token'];

        await storage.write(key: 'mobileAccessToken', value: accessToken);
        await storage.write(key: 'mobileRefreshToken', value: refreshToken);

        await storage.write(key: 'username', value: username);
        await storage.write(key: 'password', value: password);

        response = await http.post(
          Uri.parse(
              'https://keycloak.proper-invest.tech/realms/pi-bank/protocol/openid-connect/token'),
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: {
            'grant_type': 'urn:ietf:params:oauth:grant-type:token-exchange',
            'client_id': 'pi-bank-mobile',
            'subject_token': accessToken,
            'audience': 'pi-bank-backend',
          },
        );

        if (response.statusCode == 200) {
          data = jsonDecode(response.body);
          final backendAccessToken = data['access_token'];
          final backendRefreshToken = data['refresh_token'];

          await storage.write(
              key: 'backendAccessToken', value: backendAccessToken);
          await storage.write(
              key: 'backendRefreshToken', value: backendRefreshToken);

          response = await http.post(
            Uri.parse(
                'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/userLogin'),
            headers: {
              'Authorization': 'Bearer $backendAccessToken',
            },
            body: jsonEncode({
              "Username": username,
              "Password": password,
            }),
          );

          if (response.statusCode == 200) {
            try {
              data = jsonDecode(response.body);
              final userId = data['UserId'];

              Navigator.pushReplacementNamed(context, '/home');

              await storage.write(key: 'userId', value: userId.toString());
            } catch (e) {
              setState(() {
                _errorMessage = "Failed to parse user ID response.";
              });
              return;
            }
          } else {
            setState(() {
              _errorMessage = "Failed to fetch user ID. Please try again.";
            });
            return;
          }
        } else {
          setState(() {
            _errorMessage = "Token exchange failed. Please try again.";
          });
        }
      } else {
        setState(() {
          _errorMessage = jsonDecode(response.body)['error_description'] ??
              "Invalid username or password.";
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage =
            "An error occurred. Please check your connection and try again.";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      body: SafeArea(
        child: _isLoading
            ? Center(child: CircularProgressIndicator())
            : Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  MyAppBar(first_name: 'Proper Invest', second_name: 'Bank'),
                  Expanded(
                    child: Center(
                      child: Container(
                        width: 300,
                        padding: EdgeInsets.all(16.0),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black26,
                              blurRadius: 8,
                              offset: Offset(2, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Username Field
                            TextField(
                              controller: _usernameController,
                              decoration: InputDecoration(
                                labelText: "Username",
                                border: OutlineInputBorder(),
                              ),
                            ),
                            SizedBox(height: 16),
                            // Password Field
                            TextField(
                              controller: _passwordController,
                              obscureText: !_isPasswordVisible,
                              decoration: InputDecoration(
                                labelText: "Password",
                                border: OutlineInputBorder(),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _isPasswordVisible
                                        ? Icons.visibility
                                        : Icons.visibility_off,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _isPasswordVisible = !_isPasswordVisible;
                                    });
                                  },
                                ),
                              ),
                            ),
                            SizedBox(height: 16),
                            // Error Message
                            if (_errorMessage != null)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 16.0),
                                child: Text(
                                  _errorMessage!,
                                  style: TextStyle(color: Colors.red),
                                ),
                              ),
                            // Login Button
                            ElevatedButton(
                              onPressed: login,
                              style: ElevatedButton.styleFrom(
                                minimumSize: Size(double.infinity, 50),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child:
                                  Text("Login", style: TextStyle(fontSize: 16)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
