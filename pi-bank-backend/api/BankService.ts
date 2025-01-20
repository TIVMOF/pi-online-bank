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
        const msg = "Hello from Pi Bank!";

        response.setStatus(response.OK);
        return msg;
    }

    @Post("/userLogin")
    public userLogin(body: any) {
        try {
            const requiredFields = ["Username", "Password"];

            for (const field of requiredFields) {
                if (!body.hasOwnProperty(field)) {
                    response.setStatus(response.BAD_REQUEST);
                    return { message: `Missing property: ${field}` };
                }
            }

            let username = body.Username;
            let password = body.Password;

            const user = this.userDao.findAll({
                $filter: {
                    equals: { Username: username, Password: password },
                },
            });

            if (!user || user.length === 0) {
                response.setStatus(response.NOT_FOUND);
                return { message: "Invalid username or password" };
            }

            response.setStatus(response.OK);
            return { "UserId": user[0].Id };

        } catch (e) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }
}