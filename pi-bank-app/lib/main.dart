import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:online_bank/pages/statistics_page.dart';
import 'package:online_bank/pages/transfer_page.dart';
import 'package:online_bank/pages/home_page.dart';
import 'package:online_bank/pages/login_page.dart';
import 'package:online_bank/pages/about_page.dart';
import 'package:online_bank/pages/settings_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp])
      .then((_) {
    runApp(MyApp());
  });
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Proper Invest Bank',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => LoginPage(),
        '/home': (context) => HomePage(),
        '/about': (context) => AboutPage(),
        '/settings': (context) => SettingsPage(),
        '/transfer': (context) => SendPage(),
        '/statistics': (context) => StatsPage()
      },
    );
  }
}
