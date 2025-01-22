import { BankAccountRepository as BankAccountDao } from "../gen/pi-bank-backend/dao/bankAccount/BankAccountRepository";
import { CardRepository as CardDao } from "../gen/pi-bank-backend/dao/card/CardRepository";
import { TransactionRepository as TransactionDao } from "../gen/pi-bank-backend/dao/transaction/TransactionRepository";
import { UserRepository as UserDao } from "../gen/pi-bank-backend/dao/user/UserRepository";
import { CardTypeRepository as CardTypeDao } from "../gen/pi-bank-backend/dao/Settings/CardTypeRepository"
import { CurrencyRepository as CurrencyDao } from "../../codbex-currencies/gen/codbex-currencies/dao/Currencies/CurrencyRepository";
import { BankAccountTypeRepository as BankAccountTypeDao } from "../gen/pi-bank-backend/dao/Settings/BankAccountTypeRepository";

import { Controller, Get, Put, Post, response } from "sdk/http";

@Controller
class BankService {
    private readonly bankAccountDao;
    private readonly cardDao;
    private readonly transactionDao;
    private readonly userDao;
    private readonly cardTypeDao;
    private readonly currencyDao;
    private readonly bankAccountTypeDao;

    constructor() {
        this.bankAccountDao = new BankAccountDao();
        this.cardDao = new CardDao();
        this.transactionDao = new TransactionDao();
        this.userDao = new UserDao();
        this.cardTypeDao = new CardTypeDao();
        this.currencyDao = new CurrencyDao();
        this.bankAccountTypeDao = new BankAccountTypeDao();
    }

    @Get("/test")
    public test(): string {
        const msg = "Hello from Pi Bank!";

        response.setStatus(response.OK);
        return msg;
    }

    @Get("/userFromBankAccount/:bankAccountId")
    public getUserFromBankAccount(_: any, ctx: any) {
        const bankAccountId = ctx.pathParameters.bankAccountId;

        const bankAccount = this.bankAccountDao.findById(bankAccountId);

        if (!bankAccount) {
            response.setStatus(response.NOT_FOUND);
            return { message: "Bank Account with that ID doesn't exist!" };
        }

        const userId = bankAccount.User;

        const user = this.userDao.findById(userId);

        if (!user) {
            response.setStatus(response.NOT_FOUND);
            return { message: "User with that ID doesn't exist!" };
        }

        return user;
    }

    @Get("/bankAccounts/:userId")
    public getBankAccounts(_: any, ctx: any) {
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

            if (!userBankAccounts || userBankAccounts.length === 0) {
                response.setStatus(response.NOT_FOUND);
                return { message: "User doesn't have Bank Accounts!" };
            }

            const userIbans = userBankAccounts.map(bankAccount => {
                return {
                    "Id": bankAccount.Id,
                    "IBAN": bankAccount.IBAN,
                    "Amount": bankAccount.Amount,
                    "Currency": bankAccount.Currency,
                    "Type": bankAccount.Type
                };
            })

            response.setStatus(response.OK);
            return { "UserBankAccounts": userIbans };

        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }

    @Get("/bankAccount/:bankAccountId")
    public getBankAccountsFromBankAccountId(_: any, ctx: any) {
        const bankAccountId = ctx.pathParameters.bankAccountId;

        const bankAccount = this.bankAccountDao.findById(bankAccountId);

        if (!bankAccount) {
            response.setStatus(response.NOT_FOUND);
            return { message: "Bank Account with that ID doesn't exist!" };
        }

        response.setStatus(response.OK);
        return bankAccount;
    }

    @Get("/transactions/:userId")
    public getTransactions(_: any, ctx: any) {
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

            if (!userBankAccounts || userBankAccounts.length === 0) {
                response.setStatus(response.NOT_FOUND);
                return { message: "User doesn't have Bank Accounts!" };
            }

            const allTransactions = this.transactionDao.findAll();

            let userTransactions: any = [];

            userBankAccounts.forEach(bankAccount => {
                allTransactions.forEach(transaction => {
                    if (transaction.Reciever === bankAccount.Id || transaction.Sender === bankAccount.Id) {
                        userTransactions.push(transaction);
                    }
                })
            })

            if (!userTransactions || userTransactions.length === 0) {
                response.setStatus(response.NOT_FOUND);
                return { message: "User doesn't have Transactions!" };
            }

            const finalizaedUserTransactions = userTransactions.map(transaction => {
                const dateObject = new Date(transaction.Date);
                const date = dateObject.getDate();
                const month = dateObject.getMonth() + 1;
                const year = dateObject.getFullYear();

                const formattedDate = `${date} ${month} ${year}`;

                const recieverBankAccount = this.bankAccountDao.findById(transaction.Reciever);
                const senderBankAccount = this.bankAccountDao.findById(transaction.Sender);

                const reciever = this.userDao.findById(recieverBankAccount.User);
                const sender = this.userDao.findById(senderBankAccount.User);

                return {
                    "Sender Id": sender.Id,
                    "Receiver": reciever.Username,
                    "Sender": sender.Username,
                    "Amount": transaction.Amount,
                    "Date": formattedDate
                }
            })

            response.setStatus(response.OK);
            return { "UserTransactions": finalizaedUserTransactions };

        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }

    @Get("/userInteractions/:userId")
    public getUserInteractions(_: any, ctx: any) {
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

            if (!userBankAccounts || userBankAccounts.length === 0) {
                response.setStatus(response.NOT_FOUND);
                return { message: "User doesn't have Bank Accounts!" };
            }

            const allTransactions = this.transactionDao.findAll();

            let userTransactions: any = [];

            userBankAccounts.forEach(bankAccount => {
                allTransactions.forEach(transaction => {
                    if (transaction.Reciever === bankAccount.Id || transaction.Sender === bankAccount.Id) {
                        userTransactions.push(transaction);
                    }
                })
            })

            if (!userTransactions || userTransactions.length === 0) {
                response.setStatus(response.NOT_FOUND);
                return { message: "User doesn't have Transactions!" };
            }

            const allBankAccounts = this.bankAccountDao.findAll();
            let userInteractions: any = [];

            allBankAccounts.forEach(bankAccount => {
                userTransactions.forEach(transaction => {
                    if (transaction.Sender === bankAccount.Id || transaction.Reciever === bankAccount.Id) {
                        const user = this.userDao.findById(bankAccount.User);

                        userInteractions.push({
                            "Name:": user.Username,
                            "IBAN": bankAccount.IBAN,
                            "BankAccountId": bankAccount.Id,
                            "Amount": bankAccount.Amount
                        })
                    }
                })
            })

            userInteractions = Array.from(
                new Set(userInteractions.map(interaction => JSON.stringify(interaction)))
            ).map(jsonString => JSON.parse(jsonString));

            response.setStatus(response.OK);
            return userInteractions;

        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
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

            if (!userBankAccounts || userBankAccounts.length === 0) {
                response.setStatus(response.NOT_FOUND);
                return { message: "User doesn't have Bank Accounts!" };
            }

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

    @Get("/currencyCode/:currencyId")
    public getCurrency(_: any, ctx: any) {
        const currencyId = ctx.pathParameters.currencyId;

        const currency = this.currencyDao.findById(currencyId);

        if (!currency) {
            response.setStatus(response.NOT_FOUND);
            return { message: "Currency with that ID doesn't exist!" };
        }

        return { "CurrencyCode": currency.Code };
    }

    @Get("/bankAccountType/:typeId")
    public getbankAccountType(_: any, ctx: any) {
        const typeId = ctx.pathParameters.typeId;

        const bankAccountType = this.bankAccountTypeDao.findById(typeId);

        if (!bankAccountType) {
            response.setStatus(response.NOT_FOUND);
            return { message: "Bank Account Type with that ID doesn't exist!" };
        }

        return { "BankAccountType": bankAccountType.Name };
    }

    @Put("/updateBankAccountAmount/:bankAccountId")
    public updateBankAccountAmount(body: any, ctx: any) {
        const bankAccountId = ctx.pathParameters.bankAccountId;

        const bankAccount = this.bankAccountDao.findById(bankAccountId);

        if (!bankAccount) {
            response.setStatus(response.NOT_FOUND);
            return { message: "Bank Account with that ID doesn't exist!" };
        }

        try {
            if (!body.hasOwnProperty("Amount")) {
                response.setStatus(response.BAD_REQUEST);
                return { message: "Missing property: Amount" };
            }

            const newAmount = body.Amount;

            if (!(typeof (newAmount) === 'number')) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Amount not a number!` };
            }

            if (newAmount <= 0) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Amount bellow or equals zero!` };
            }

            const updatedBankAccount = {
                "Id": bankAccountId,
                "Name": bankAccount.Name,
                "IBAN": bankAccount.IBAN,
                "User": bankAccount.User,
                "Amount": newAmount,
                "Currency": bankAccount.Currency,
                "Type": bankAccount.Type,
                "Status": bankAccount.Status,
                "CreationDate": bankAccount.CreationDate
            }

            this.bankAccountDao.update(updatedBankAccount);

            response.setStatus(response.OK);
            return {
                message: "Amount successfully updated!"
            };

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

    @Post("/bankAccountFromIBAN")
    public getBankAccountFromIBAN(body: any) {
        try {
            if (!body.hasOwnProperty("IBAN")) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Missing property: IBAN` };
            }

            const userIBAN = body["IBAN"];
            const allBankAccounts = this.bankAccountDao.findAll();

            for (const bankAccount of allBankAccounts) {
                if (bankAccount.IBAN === userIBAN) {
                    response.setStatus(response.OK);
                    return bankAccount;
                }
            }

            response.setStatus(response.NOT_FOUND);
            return { message: "Bank account with that IBAN doesn't exist!" };

        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }

    @Post("/transaction")
    public createTransaction(body: any) {
        try {
            const requiredFields = ["Reciever", "Sender", "Amount"];

            for (const field of requiredFields) {
                if (!body.hasOwnProperty(field)) {
                    response.setStatus(response.BAD_REQUEST);
                    return { message: `Missing property: ${field}` };
                }
            }

            const reciever = this.bankAccountDao.findById(body["Reciever"]);

            if (!reciever) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Bank account with ID ${body["Reciever"]} not found!` };
            }

            const sender = this.bankAccountDao.findById(body["Sender"]);

            if (!sender) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Bank account with ID ${body["Sender"]} not found!` };
            }

            const amount = body["Amount"];

            if (!(typeof (amount) === 'number')) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Amount not a number!` };
            }

            if (amount <= 0) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Amount bellow or equals zero!` };
            }

            const newTransaction = this.transactionDao.create(body);

            if (!newTransaction) {
                throw new Error("Failed transaction!");
            }

            response.setStatus(response.CREATED);
            return newTransaction;

        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }
}