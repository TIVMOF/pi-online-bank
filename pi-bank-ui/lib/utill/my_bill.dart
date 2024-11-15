import 'package:flutter/material.dart';
import 'package:online_bank/utill/bill_item.dart';

class MyBill extends StatelessWidget {
  final String billName;
  final List<MyBillItem> billItems;

  MyBill({
    super.key,
    required this.billName,
    required this.billItems,
    });

  @override
  Widget build(BuildContext context) {
    double total = billItems.fold(
      0, (previousValue, item) => previousValue + (item.price * item.number)
      );

    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Color.fromARGB(255, 237, 248, 255),
          borderRadius: BorderRadius.circular(3),
          boxShadow: [
            BoxShadow(
              color: Color.fromARGB(140, 158, 158, 158),
              spreadRadius: 8,
              blurRadius: 10,
              offset: Offset(1, 8),
            )
          ]
        ),
        child: Column(children: [
          Text(
            billName,
            style: TextStyle(
              fontSize: 25,
            ),
          ),
    
          Divider(
            thickness: 2,
            color: Colors.black,
          ),
    
          Container(
            child: Column(
              children:
                billItems.map((item) {
                  return MyBillItem(
                    itemName: item.itemName,
                    number: item.number,
                    price: item.price * item.number,
                    );
                }).toList()
            ),
          ),

          Divider(
            thickness: 2,
            color: Colors.black,
          ),

          SizedBox(height: 10,),
    
          Row(
            children: [
              Text(
                'TOTAL: ' + total.toStringAsFixed(2) + 'лв',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          )
    
        ],),
      ),
    );
  }
}