// ignore_for_file: prefer_const_literals_to_create_immutables, prefer_const_constructors

import 'package:flutter/material.dart';
import '../utill/app_bar.dart';
import '../utill/read_more.dart';
import '../utill/bill_item.dart';
import '../utill/bottom_app_bar.dart';
import '../utill/my_bill.dart';

class BillsPage extends StatefulWidget {
  final BuildContext context;

  const BillsPage({
    required this.context,
  });

  @override
  State<BillsPage> createState() => _BillsPageState();
}

class _BillsPageState extends State<BillsPage> {
  final _controller = PageController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: this.context),
      body: SafeArea(
          child: Column(
        children: [
          MyAppBar(first_name: 'Вашите', second_name: 'Сметки'),
          MyRead(
            content: 'Скорошни сметки',
            trimLines: 2,
            align: TextAlign.center,
            size: 25,
            weight: FontWeight.bold,
          ),
          Container(
            height: 540,
            padding: EdgeInsets.only(right: 5),
            child: Scrollbar(
              controller: _controller,
              child: ListView(
                scrollDirection: Axis.vertical,
                controller: _controller,
                children: [
                  MyBill(billName: 'BILLA', billItems: [
                    MyBillItem(number: 2, itemName: 'Мляко', price: 2.50),
                    MyBillItem(number: 4, itemName: 'Пастет', price: 3.99),
                    MyBillItem(
                        number: 2, itemName: 'Хляб Добруджа', price: 2.00),
                    MyBillItem(
                        number: 3, itemName: 'Кола Coca Cola', price: 2.50),
                  ]),
                  MyBill(billName: 'Fantastico', billItems: [
                    MyBillItem(
                        number: 4, itemName: 'Бонбони Рафаело', price: 7.80),
                    MyBillItem(
                        number: 1, itemName: 'Лютеница Хорцето', price: 2.99),
                    MyBillItem(
                        number: 2, itemName: 'Хляб Добруджа', price: 2.00),
                    MyBillItem(number: 3, itemName: 'Fanta', price: 2.50),
                    MyBillItem(
                        number: 4, itemName: 'Носни кърпи Сухо', price: 4.50),
                  ]),
                  MyBill(billName: 'JUMBO', billItems: [
                    MyBillItem(
                        number: 2, itemName: 'Плюшено мече', price: 25.50),
                    MyBillItem(
                        number: 4,
                        itemName: 'Химикалки Фабър Кастел',
                        price: 3.99),
                    MyBillItem(
                        number: 3, itemName: 'Тетрадки Бабу', price: 2.00),
                  ]),
                  MyBill(billName: 'BILLA', billItems: [
                    MyBillItem(number: 2, itemName: 'Мляко', price: 2.50),
                    MyBillItem(
                        number: 2,
                        itemName: 'Зърнена закуска Нескуик',
                        price: 9.99),
                    MyBillItem(
                        number: 2, itemName: 'Хляб Добруджа', price: 2.00),
                    MyBillItem(
                        number: 3, itemName: 'Кола Coca Cola', price: 2.50),
                  ]),
                ],
              ),
            ),
          )
        ],
      )),
    );
  }
}
