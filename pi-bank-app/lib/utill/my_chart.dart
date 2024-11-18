import 'package:syncfusion_flutter_charts/charts.dart';
import 'package:flutter/material.dart';

class MyChart extends StatelessWidget {
  final String title;

  const MyChart({
    super.key,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 20),
      child: SizedBox(
        height: 500,
        child: SfCartesianChart(
          backgroundColor: Colors.grey[300],
          legend: Legend(
            isVisible: true,
            position: LegendPosition.bottom,
            textStyle: TextStyle(
              fontSize: 20,
              color: Colors.black,
            ),
            iconHeight: 25,
            iconWidth: 25,
          ),
          primaryXAxis: CategoryAxis(
            interval: 1,
            maximum: 6, // Adjusted from `visibleMaximum`
            minimum: 3, // Adjusted from `visibleMinimum`
            labelStyle: TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          primaryYAxis: NumericAxis(
            labelFormat: '{value} лв',
            labelStyle: TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          zoomPanBehavior: ZoomPanBehavior(
            enablePanning: true,
          ),
          enableAxisAnimation: true,
          title: ChartTitle(
            text: title,
            textStyle: TextStyle(
              fontSize: 20,
              color: Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
          tooltipBehavior: TooltipBehavior(
            enable: true,
            color: Colors.grey.shade400,
            textStyle: TextStyle(
              color: Colors.black,
              fontSize: 18,
            ),
          ),
          series: <CartesianSeries>[
            AreaSeries<ChartData, String>(
              name: 'Разплащания',
              dataSource: [
                ChartData('Януари', 35),
                ChartData('Февруари', 28),
                ChartData('Март', 34),
                ChartData('Април', 32),
                ChartData('Май', 40),
                ChartData('Юни', 45),
                ChartData('Юли', 65),
                ChartData('Август', 89),
                ChartData('Септември', 40),
                ChartData('Ноември', 23),
                ChartData('Октомври', 69),
                ChartData('Декември', 34),
              ],
              color: Color.fromARGB(213, 0, 81, 255),
              xValueMapper: (ChartData data, _) => data.x,
              yValueMapper: (ChartData data, _) => data.y,
            ),
            AreaSeries<ChartData, String>(
              name: 'Доходи',
              dataSource: [
                ChartData('Януари', 25),
                ChartData('Февруари', 67),
                ChartData('Март', 58),
                ChartData('Април', 32),
                ChartData('Май', 56),
                ChartData('Юни', 80),
                ChartData('Юли', 54),
                ChartData('Август', 53),
                ChartData('Септември', 78),
                ChartData('Ноември', 43),
                ChartData('Октомври', 39),
                ChartData('Декември', 40),
              ],
              color: Color.fromARGB(136, 0, 174, 255),
              xValueMapper: (ChartData data, _) => data.x,
              yValueMapper: (ChartData data, _) => data.y,
            ),
          ],
        ),
      ),
    );
  }
}

class ChartData {
  ChartData(this.x, this.y);
  final String x;
  final double y;
}
