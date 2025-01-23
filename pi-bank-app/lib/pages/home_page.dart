// ignore_for_file: prefer_const_literals_to_create_immutables, prefer_const_constructors, sized_box_for_whitespace

import 'package:flutter/material.dart';
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';
import 'package:online_bank/utill/my_card.dart';
import 'package:online_bank/utill/my_list_tile.dart';
import 'package:online_bank/utill/refresh_tokens.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _controller = PageController();
  String? _errorMessage;
  List<Map<String, dynamic>> _cards = [];

  @override
  void initState() {
    super.initState();
    _fetchCards();
  }

  Future<void> _fetchCards() async {
    try {
      await ensureAccessTokenValidity(context);

      final userId = await storage.read(key: 'userId');
      final accessToken = await storage.read(key: 'backendAccessToken');

      if (userId == null || accessToken == null) {
        throw Exception("User ID or access token is missing.");
      }

      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/cards/$userId'),
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> cardData = json.decode(response.body)["UserCards"];

        setState(() {
          _cards = cardData
              .map((card) => {
                    'balance': card['Balance'] + 0.0,
                    'cardNumber': card['CardNumber'],
                    'expiryDate': card['ExpirationDate'],
                    'color': Colors.blue,
                  })
              .toList();
        });
      } else {
        setState(() {
          _errorMessage = "Failed to load cards. Please try again later.";
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage =
            "An error occurred. Please check your connection and try again.";
      });
    }
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

            SizedBox(
              height: 25,
            ),

            _errorMessage != null
                ? Center(
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: Colors.red),
                    ),
                  )
                : _cards.isEmpty
                    ? Center(
                        child: CircularProgressIndicator(),
                      )
                    : Container(
                        height: 180,
                        child: PageView(
                          scrollDirection: Axis.horizontal,
                          controller: _controller,
                          children: _cards.map((card) {
                            return MyCard(
                              balance: 1.0 * card['balance'],
                              cardNumber: card['cardNumber'],
                              expiryDate: card['expiryDate'],
                              color: card['color'],
                            );
                          }).toList(),
                        )),

            SizedBox(height: 15),

            SmoothPageIndicator(
              controller: _controller,
              count: _cards.length,
              effect: ExpandingDotsEffect(
                activeDotColor: Colors.blue.shade900,
              ),
            ),

            SizedBox(height: 20),

            // column -> stats + transaction
            Padding(
              padding: const EdgeInsets.all(25.0),
              child: Column(
                children: [
                  // Send
                  MyListTile(
                    iconImagePath: 'lib/icons/send.png',
                    tileTitle: 'Преводи',
                    tileSubtitle: 'Прати по сметка',
                    routeName: '/transfer',
                  ),

                  // Stats
                  MyListTile(
                    iconImagePath: 'lib/icons/statistics.png',
                    tileTitle: 'Статистики',
                    tileSubtitle: 'Разплащания',
                    routeName: '/statistics',
                  ),

                  // Map
                  MyListTile(
                    iconImagePath: 'lib/icons/map.png',
                    tileTitle: 'Клонове',
                    tileSubtitle: 'Получи консултация',
                    routeName: '/map',
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
