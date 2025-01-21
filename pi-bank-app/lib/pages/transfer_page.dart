import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';

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
  String? _errorMessage;
  List<Map<String, String>> bankAccounts = [];
  List<Map<String, dynamic>> recentTransfers = [];
  String? selectedAccountId;
  String? bankAccount;
  double enteredAmount = 0;
  bool useDropdown = false;
  bool isDataLoaded = false;

  @override
  void initState() {
    super.initState();
    print("Initializing SendPage...");
    getData();
  }

  Future<void> getData() async {
    try {
      final userId = await storage.read(key: 'userId');
      final accessToken = await storage.read(key: 'backendAccessToken');

      if (userId == null || accessToken == null) {
        setState(() {
          _errorMessage = "Authentication error: Missing credentials.";
        });
        return;
      }

      await fetchBankAccounts(userId, accessToken);
      await fetchTransactions(userId, accessToken);

      setState(() {
        isDataLoaded = true;
      });
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred. Please check your connection.";
      });
      print("Error fetching data: $e");
    }
  }

  Future<void> fetchBankAccounts(String userId, String accessToken) async {
    try {
      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/bankAccounts/$userId'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data["UserBankAccounts"] != null) {
          setState(() {
            bankAccounts = List<Map<String, String>>.from(
              data["UserBankAccounts"].map((account) => {
                    "Id": account["Id"].toString(),
                    "IBAN": account["IBAN"].toString(),
                    "Amount": account["Amount"].toString(),
                    "Currency": account["Currency"].toString(),
                    "Type": account["Type"].toString(),
                  }),
            );
            selectedAccountId =
                bankAccounts.isNotEmpty ? bankAccounts[0]["Id"] : null;
          });
        } else {
          throw Exception("No accounts found.");
        }
      } else {
        throw Exception(
            "Failed to fetch bank accounts: ${response.reasonPhrase}");
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Error fetching bank accounts.";
      });
      print("Error: $e");
    }
  }

  Future<void> fetchTransactions(String userId, String accessToken) async {
    try {
      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/transactionItems/$userId'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final userTransactions = data["UserTransactions"];

        final fetchedTransfers = <Map<String, dynamic>>[];

        for (var transaction in userTransactions) {
          final senderId = transaction["Sender"];
          final receiverId = transaction["Reciever"];

          if (senderId.toString() != userId) {
            final senderInfo = await fetchUserInfo(senderId, accessToken);
            if (senderInfo.isNotEmpty) fetchedTransfers.add(senderInfo);
          } else if (receiverId.toString() != userId) {
            final receiverInfo = await fetchUserInfo(receiverId, accessToken);
            if (receiverInfo.isNotEmpty) fetchedTransfers.add(receiverInfo);
          }
        }

        setState(() {
          recentTransfers = removeDuplicates(fetchedTransfers);
        });
      } else {
        throw Exception(
            "Failed to fetch transactions: ${response.reasonPhrase}");
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Error fetching transactions.";
      });
      print("Error: $e");
    }
  }

  Future<Map<String, dynamic>> fetchUserInfo(
      int bankAccountId, String accessToken) async {
    try {
      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/userFromBankAccount/$bankAccountId'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {"name": data["Username"], "bankAccountId": bankAccountId};
      }
      return {};
    } catch (e) {
      print("Error fetching user info: $e");
      return {};
    }
  }

  List<Map<String, dynamic>> removeDuplicates(
      List<Map<String, dynamic>> transfers) {
    final seen = <String>{};
    return transfers.where((transfer) {
      final key = '${transfer["name"]}-${transfer["bankAccountId"]}';
      if (!seen.contains(key)) {
        seen.add(key);
        return true;
      }
      return false;
    }).toList();
  }

  Future<void> transfer() async {
    print("Starting transfer...");

    if (!_formKey.currentState!.validate()) {
      setState(() {
        _errorMessage = "Please fill in all fields correctly.";
      });
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: widget.context),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              MyAppBar(first_name: 'Proper Invest', second_name: 'Bank'),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Form(
                  key: _formKey,
                  child: Column(
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
                          });
                        },
                        decoration: InputDecoration(
                          border: OutlineInputBorder(),
                          hintText: "Select Account",
                        ),
                      ),
                      SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Use Dropdown"),
                          Switch(
                            value: useDropdown,
                            onChanged: isDataLoaded
                                ? (value) {
                                    setState(() {
                                      useDropdown = value;
                                    });
                                  }
                                : null,
                          ),
                        ],
                      ),
                      if (useDropdown)
                        DropdownButtonFormField<Map<String, dynamic>>(
                          value: null,
                          items: recentTransfers.map((transfer) {
                            return DropdownMenuItem(
                              value: transfer,
                              child: Text(transfer["name"]),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              bankAccount = value?["bankAccountId"].toString();
                            });
                          },
                          decoration: InputDecoration(
                            border: OutlineInputBorder(),
                            hintText: "Select User",
                          ),
                        )
                      else
                        TextFormField(
                          decoration: InputDecoration(
                            border: OutlineInputBorder(),
                            hintText: "Enter IBAN",
                          ),
                          onChanged: (value) {
                            bankAccount = value;
                          },
                        ),
                      SizedBox(height: 20),
                      TextFormField(
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(),
                          hintText: "Amount (e.g., 150.00)",
                        ),
                        onChanged: (value) {
                          final amount = double.tryParse(value);
                          if (amount != null) {
                            enteredAmount = amount;
                          }
                        },
                      ),
                      SizedBox(height: 30),
                      if (_errorMessage != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(color: Colors.red),
                          ),
                        ),
                      SizedBox(
                        height: 50,
                        width: 150,
                        child: MaterialButton(
                          color: Colors.blue.shade700,
                          onPressed: transfer,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Text(
                            'Send',
                            style: TextStyle(fontSize: 20, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
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
