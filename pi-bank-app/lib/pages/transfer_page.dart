import 'dart:convert';

import "package:flutter/material.dart";
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';
import 'package:http/http.dart' as http;

final storage = FlutterSecureStorage();

class SendPage extends StatefulWidget {
  final BuildContext context;

  const SendPage({
    required this.context,
  });

  @override
  State<SendPage> createState() => _SendPageState();
}

class _SendPageState extends State<SendPage> {
  final _formKey = GlobalKey<FormState>();

  List<Map<String, String>> recentTransfers = [];
  List<Map<String, String>> bankAccounts = [];
  String? selectedAccountId;
  String? selectedIBAN;
  String? selectedName;
  bool useDropdown = false;
  String? _errorMessage;

  Future<void> getData() async {
    try {
      final userId = await storage.read(key: 'userId');
      final accessToken = await storage.read(key: 'backendAccessToken');

      if (userId == null || accessToken == null) {
        setState(() {
          _errorMessage = "Authentication error: Missing credentials.";
        });
        print("Error: $_errorMessage");
        return;
      }

      print("Fetching bank accounts for user ID: $userId");

      // Fetch bank accounts
      var response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/bankAccounts/$userId'),
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      print("Bank Accounts API Response: ${response.body}");
      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data["UserBankAccounts"] != null) {
          setState(() {
            bankAccounts = List<Map<String, String>>.from(
              data["UserBankAccounts"].map((account) => {
                    "Id": account["Id"].toString(),
                    "IBAN": account["IBAN"].toString(),
                    "Amount": account["Amount"].toString(),
                    "Currency": account["Currency"].toString(),
                    "Type": account["Type"].toString()
                  }),
            );
            selectedAccountId =
                bankAccounts.isNotEmpty ? bankAccounts[0]["Id"] : null;
          });
          print("Fetched bank accounts: $bankAccounts");
        } else {
          throw Exception("No accounts found in response.");
        }
      } else {
        setState(() {
          _errorMessage =
              "Failed to fetch bank accounts: ${response.reasonPhrase}";
        });
        print("HTTP Error: ${response.statusCode} - ${response.reasonPhrase}");
        return;
      }

      // Fetch transactions
      print("Fetching transactions for user ID: $userId");
      response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/transactionItems/$userId'),
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      print("Transactions API Response: ${response.body}");
      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        final userTransactions = data["UserTransactions"];
        print("User Transactions: $userTransactions");

        String? senderName = null;
        String? receiverName = null;

        // Fetch usernames for Sender and Receiver
        for (var transaction in userTransactions) {
          final senderId = transaction["Sender"];
          final receiverId = transaction["Reciever"];

          print("transid $senderId userId: $userId");

          if (senderId.toString() != userId) {
            senderName = await fetchUsername(senderId, accessToken);
          }

          print("test6");

          if (receiverId.toString() != userId) {
            print("reciever: $receiverId, user: $userId");
            receiverName = await fetchUsername(receiverId, accessToken);
          }

          print("test3");

          recentTransfers.add({
            "name": senderName ?? receiverName ?? "Unknown",
          });

          print("test4");
        }

        recentTransfers = recentTransfers
            .fold<Map<String, Map<String, String>>>(
                {},
                (Map<String, Map<String, String>> map, item) =>
                    map..putIfAbsent(item["name"] ?? "Unknown", () => item))
            .values
            .toList();

        print("Mapped transactions: $recentTransfers");
      } else {
        setState(() {
          _errorMessage =
              "Failed to fetch transactions: ${response.reasonPhrase}";
        });
        print("HTTP Error: ${response.statusCode} - ${response.reasonPhrase}");
      }
    } catch (e) {
      setState(() {
        _errorMessage =
            "An error occurred. Please check your connection and try again.";
      });
      print("Exception during data fetch: $e");
    }
  }

  Future<String?> fetchUsername(int bankAccountId, String accessToken) async {
    print("Fetching username for BankAccountId: $bankAccountId");
    try {
      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/userFromBankAccount/$bankAccountId'),
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      );

      print("Username API Response: ${response.body}");
      if (response.statusCode == 200) {
        print("test1");
        var data = jsonDecode(response.body);
        print("test2");
        return data["Username"];
      } else {
        print(
            "Failed to fetch username for bankAccountId $bankAccountId: ${response.reasonPhrase}");
        return null;
      }
    } catch (e) {
      print("Exception during username fetch for $bankAccountId: $e");
      return null;
    }
  }

  @override
  void initState() {
    super.initState();
    print("Initializing SendPage...");
    getData();
  }

  @override
  Widget build(BuildContext context) {
    print("Building SendPage UI...");
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: this.context),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              MyAppBar(first_name: 'Proper Invest', second_name: 'Bank'),
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        DropdownButtonFormField<String>(
                          value: selectedAccountId,
                          items: bankAccounts.map((account) {
                            return DropdownMenuItem(
                              value: account["Id"],
                              child: Text(account["IBAN"] ?? "Unknown IBAN"),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              selectedAccountId = value;
                              print("Selected Account ID: $selectedAccountId");
                            });
                          },
                          decoration: InputDecoration(
                            border: OutlineInputBorder(),
                            hintText: "Избери сметка",
                          ),
                        ),
                        if (_errorMessage != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 10),
                            child: Text(
                              _errorMessage!,
                              style: TextStyle(color: Colors.red),
                            ),
                          ),
                        SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("Избери от списъка"),
                            Switch(
                              value: useDropdown,
                              onChanged: (value) {
                                setState(() {
                                  useDropdown = value;
                                  selectedIBAN = null;
                                  selectedName = null;
                                  print("Dropdown usage toggled: $useDropdown");
                                });
                              },
                            ),
                          ],
                        ),
                        if (useDropdown)
                          DropdownButtonFormField<String>(
                            value: selectedName,
                            items: recentTransfers.map((transfer) {
                              return DropdownMenuItem(
                                value: transfer['name'],
                                child: Text(transfer['name']!),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() {
                                selectedName = value;
                                selectedIBAN = recentTransfers.firstWhere(
                                    (element) =>
                                        element['name'] == value)['iban'];
                                print("Selected Name: $selectedName");
                                print("Corresponding IBAN: $selectedIBAN");
                              });
                            },
                            decoration: InputDecoration(
                              border: OutlineInputBorder(),
                              hintText: "Избери име",
                            ),
                          )
                        else
                          TextFormField(
                            initialValue: selectedIBAN,
                            decoration: InputDecoration(
                              border: OutlineInputBorder(),
                              hintText: "Въведи IBAN",
                            ),
                            onChanged: (value) {
                              setState(() {
                                selectedIBAN = value;
                                print("Manually entered IBAN: $selectedIBAN");
                              });
                            },
                          ),
                        SizedBox(height: 20),
                        TextFormField(
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(),
                            hintText: "Пример: 150.00",
                          ),
                          onChanged: (value) {
                            print("Entered Amount: $value");
                          },
                        ),
                        SizedBox(height: 30),
                        Center(
                          child: SizedBox(
                            height: 50,
                            width: 150,
                            child: MaterialButton(
                              color: Colors.blue.shade700,
                              onPressed: () {
                                print(
                                    "Transfer initiated. Selected Account ID: $selectedAccountId");
                                // Add your transfer logic here
                              },
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8.0),
                              ),
                              child: Text(
                                'Прати',
                                style: TextStyle(
                                  fontSize: 20,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
