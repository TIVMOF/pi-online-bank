import 'package:flutter/material.dart';

class MyTransaction extends StatelessWidget {
  final String recipient;
  final String date;
  final double sum;
  final bool sentOrReceived;

  MyTransaction({
    super.key,
    required this.recipient,
    required this.date,
    required this.sum,
    required this.sentOrReceived,
  });

  final backgroundSent = Color.fromARGB(255, 189, 201, 226);
  final textSent = 'Към:';
  final colorSent = Color.fromARGB(137, 234, 17, 1);
  final minus = '-';

  final backgroundReceived = Color.fromARGB(255, 194, 219, 235);
  final textReceived = 'От:';
  final colorReceived = Color.fromARGB(130, 0, 94, 17);
  final plus = '+';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
      child: Container(
        height: 80,
        padding: EdgeInsets.only(top: 15, bottom: 15, left: 10, right: 10),
        decoration: BoxDecoration(
            color: sentOrReceived ? backgroundReceived : backgroundSent,
            borderRadius: BorderRadius.circular(5),
            boxShadow: [
              BoxShadow(
                color: Color.fromARGB(193, 158, 158, 158).withOpacity(0.5),
                spreadRadius: 5,
                blurRadius: 10,
                offset: Offset(4, 8),
              )
            ]),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      sentOrReceived ? textReceived : textSent,
                      overflow: TextOverflow.ellipsis,
                      style:
                          TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(
                      width: 10,
                    ),
                    Text(
                      recipient,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    Text(
                      'Прехвърлени:',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade800,
                      ),
                    ),
                    SizedBox(
                      width: 5,
                    ),
                    Text(
                      date,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            Text(
              (sentOrReceived ? plus : minus) +
                  ' ' +
                  sum.toStringAsFixed(2) +
                  'лв',
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 18,
                color: sentOrReceived ? colorReceived : colorSent,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
