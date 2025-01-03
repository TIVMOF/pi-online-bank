import 'package:flutter/material.dart';

class MyBillItem extends StatelessWidget {
  final int number;
  final String itemName;
  final double price;

  const MyBillItem({
    super.key,
    required this.number,
    required this.itemName,
    required this.price,
    });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            number.toString() + ' ' + itemName,
            style: TextStyle(
              fontSize: 16,
            ),
          ),
        ),
        Text(
          price.toStringAsFixed(2) + 'лв',
          style: TextStyle(
            fontSize: 16,
          ),
        ),
      ],
    );
  }
}