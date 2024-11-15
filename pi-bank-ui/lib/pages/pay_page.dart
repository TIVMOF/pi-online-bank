import 'package:flutter/material.dart';
import '../utill/app_bar.dart';
import '../utill/bottom_app_bar.dart';
import '../utill/my_card.dart';

class PayPage extends StatefulWidget {
  final BuildContext context;

  const PayPage({
    required this.context,
  });

  @override
  State<PayPage> createState() => _PayPageState();
}

class _PayPageState extends State<PayPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: context),
      body: SafeArea(
          child: Column(
        children: [
          MyAppBar(first_name: 'Плати', second_name: 'Сега'),
          Padding(
            padding: const EdgeInsets.all(25.0),
            child: MyCard(
                balance: 2000,
                cardNumber: 12345678,
                expiryDate: 03,
                expiryMonth: 04,
                expiryYear: 2024,
                color: Colors.black),
          ),
        ],
      )),
    );
  }
}
