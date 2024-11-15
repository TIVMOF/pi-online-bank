import 'package:flutter/material.dart';
import '../utill/my_transaction.dart';
import '../utill/read_more.dart';

import '../utill/app_bar.dart';
import '../utill/bottom_app_bar.dart';

class TransactionPage extends StatefulWidget {
  const TransactionPage({super.key});

  @override
  State<TransactionPage> createState() => _TransactionPageState();
}

class _TransactionPageState extends State<TransactionPage> {
  final _controller = PageController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: context),
      body: SafeArea(
          child: Column(
        children: [
          MyAppBar(first_name: 'Трансакции', second_name: ''),

          // recent transactions
          MyRead(
              content: 'Скорошни трансакции',
              trimLines: 2,
              align: TextAlign.center,
              size: 25,
              weight: FontWeight.bold),

          Container(
            height: 540,
            child: Padding(
              padding: const EdgeInsets.only(right: 5),
              child: Scrollbar(
                controller: _controller,
                child: ListView(
                  scrollDirection: Axis.vertical,
                  controller: _controller,
                  children: [
                    MyTransaction(
                      recipient: 'Виктор Киров',
                      date: '01.02.2023',
                      sum: 20.00,
                      sentOrReceived: false,
                    ),
                    MyTransaction(
                      recipient: 'Виктор Киров',
                      date: '25.01.2023',
                      sum: 45.00,
                      sentOrReceived: true,
                    ),
                    MyTransaction(
                      recipient: 'Ния Божилска',
                      date: '06.02.2023',
                      sum: 45.50,
                      sentOrReceived: false,
                    ),
                    MyTransaction(
                      recipient: 'Велизар',
                      date: '16.02.2023',
                      sum: 30.50,
                      sentOrReceived: true,
                    ),
                  ],
                ),
              ),
            ),
          )
        ],
      )),
    );
  }
}
