// ignore_for_file: prefer_const_literals_to_create_immutables, prefer_const_constructors, sized_box_for_whitespace

import 'package:flutter/material.dart';
import 'statistics_page.dart';
import 'transaction_page.dart';
import '../utill/app_bar.dart';
import '../utill/bottom_app_bar.dart';
import '../utill/my_card.dart';
import '../utill/my_list_tile.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:online_bank/pages/send_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _controller = PageController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: context),
      body: SafeArea(
        child: Column(
          children: [
            // app bar
            MyAppBar(first_name: 'Proper Invest', second_name: 'Bank'),

            SizedBox(
              height: 25,
            ),

            // cards
            Container(
                height: 180,
                child: PageView(
                  scrollDirection: Axis.horizontal,
                  controller: _controller,
                  children: [
                    MyCard(
                      balance: 5250.20,
                      cardNumber: 12345678,
                      expiryDate: 4,
                      expiryMonth: 10,
                      expiryYear: 24,
                      color: Colors.deepPurple,
                    ),
                    MyCard(
                      balance: 4250.24,
                      cardNumber: 11345678,
                      expiryDate: 5,
                      expiryMonth: 11,
                      expiryYear: 23,
                      color: Colors.deepOrange,
                    ),
                    MyCard(
                      balance: 250.99,
                      cardNumber: 12355678,
                      expiryDate: 3,
                      expiryMonth: 12,
                      expiryYear: 25,
                      color: Colors.blue,
                    ),
                  ],
                )),

            SizedBox(height: 15),

            SmoothPageIndicator(
              controller: _controller,
              count: 3,
              effect: ExpandingDotsEffect(
                activeDotColor: Colors.blue.shade900,
              ),
            ),

            SizedBox(height: 20),

            // column -> stats + transaction
            Padding(
              padding: const EdgeInsets.all(25.0),
              child: Column(
                children: [
                  //Send
                  MyListTile(
                    iconImagePath: 'lib/icons/send.png',
                    tileTitle: 'Преводи',
                    tileSubtitle: 'Прати по сметка',
                    page: SendPage(context: context),
                  ),

                  //Stats
                  MyListTile(
                    iconImagePath: 'lib/icons/statistics.png',
                    tileTitle: 'Статистики',
                    tileSubtitle: 'Разплащания',
                    page: StatsPage(),
                  ),

                  //Transactions
                  MyListTile(
                    iconImagePath: 'lib/icons/lending.png',
                    tileTitle: 'Трансакции',
                    tileSubtitle: 'История',
                    page: TransactionPage(),
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
