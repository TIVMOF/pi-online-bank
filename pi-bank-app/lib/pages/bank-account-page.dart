import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';
import 'package:online_bank/utill/my_card.dart';
import 'package:online_bank/utill/refresh_tokens.dart';
import 'package:http/http.dart' as http;
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

class BankAccountPage extends StatefulWidget {
  final int bankAccountId;

  const BankAccountPage({
    Key? key,
    required this.bankAccountId,
  }) : super(key: key);

  @override
  State<BankAccountPage> createState() => _BankAccountPageState();
}

class _BankAccountPageState extends State<BankAccountPage> {
  final _controller = PageController();
  String? _errorMessage;
  List<Map<String, dynamic>> _cards = [];
  Map<String, dynamic>? _bankAccount;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _getData(widget.bankAccountId);
  }

  Future<void> _getData(int bankAccountId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ensureAccessTokenValidity(context);
      final accessToken = await storage.read(key: 'backendAccessToken');

      if (accessToken == null) {
        throw Exception("Access token is missing.");
      }

      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/bankAccountInfo/$bankAccountId'),
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        setState(() {
          _bankAccount = {
            "IBAN": data["BankAccount"]["IBAN"],
            "User": data["BankAccount"]["User"],
            "Amount": data["BankAccount"]["Amount"],
            "Currency": data["BankAccount"]["Currency"],
            "Type": data["BankAccount"]["Type"],
            "Status": data["BankAccount"]["Status"],
            "CreationDate": data["BankAccount"]["CreationDate"],
          };

          _cards = (data["BankAccountCards"] as List<dynamic>)
              .map((card) => {
                    'balance': card['Balance'] + 0.0,
                    'cardNumber': card['CardNumber'],
                    'expiryDate': card['ExpirationDate'],
                    'currency': card['Currency'],
                    "cv": card["CV"],
                    'color': Colors.lightBlue,
                  })
              .toList();

          _isLoading = false;
        });
      } else {
        throw Exception(
            "Failed to load data. Status code: ${response.statusCode}");
      }
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred: ${e.toString()}";
        _isLoading = false;
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
            MyAppBar(first_name: 'Информация', second_name: ''),
            SizedBox(height: 25),
            if (_isLoading)
              Center(
                child: CircularProgressIndicator(),
              )
            else if (_errorMessage != null)
              Center(
                child: Text(
                  _errorMessage!,
                  style: TextStyle(color: Colors.red),
                ),
              )
            else if (_bankAccount != null)
              Expanded(
                child: Column(
                  children: [
                    Container(
                      height: 180,
                      child: PageView(
                        scrollDirection: Axis.horizontal,
                        controller: _controller,
                        children: _cards.map((card) {
                          return MyCard(
                            balance: card['balance'],
                            cardNumber: card['cardNumber'],
                            expiryDate: card['expiryDate'],
                            currency: card['currency'],
                            cv: card['cv'],
                            color: card['color'],
                            isHidden: false,
                          );
                        }).toList(),
                      ),
                    ),
                    SizedBox(height: 15),
                    SmoothPageIndicator(
                      controller: _controller,
                      count: _cards.length,
                      effect: ExpandingDotsEffect(
                        activeDotColor: Colors.blue.shade900,
                      ),
                    ),
                    SizedBox(height: 20),
                    Card(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 3,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bank Account Info:',
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'IBAN: ${_bankAccount!['IBAN']}',
                              style: const TextStyle(fontSize: 18),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Owner: ${_bankAccount!['User']}',
                              style: const TextStyle(fontSize: 16),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Amount: ${_bankAccount!['Amount']} ${_bankAccount!['Currency']}',
                              style: const TextStyle(fontSize: 16),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Type: ${_bankAccount!['Type']}',
                              style: const TextStyle(fontSize: 16),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Status: ${_bankAccount!['Status']}',
                              style: const TextStyle(fontSize: 16),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Creation Date: ${_bankAccount!['CreationDate']}',
                              style: const TextStyle(fontSize: 16),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
