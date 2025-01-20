import "package:flutter/material.dart";
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';

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
  final List<Map<String, String>> recentTransfers = [
    {"name": "Иван Иванов", "iban": "BG80BNBG96611020345678"},
    {"name": "Петър Петров", "iban": "BG80BNBG96611020312345"},
    {"name": "Мария Георгиева", "iban": "BG80BNBG96611020367890"}
  ];
  String? selectedAccount;
  String? selectedIBAN;
  String? selectedName;
  bool useDropdown = false;

  void updateFieldsBasedOnSelection(String? name) {
    setState(() {
      if (name != null) {
        selectedName = name;
        selectedIBAN = recentTransfers
            .firstWhere((transfer) => transfer['name'] == name)['iban'];
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
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
                          value: selectedAccount,
                          items:
                              ["Лична сметка", "Бизнес сметка"].map((account) {
                            return DropdownMenuItem(
                              value: account,
                              child: Text(account),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              selectedAccount = value;
                            });
                          },
                          decoration: InputDecoration(
                            border: OutlineInputBorder(),
                            hintText: "Избери сметка",
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
                                });
                              },
                            ),
                          ],
                        ),
                        if (useDropdown)
                          DropdownButtonFormField<String>(
                            value: null,
                            items: recentTransfers.map((transfer) {
                              return DropdownMenuItem(
                                value: transfer['name'],
                                child: Text(transfer['name']!),
                              );
                            }).toList(),
                            onChanged: (value) {
                              updateFieldsBasedOnSelection(value);
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
                        ),
                        SizedBox(height: 30),
                        Center(
                          child: SizedBox(
                            height: 50,
                            width: 150,
                            child: MaterialButton(
                              color: Colors.blue.shade700,
                              onPressed: () {},
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
