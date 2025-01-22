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
  List<Map<String, dynamic>> recentInteractions = [];
  String? selectedAccountId;
  var receiverAccount;
  String? enteredIBAN;
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
      await fetchInteractions(userId, accessToken);

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

  Future<void> fetchInteractions(String userId, String accessToken) async {
    try {
      final response = await http.get(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/userInteractions/$userId'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        setState(() {
          recentInteractions = List<Map<String, dynamic>>.from(
            data.map((account) => {
                  "Name": account["Name:"],
                  "IBAN": account["IBAN"],
                  "BankAccountId": account["BankAccountId"].toString(),
                  "Amount": account["Amount"].toString()
                }),
          );
        });
      } else {
        throw Exception(
            "Failed to fetch interactions: ${response.reasonPhrase}");
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Error fetching interactions.";
      });
      print("Error: $e");
    }
  }

  Future<void> transfer() async {
    if (!_formKey.currentState!.validate()) {
      setState(() {
        _errorMessage = "Please fill in all fields correctly.";
      });
      return;
    }

    try {
      final userId = await storage.read(key: 'userId');
      final accessToken = await storage.read(key: 'backendAccessToken');
      var receiverAccountId;

      if (userId == null || accessToken == null) {
        setState(() {
          _errorMessage = "Authentication error: Missing credentials.";
        });
        return;
      }

      final senderAccount = bankAccounts
          .firstWhere((account) => account['Id'] == selectedAccountId);
      print("Sender Account: $senderAccount");

      final senderBalance = double.parse(senderAccount['Amount']!);
      print("Sender Balance: $senderBalance");

      final transferAmount = enteredAmount;
      print("Transfer Amount: $transferAmount");

      if (transferAmount <= 0 || transferAmount > senderBalance) {
        setState(() {
          _errorMessage = "Insufficient funds or invalid amount.";
        });
        return;
      }

      if (!useDropdown) {
        final response = await http.post(
          Uri.parse(
              'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/bankAccountFromIBAN'),
          headers: {
            'Authorization': 'Bearer $accessToken',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({"IBAN": enteredIBAN}),
        );

        print("BankAccountFromIBAN Response: ${response.body}");

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          receiverAccount = data;
          receiverAccountId = data["Id"];
        } else {
          setState(() {
            _errorMessage = "Invalid IBAN or receiver account not found.";
          });
          return;
        }
      } else {
        receiverAccountId = receiverAccount["BankAccountId"];
      }

      print("Receiver Account: $receiverAccount");

      print("Receiver Account Id: $receiverAccountId");

      final transactionResponse = await http.post(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/transaction'),
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          "Sender": selectedAccountId,
          "Reciever": receiverAccountId,
          "Amount": transferAmount,
        }),
      );

      print("Transaction Response: ${transactionResponse.body}");

      if (transactionResponse.statusCode != 201) {
        setState(() {
          _errorMessage =
              "Transaction failed: ${transactionResponse.reasonPhrase}";
        });
        return;
      }

      // Deduct from sender and add to receiver
      final newSenderBalance = senderBalance - transferAmount;
      print("New Sender Balance: $newSenderBalance");
      await http.put(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/updateBankAccountAmount/$selectedAccountId'),
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({"Amount": newSenderBalance}),
      );

      print("test!");

      final newReceiverBalance =
          double.parse(receiverAccount["Amount"].toString()) + transferAmount;
      print("newReceiverBalance: $newReceiverBalance");
      print("Receiver Account Id: $receiverAccountId");
      await http.put(
        Uri.parse(
            'https://proper-invest.tech/services/ts/pi-bank-backend/api/BankService.ts/updateBankAccountAmount/$receiverAccountId'),
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({"Amount": newReceiverBalance}),
      );

      // Fetch updated data to refresh the page
      await getData();

      // Reload the page
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => SendPage(context: context)),
      );
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred during the transfer.";
      });
      print("Exception during transfer: $e");

      // Display an error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Transaction failed! Please try again."),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
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
                          items: recentInteractions
                              .map((transfer) {
                                if (selectedAccountId !=
                                    transfer["BankAccountId"].toString()) {
                                  return DropdownMenuItem(
                                    value: transfer,
                                    child: Text(transfer["Name"] +
                                        ": " +
                                        transfer["IBAN"]),
                                  );
                                }
                                return null; // Explicitly return null for entries that don't match
                              })
                              .where((item) =>
                                  item != null) // Filter out null entries
                              .toList()
                              .cast<
                                  DropdownMenuItem<
                                      Map<String,
                                          dynamic>>>(), // Ensure the type matches
                          onChanged: (value) {
                            setState(() {
                              receiverAccount = value;
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
                            enteredIBAN = value;
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
