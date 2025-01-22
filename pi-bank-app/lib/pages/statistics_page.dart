import 'dart:convert';

import 'package:flutter/material.dart';
import '../utill/app_bar.dart';
// import '../utill/my_chart.dart';
import '../utill/bottom_app_bar.dart';
import '../utill/my_transaction.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

final storage = FlutterSecureStorage();

class StatsPage extends StatefulWidget {
  const StatsPage({super.key});

  @override
  State<StatsPage> createState() => _StatsPageState();
}

class _StatsPageState extends State<StatsPage> {
  final _controller = PageController();
  String? _errorMessage;
  List<Map<String, String>> transactions = [];
  String? userId;

  @override
  void initState() {
    super.initState();
    getData();
  }

  Future<void> getData() async {
    try {
      userId = await storage.read(key: 'userId');
      final accessToken = await storage.read(key: 'backendAccessToken');

      if (userId == null || accessToken == null) {
        setState(() {
          _errorMessage = "Authentication error: Missing credentials.";
        });
        return;
      }

      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/transactions/$userId'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      print("Transaction Response: ${response.body}");

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        setState(() {
          transactions.clear();
          transactions.addAll(
            List<Map<String, String>>.from(
              data.map((transaction) => {
                    "SenderId": transaction["SenderId"].toString(),
                    "Receiver": transaction["Receiver"].toString(),
                    "Sender": transaction["Sender"].toString(),
                    "Amount": transaction["Amount"].toString(),
                    "Currency": transaction["Currency"].toString(),
                    "Date": transaction["Date"]
                  }),
            ),
          );
        });
      } else {
        throw Exception(
            "Failed to fetch bank accounts: ${response.reasonPhrase}");
      }
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred. Please check your connection.";
      });
      print("Error fetching data: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: context),
      body: SafeArea(
        child: ListView(
          controller: _controller,
          children: [
            MyAppBar(first_name: 'Статистики', second_name: ''),
            SizedBox(height: 30),
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  _errorMessage!,
                  style: TextStyle(color: Colors.red),
                ),
              ),
            // MyChart(
            //   title: 'Разплащания и доходи',
            // ),
            SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.only(right: 5),
              child: Column(
                children: transactions.map((transaction) {
                  final isSent = userId != transaction["SenderId"];
                  return MyTransaction(
                    recipient: isSent
                        ? transaction["Receiver"] ?? "Unknown"
                        : transaction["Sender"] ?? "Unknown",
                    date: transaction["Date"] ?? "Unknown",
                    sum: double.tryParse(transaction["Amount"] ?? "0") ?? 0.0,
                    currency: transaction["Currency"] ?? "Unknown",
                    sentOrReceived: isSent,
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
