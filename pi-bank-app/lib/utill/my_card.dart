// ignore_for_file: prefer_const_constructors, prefer_const_literals_to_create_immutables, prefer_interpolation_to_compose_strings, prefer_typing_uninitialized_variables

import 'package:flutter/material.dart';

class MyCard extends StatelessWidget {

  final double balance;
  final int cardNumber;
  final int expiryDate;
  final int expiryMonth;
  final int expiryYear;
  final color;

  const MyCard({
    super.key,
    required this.balance,
    required this.cardNumber,
    required this.expiryDate,
    required this.expiryMonth,
    required this.expiryYear,
    required this.color,
    });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal:25.0),
      child: Container(
              width: 300,
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(15),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 10),
                  Text(
                    'Balance',
                    style: TextStyle(
                      color: Colors.white,
                      ),
                    ),
                  SizedBox(height: 10),
                  Text(
                    balance.toStringAsFixed(2) + 'лв',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      ),
                    ),
                  SizedBox(height: 30),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // card number
                      Text(
                        cardNumber.toString(),
                        style: TextStyle(
                          color: Colors.white,
                          ),
                        ),
                      // card expyre date
                      Text(
                        expiryDate.toString() + '/' + expiryMonth.toString() + '/' + expiryYear.toString(),
                        style: TextStyle(
                          color: Colors.white,
                          ),
                        ),
                  ],)
              ],)
            ),
    );
  }
}