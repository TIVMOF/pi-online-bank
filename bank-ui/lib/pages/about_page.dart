// ignore_for_file: prefer_const_constructors, prefer_const_literals_to_create_immutables
import "package:flutter/material.dart";
import '../utill/app_bar.dart';
import '../utill/bottom_app_bar.dart';
import '../utill/read_more.dart';

class AboutPage extends StatefulWidget {
  final BuildContext context;

  AboutPage({
    required this.context,
  });

  @override
  State<AboutPage> createState() => _AboutPageState();
}

class _AboutPageState extends State<AboutPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[300],
      bottomNavigationBar: AppBarBottom(context: context),
      resizeToAvoidBottomInset: false,
      body: SafeArea(
          child: SingleChildScrollView(
        child: Column(
          children: [
            MyAppBar(first_name: 'За', second_name: 'Нас'),

            // About the bank
            MyRead(
                content: 'Proper Invest Bank',
                trimLines: 1,
                align: TextAlign.center,
                size: 25,
                weight: FontWeight.bold),

            MyRead(
                content:
                    '„Пропър Инвест Банк“ АД е учредена на 10 октомври 2022 година Акционерният капитал на Банката възлиза на 13 000  лева и е разпределен на 13 безналични, поименни акции, всяка с номинална стойност 1 000.00 лева и право на глас.',
                trimLines: 7,
                align: TextAlign.justify,
                size: 16,
                weight: FontWeight.normal),

            MyRead(
                content:
                    '„Пропър Инвест Банк“ АД има двустепенна форма на управление, състояща се от Надзорен и Управителен съвет.',
                trimLines: 3,
                align: TextAlign.justify,
                size: 16,
                weight: FontWeight.normal),

            MyRead(
                content:
                    'Ние сме малка, но качествена финансова институция и осигуряваме конфиденциалност и защита интересите на клиентите на банката. Стремим се към: Непрекъснато повишаване качеството на обслужване на своите клиентите; Изграждане на финансово стабилна и просперираща институция; Увеличаване броя и качеството на предлаганите услуги; Повишаване ефективността от дейността й; Понататъшно ускоряване развитието и усъвършенстване на използваните информационни технологии.',
                trimLines: 4,
                align: TextAlign.justify,
                size: 16,
                weight: FontWeight.normal),

            MyRead(
                content:
                    'Ние ще ви помогнем: Да увеличите средствата чрез депозит; Да увеличите капитала си чрез набирателна сметка; Да плащате и разполагате със средства навсякъде, лесно и удобно с банкова платежна карта; Да закупите мечтания си дом;',
                trimLines: 1,
                align: TextAlign.justify,
                size: 16,
                weight: FontWeight.normal),

            MyRead(
                content:
                    'Банкови продукти и услуги: Банкови сметки-(Разплащателна сметка, Набирателна сметка, Депозитна сметка, Спестовна сметка); Ипотечни кредити; Вложения-(Влогове и депозити); Банкови платежни карти-(Дебитни и кредитни карти); Банкови платежни документи;',
                trimLines: 1,
                align: TextAlign.justify,
                size: 16,
                weight: FontWeight.normal),

            MyRead(
                content:
                    'Нашата подготовка: Гарантиране на влоговете и депозитите със закон; Съставяне на регламентиран законен договор за всяка услуга; Съставяне на документите от надежден и високо компетентен екип;',
                trimLines: 1,
                align: TextAlign.justify,
                size: 16,
                weight: FontWeight.normal),

            MyRead(
                content: 'Ние сме ПРАВИЛНИЯТ ИЗБОР!',
                trimLines: 2,
                align: TextAlign.center,
                size: 20,
                weight: FontWeight.bold),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15),
              child: Divider(
                color: Colors.grey,
                thickness: 3,
              ),
            ),

            // About the app
            MyRead(
                content: 'PI Smart',
                trimLines: 2,
                align: TextAlign.center,
                size: 25,
                weight: FontWeight.bold),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15),
              child: Divider(
                color: Colors.grey,
                thickness: 3,
              ),
            ),

            // Creadits

            MyRead(
                content: 'Credits',
                trimLines: 2,
                align: TextAlign.center,
                size: 25,
                weight: FontWeight.bold),
          ],
        ),
      )),
    );
  }
}
