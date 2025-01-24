import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class MyCard extends StatelessWidget {
  final double balance;
  final String cardNumber;
  final String expiryDate;
  final String currency;
  final String cv;
  final color;
  final bool isHidden;

  const MyCard(
      {super.key,
      required this.balance,
      required this.cardNumber,
      required this.expiryDate,
      required this.currency,
      required this.color,
      required this.cv,
      required this.isHidden});

  @override
  Widget build(BuildContext context) {
    String maskedCardNumber = isHidden
        ? '**** **** **** ' + cardNumber.substring(cardNumber.length - 4)
        : cardNumber.replaceAllMapped(
            RegExp(r".{4}"), (match) => '${match.group(0)} ');

    String maskedCV = isHidden ? '***' : cv;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 25.0),
      child: Container(
        width: 300,
        padding: EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(15),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Container(
                      height: 35,
                      decoration: BoxDecoration(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(12.0),
                      ),
                      child: Image.asset("lib/icons/PI_Logo-transparent.png"),
                    ),
                    SizedBox(width: 5),
                    Text(
                      "Proper Invest Bank",
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 20),
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: 10),
            if (isHidden) ...[
              Text(
                'Balance',
                style: TextStyle(
                  color: Colors.white,
                ),
              ),
              Text(
                balance.toStringAsFixed(2) + " " + currency,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                ),
              ),
            ],
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isHidden)
                  Text(
                    'Card Number',
                    style: TextStyle(
                      color: Colors.white54,
                      fontSize: 12,
                    ),
                  ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Text(
                      maskedCardNumber,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: isHidden ? 16 : 20,
                      ),
                    ),
                    if (!isHidden)
                      IconButton(
                        icon: Icon(Icons.copy, color: Colors.white),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: cardNumber));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text("Card number copied to clipboard"),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  children: [
                    if (!isHidden)
                      Text(
                        'Expiry Date',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    Text(
                      expiryDate,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: isHidden ? 15 : 18,
                      ),
                    ),
                  ],
                ),
                Column(
                  children: [
                    if (!isHidden)
                      Text(
                        'CVV',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    Text(
                      maskedCV,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: isHidden ? 15 : 18,
                      ),
                    ),
                  ],
                )
              ],
            ),
          ],
        ),
      ),
    );
  }
}
