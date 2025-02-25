import 'package:flutter/material.dart';

class MyTransaction extends StatelessWidget {
  final String recipient;
  final String date;
  final double sum;
  final String currency;
  final bool sentOrReceived;

  MyTransaction({
    super.key,
    required this.recipient,
    required this.date,
    required this.sum,
    required this.currency,
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
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Container(
        constraints: BoxConstraints(minHeight: 100),
        padding: EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: sentOrReceived ? backgroundReceived : backgroundSent,
          borderRadius: BorderRadius.circular(5),
          boxShadow: [
            BoxShadow(
              color: Color.fromARGB(193, 158, 158, 158),
              spreadRadius: 5,
              blurRadius: 10,
              offset: Offset(4, 8),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment:
                    MainAxisAlignment.spaceEvenly,
                children: [
                  Row(
                    children: [
                      Text(
                        sentOrReceived ? textReceived : textSent,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(width: 10),
                      Flexible(
                        child: Text(
                          recipient,
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 5),
                  Row(
                    children: [
                      Text(
                        'Дата:',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade800,
                        ),
                      ),
                      SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          date,
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(width: 10),
            Text(
              (sentOrReceived ? plus : minus) +
                  ' ' +
                  sum.toStringAsFixed(2) +
                  " " +
                  currency,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
              style: TextStyle(
                fontSize: 16,
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
