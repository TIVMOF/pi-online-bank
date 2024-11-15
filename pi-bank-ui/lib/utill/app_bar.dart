// ignore_for_file: prefer_const_constructors

import 'package:flutter/material.dart';

class MyAppBar extends StatelessWidget {
  final String first_name;
  final String second_name;

  const MyAppBar({
    super.key,
    required this.first_name,
    required this.second_name,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topLeft,
      child: Container(
        width: 600,
        decoration: BoxDecoration(
            color: Colors.blue.shade800,
            borderRadius: BorderRadius.only(
              bottomRight: Radius.circular(95),
            )),
        child: Padding(
          padding: const EdgeInsets.only(left: 30.0, top: 10.0, bottom: 10.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    first_name,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    ' ' + second_name,
                    style: TextStyle(
                      fontSize: 28,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
