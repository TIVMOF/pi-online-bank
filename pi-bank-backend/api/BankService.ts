import { BankAccountRepository as BankAccountDao } from "../gen/pi-bank-backend/dao/bankAccount/BankAccountRepository";
import { CardRepository as CardDao } from "../gen/pi-bank-backend/dao/card/CardRepository";
import { TransactionRepository as TransactionDao } from "../gen/pi-bank-backend/dao/transaction/TransactionRepository";
import { UserRepository as UserDao } from "../gen/pi-bank-backend/dao/user/UserRepository";
import { CardTypeRepository as CardTypeDao } from "../gen/pi-bank-backend/dao/Settings/CardTypeRepository"

import { Controller, Get, Put, Post, response } from "sdk/http";

const keycloakTokenEndpoint = "https://keycloak.proper-invest.tech/realms/pi-bank/protocol/openid-connect/token";

@Controller
class BankService {
    private readonly bankAccountDao;
    private readonly cardDao;
    private readonly transactionDao;
    private readonly userDao;
    private readonly cardTypeDao;

    constructor() {
        this.bankAccountDao = new BankAccountDao();
        this.cardDao = new CardDao();
        this.transactionDao = new TransactionDao();
        this.userDao = new UserDao();
        this.cardTypeDao = new CardTypeDao();
    }

    @Get("/test")
    public test(): string {
        const msg = "Hello from Pi Bank!";

        response.setStatus(response.OK);
        return msg;
    }

    @Get("/cards/:userId")
    public getCards(_: any, ctx: any) {
        const userId = ctx.pathParameters.userId;

        const user = this.userDao.findById(userId);

        if (!user) {
            response.setStatus(response.NOT_FOUND);
            return { message: "User with that ID doesn't exist!" };
        }

        try {
            const userBankAccounts = this.bankAccountDao.findAll({
                $filter: {
                    equals: { User: userId }
                },
            });

            const allCards = this.cardDao.findAll();

            let userCards: any = [];

            userBankAccounts.forEach(bankAccount => {
                allCards.forEach(card => {
                    if (card.BankAccount === bankAccount.Id) {
                        userCards.push(card);
                    }
                })
            })

            const finalizaedUserCards = userCards.map(card => {
                const expirationDate = new Date(card.ExpirationDate);

                const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
                const year = expirationDate.getFullYear().toString().slice(-2);

                const formattedDate = `${month}/${year}`;

                return {
                    "CardNumber": card.CardNumber,
                    "ExpirationDate": formattedDate,
                    "CardType": this.cardTypeDao.findById(card.CardType).Name,
                    "Balance": this.bankAccountDao.findById(card.BankAccount).Amount
                }
            });

            response.setStatus(response.OK);
            return { "UserCards": finalizaedUserCards };

        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
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

            const username = body.Username;
            const password = body.Password;

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

        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }
}