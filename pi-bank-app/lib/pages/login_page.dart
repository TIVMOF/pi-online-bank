import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utill/app_bar.dart';

final storage = FlutterSecureStorage();

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isPasswordVisible = false;
  String? _errorMessage;

  Future<void> login() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      setState(() {
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

        await storage.write(key: 'keycloak_access_token', value: accessToken);
        await storage.write(key: 'keycloak_refresh_token', value: refreshToken);

        print("Login successful! \nToken: $accessToken");

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

        print("Response Body: ${response.body}");

        response = await http.get(
          Uri.parse(
              'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/userId/$username/$password'),
          headers: {'Authorization': 'Bearer $accessToken'},
        );

        print("Response Body: ${response.body}");

        if (response.statusCode == 200) {
          try {
            data = jsonDecode(response.body);
            final userId = data['userId'];
            print("Id fetching successful! Id: $userId");

            await storage.write(key: 'userId', value: userId);
          } catch (e) {
            print("Error decoding JSON: $e");
            setState(() {
              _errorMessage = "Failed to parse user ID response.";
            });
            return;
          }
        } else {
          print("Error fetching user ID: ${response.body}");
          setState(() {
            _errorMessage = "Failed to fetch user ID. Please try again.";
          });
          return;
        }

        Navigator.pushReplacementNamed(context, '/home');
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
      print("Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      body: SafeArea(
        child: Column(
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
                        child: Text("Login", style: TextStyle(fontSize: 16)),
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
