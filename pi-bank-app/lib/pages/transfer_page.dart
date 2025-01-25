import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';
import 'package:online_bank/utill/local_auth.dart';
import 'package:online_bank/utill/refresh_tokens.dart';

final storage = FlutterSecureStorage();

class SendPage extends StatefulWidget {
  @override
  State<SendPage> createState() => _SendPageState();
}

class _SendPageState extends State<SendPage> {
  final BiometricAuthUtils _biometricAuthUtils = BiometricAuthUtils();
  final _formKey = GlobalKey<FormState>();
  String? _errorMessage;
  List<Map<String, String>> bankAccounts = [];
  List<Map<String, dynamic>> recentInteractions = [];
  String? selectedAccountId = null;
  var receiverAccount = null;
  String? enteredIBAN = null;
  double enteredAmount = 0;
  bool useDropdown = false;
  bool isDataLoaded = false;

  @override
  void initState() {
    super.initState();
    getData();
  }

  Future<void> getData() async {
    try {
      await ensureAccessTokenValidity(context);

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

  Future<bool> _authenticate() async {
    bool isSupported = await _biometricAuthUtils.isDeviceSupported();

    if (!isSupported) {
      setState(() {
        _errorMessage = "Device is not supported!";
      });
    }

    bool isAuthenticated = await _biometricAuthUtils.authenticate(
      reason: "Login to PI Smart",
    );

    return isAuthenticated;
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
            bankAccounts.clear();
            bankAccounts.addAll(List<Map<String, String>>.from(
              data["UserBankAccounts"].map((account) => {
                    "Id": account["Id"].toString(),
                    "IBAN": account["IBAN"].toString(),
                    "Amount": account["Amount"].toString(),
                    "Currency": account["Currency"].toString(),
                    "Type": account["Type"].toString(),
                  }),
            ));
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
          recentInteractions.clear();
          recentInteractions.addAll(
            List<Map<String, dynamic>>.from(
              data.map((account) => {
                    "Name": account["Name"],
                    "IBAN": account["IBAN"],
                    "BankAccountId": account["BankAccountId"].toString(),
                    "Amount": account["Amount"].toString(),
                    "Currency": account["Currency"]
                  }),
            ),
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
      await ensureAccessTokenValidity(context);

      final userId = await storage.read(key: 'userId');
      final accessToken = await storage.read(key: 'backendAccessToken');
      var receiverAccountId = null;

      if (userId == null || accessToken == null) {
        setState(() {
          _errorMessage = "Authentication error: Missing credentials.";
        });
        return;
      }

      final senderAccount = bankAccounts
          .firstWhere((account) => account['Id'] == selectedAccountId);
      final senderBalance = double.parse(senderAccount['Amount']!);
      final senderCurrency = senderAccount['Currency'];
      final transferAmount = enteredAmount;

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

      final receiverCurrency = receiverAccount['Currency'];

      if (senderCurrency.toString() != receiverCurrency.toString()) {
        setState(() {
          _errorMessage =
              "Currency mismatch: Sender's currency does not match receiver's currency.";
        });
        return;
      }

      final response = await http.post(
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
          "Currency": senderCurrency
        }),
      );

      if (response.statusCode != 201) {
        setState(() {
          _errorMessage = "Transaction failed: ${response.reasonPhrase}";
        });
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Transaction successful!"),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => SendPage()),
      );
    } catch (e) {
      setState(() {
        _errorMessage = "An error occurred during the transfer.";
      });
      print("Exception during transfer: $e");

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
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              MyAppBar(first_name: 'Прати', second_name: 'Пари'),
              isDataLoaded
                  ? Padding(
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
                                  child:
                                      Text(account["IBAN"] ?? "Unknown IBAN"),
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
                                  onChanged: (isDataLoaded &&
                                          recentInteractions.isNotEmpty)
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
                                          transfer["BankAccountId"]
                                              .toString()) {
                                        return DropdownMenuItem(
                                          value: transfer,
                                          child: Text(transfer["Name"] +
                                              ": " +
                                              transfer["IBAN"]),
                                        );
                                      }
                                      return null;
                                    })
                                    .where((item) => item != null)
                                    .toList()
                                    .cast<
                                        DropdownMenuItem<
                                            Map<String, dynamic>>>(),
                                onChanged: (value) {
                                  receiverAccount = value;
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
                                onPressed: () async {
                                  final bool authenticated =
                                      await _authenticate();
                                  if (authenticated) {
                                    transfer();
                                  }
                                },
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8.0),
                                ),
                                child: Text(
                                  'Send',
                                  style: TextStyle(
                                      fontSize: 20, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Column(
                      children: [
                        SizedBox(height: 30),
                        const Center(child: CircularProgressIndicator()),
                      ],
                    ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: AppBarBottom(),
    );
  }
}
