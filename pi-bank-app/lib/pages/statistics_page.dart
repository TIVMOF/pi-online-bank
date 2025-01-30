import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';
import 'package:online_bank/utill/my_chart.dart';
import 'package:online_bank/utill/my_transaction.dart';
import 'package:online_bank/utill/refresh_tokens.dart';

final storage = FlutterSecureStorage();

class StatsPage extends StatefulWidget {
  const StatsPage({super.key});

  @override
  State<StatsPage> createState() => _StatsPageState();
}

class _StatsPageState extends State<StatsPage> {
  bool _isLoading = true;
  final _controller = PageController();
  String? _errorMessage;
  List<Map<String, dynamic>> transactions = [];
  String? userId;
  List<ChartData> incomeData = [];
  List<ChartData> expenseData = [];

  @override
  void initState() {
    super.initState();
    getData();
  }

  Future<void> getData() async {
    try {
      await ensureAccessTokenValidity(context);

      userId = await storage.read(key: 'userId');
      final accessToken = await storage.read(key: 'backendAccessToken');

      if (userId == null || accessToken == null) {
        setState(() {
          _errorMessage = "Authentication error: Missing credentials.";
        });
        return;
      }

      var response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/transactions/$userId'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        setState(() {
          transactions.clear();
          transactions.addAll(
            List<Map<String, dynamic>>.from(
              data["UserTransactions"].map((transaction) => {
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
        setState(() {
          _isLoading = false;
        });
        throw Exception(
            "Failed to fetch bank transactions: ${response.reasonPhrase}");
      }

      response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/monthlyStats/$userId'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        setState(() {
          incomeData = _mapStatsToChartData(data['incomes']);
          expenseData = _mapStatsToChartData(data['expenses']);

          _isLoading = false;
        });
      } else {
        _isLoading = false;
        throw Exception(
            "Failed to fetch monthly stats: ${response.reasonPhrase}");
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = "An error occurred. Please check your connection.";
      });
      print("Error fetching data: $e");
    }
  }

  List<ChartData> _mapStatsToChartData(Map<String, dynamic> stats) {
    final sortedEntries = stats.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));

    return sortedEntries
        .map((entry) => ChartData(
              _formatMonth(entry.key),
              entry.value.toDouble(),
            ))
        .toList();
  }

  String _formatMonth(String date) {
    final parts = date.split('-');
    final year = parts[0];
    final month = int.parse(parts[1]);
    final monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    return "${monthNames[month - 1]} $year";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(),
      body: SafeArea(
        child: _isLoading
            ? Column(
                children: [
                  SizedBox(height: 30),
                  const Center(child: CircularProgressIndicator()),
                ],
              )
            : ListView(
                controller: _controller,
                children: [
                  MyAppBar(first_name: 'Статистики', second_name: ''),
                  const SizedBox(height: 30),
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  MyChart(
                    title: 'Разплащания и доходи',
                    series1Data: expenseData,
                    series2Data: incomeData,
                    series1Name: 'Expenses',
                    series2Name: 'Incomes',
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.only(right: 5),
                    child: Column(
                      children: transactions.map((transaction) {
                        final isSent = userId != transaction["SenderId"];
                        return MyTransaction(
                          recipient: isSent
                              ? transaction["Sender"] ?? "Unknown"
                              : transaction["Receiver"] ?? "Unknown",
                          date: transaction["Date"] ?? "Unknown",
                          sum: double.tryParse(transaction["Amount"] ?? "0") ??
                              0.0,
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
