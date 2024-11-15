// ignore_for_file: prefer_const_constructors, sort_child_properties_last

import "package:flutter/material.dart";
import 'package:online_bank/utill/app_bar.dart';
import 'package:online_bank/utill/bottom_app_bar.dart';

class SendPage extends StatefulWidget{

  final BuildContext context;
  
  const SendPage({
    required this.context,
  });

  @override
  State<SendPage> createState() => _SendPageState();
}

class _SendPageState extends State<SendPage> with TickerProviderStateMixin{
  late AnimationController _controller;
  late Animation _animation;
  bool isActive = false;
  final _formKey = GlobalKey<FormState>();
  final formKey = GlobalKey<FormState>();

  @override
  void initState() {
    _controller = AnimationController(vsync: this, duration: Duration(seconds: 6));
    _animation = Tween<double>(begin: 0, end: 1).animate(_controller);
    super.initState();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void startAnimation() {
    setState(() {
      isActive = true;
    });
    _controller.forward();
  }

  void stopAnimation() {
    setState(() {
      isActive = false;
    });
    _controller.stop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: this.context),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: Column(children: [
            // app bar
            MyAppBar(first_name: 'Прати', second_name: 'Пари'),
        
            SizedBox(height: 40),
        
            // sending animation
            Container(
              alignment: Alignment.center,
              child: AnimatedBuilder(
                animation: _animation,
                builder: (context, child) {
                  return SizedBox(
                    height: 300,
                    width: 300,
                    child: CircularProgressIndicator(
                      value: _animation.value,
                      backgroundColor: Colors.white,
                      valueColor: AlwaysStoppedAnimation(Colors.blue),
                      strokeWidth: 20.0,
                    ),
                  );
                },
                ),
            ),

            SizedBox(height: 35,),

            Container(child: 
              Form(
                key: formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // choose amount of money
                    TextFormField(
                      decoration: InputDecoration(
                        labelText: "Въведи сума:"
                      ),
                    )
                  ],
                )
                ),
            ),
            

            // where to send
            

            SizedBox(height: 25,),
        
            // send button
            SizedBox(
              height: 50,
              width: 100,
              child: MaterialButton(
                color: Colors.blue.shade700,
                onPressed: isActive ? stopAnimation: startAnimation,
                child: Text(
                  'Прати',
                  style: TextStyle(
                    fontSize: 20,
                    color: Colors.white,
                  ),
                  ),
                ),
            )
        
          ],),
        ),
        ),
    );
  }
}