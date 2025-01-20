import { BankAccountRepository as BankAccountDao } from "../gen/pi-bank-backend/dao/bankAccount/BankAccountRepository";
import { CardRepository as CardDao } from "../gen/pi-bank-backend/dao/card/CardRepository";
import { TransactionRepository as TransactionDao } from "../gen/pi-bank-backend/dao/transaction/TransactionRepository";
import { UserRepository as UserDao } from "../gen/pi-bank-backend/dao/user/UserRepository";

import { Controller, Get, Put, Post, response } from "sdk/http";

const keycloakTokenEndpoint = "https://keycloak.proper-invest.tech/realms/pi-bank/protocol/openid-connect/token";

@Controller
class BankService {
    private readonly bankAccountDao;
    private readonly cardDao;
    private readonly transactionDao;
    private readonly userDao;

    constructor() {
        this.bankAccountDao = new BankAccountDao();
        this.cardDao = new CardDao();
        this.transactionDao = new TransactionDao();
        this.userDao = new UserDao();
    }

    @Get("/test")
    public test(): string {
        console.log("Endpoint hit!");

        const msg = "Hello from Pi Bank!";

        response.setHeader("Content-Lenght", msg.lenght);

        return msg;
    }

    @Post("/userId")
    public async userLogin(body: any) {
        let username = body.username;
        let password = body.password;

        const user = await this.userDao.findAll({
            $filter: {
                equals: { Username: username, Password: password },
            },
        });

        if (!user || user.length === 0) {
            return {
                statusCode: 404,
                body: { message: "Invalid username or password" },
            };
        }

        return { "userId": user[0].Id };
    }
}
