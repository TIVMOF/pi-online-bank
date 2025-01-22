import 'package:syncfusion_flutter_charts/charts.dart';
import 'package:flutter/material.dart';

class MyChart extends StatelessWidget {
  final String title;
  final List<ChartData> series1Data;
  final List<ChartData> series2Data;
  final String series1Name;
  final String series2Name;

  const MyChart({
    super.key,
    required this.title,
    required this.series1Data,
    required this.series2Data,
    this.series1Name = 'Series 1',
    this.series2Name = 'Series 2',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: SizedBox(
        height: 500,
        child: SfCartesianChart(
          backgroundColor: Colors.grey[300],
          legend: Legend(
            isVisible: true,
            position: LegendPosition.bottom,
            textStyle: const TextStyle(
              fontSize: 14,
              color: Colors.black,
            ),
            iconHeight: 20,
            iconWidth: 20,
          ),
          primaryXAxis: CategoryAxis(
            labelStyle: const TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          primaryYAxis: NumericAxis(
            labelFormat: '{value} лв',
            labelStyle: const TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          zoomPanBehavior: ZoomPanBehavior(
            enablePanning: true,
          ),
          title: ChartTitle(
            text: title,
            textStyle: const TextStyle(
              fontSize: 18,
              color: Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
          tooltipBehavior: TooltipBehavior(
            enable: true,
            color: Colors.grey.shade400,
            textStyle: const TextStyle(
              color: Colors.black,
              fontSize: 14,
            ),
          ),
          series: <CartesianSeries>[
            AreaSeries<ChartData, String>(
              name: series1Name,
              dataSource: series1Data,
              color: const Color.fromARGB(213, 0, 81, 255),
              xValueMapper: (ChartData data, _) => data.x,
              yValueMapper: (ChartData data, _) => data.y,
            ),
            AreaSeries<ChartData, String>(
              name: series2Name,
              dataSource: series2Data,
              color: const Color.fromARGB(136, 0, 174, 255),
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
