import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppBarBottom extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BottomAppBar(
      color: Colors.grey.shade200,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: <Widget>[
          IconButton(
            icon: Icon(
              Icons.question_answer,
              color: Colors.blue.shade800,
            ),
            onPressed: () {
              HapticFeedback.vibrate();
              Navigator.pushNamed(context, '/about'); // Use named route
            },
          ),
          IconButton(
            icon: Icon(
              Icons.home,
              color: Colors.blue.shade800,
            ),
            onPressed: () {
              HapticFeedback.vibrate();
              Navigator.pushNamed(context, '/home'); // Use named route
            },
          ),
          IconButton(
            icon: Icon(
              Icons.settings,
              color: Colors.blue.shade800,
            ),
            onPressed: () {
              HapticFeedback.vibrate();
              Navigator.pushNamed(context, '/settings'); // Use named route
            },
          ),
        ],
      ),
    );
  }
}
