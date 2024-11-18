import "package:flutter/material.dart";
import 'package:readmore/readmore.dart';

class MyRead extends StatelessWidget {
  final String content;
  final int trimLines;
  final TextAlign align;
  final double size;
  final FontWeight weight;

  const MyRead({
    super.key,
    required this.content,
    required this.trimLines,
    required this.align,
    required this.size,
    required this.weight
    });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
              child: Container(
                padding: EdgeInsets.only(right: 20, left: 20, bottom: 20),
                child: ReadMoreText(
                  content,
                  trimLines: trimLines,
                  textAlign: align,
                  trimMode: TrimMode.Line,
                  trimCollapsedText: ' Покажи още ',
                  trimExpandedText: ' Покажи по-малко ',
        
                  lessStyle: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blueGrey,
                  ),
        
                  moreStyle: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blueGrey,
                  ),
        
                  style: TextStyle(
                    fontSize: size,
                    height: 2,
                    fontWeight: weight,
                  ),
                  )
              ),
            );
  }
}