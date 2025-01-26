import { BankAccountRepository as BankAccountDao } from "../gen/pi-bank-backend/dao/bankAccount/BankAccountRepository";
import { CardRepository as CardDao } from "../gen/pi-bank-backend/dao/card/CardRepository";
import { TransactionRepository as TransactionDao } from "../gen/pi-bank-backend/dao/transaction/TransactionRepository";
import { UserRepository as UserDao } from "../gen/pi-bank-backend/dao/user/UserRepository";
import { CardTypeRepository as CardTypeDao } from "../gen/pi-bank-backend/dao/Settings/CardTypeRepository";
import { BankAccountTypeRepository as BankAccountTypeDao } from "../gen/pi-bank-backend/dao/Settings/BankAccountTypeRepository";
import { BankAccountStatusRepository as BankAccountStatusDao } from "../gen/pi-bank-backend/dao/Settings/BankAccountStatusRepository";
import { CurrencyRepository as CurrencyDao } from "../../codbex-currencies/gen/codbex-currencies/dao/Currencies/CurrencyRepository";
import { CountryRepository as CountryDao } from "../../codbex-countries/gen/codbex-countries/dao/Countries/CountryRepository";

import { Controller, Get, Post, response } from "sdk/http";
import { process } from "sdk/bpm";

@Controller
class BankService {
    private readonly bankAccountDao;
    private readonly cardDao;
    private readonly transactionDao;
    private readonly userDao;
    private readonly cardTypeDao;
    private readonly bankAccountTypeDao;
    private readonly bankAccountStatusDao;
    private readonly currencyDao;
    private readonly countryDao;

    constructor() {
        this.bankAccountDao = new BankAccountDao();
        this.cardDao = new CardDao();
        this.transactionDao = new TransactionDao();
        this.userDao = new UserDao();
        this.cardTypeDao = new CardTypeDao();
        this.bankAccountTypeDao = new BankAccountTypeDao();
        this.bankAccountStatusDao = new BankAccountStatusDao();
        this.currencyDao = new CurrencyDao();
        this.countryDao = new CountryDao();
    }

    @Get("/test")
    public test(): string {
        const msg = "Hello from Pi Bank!";

        response.setStatus(response.OK);
        return msg;
    }

    @Get("/user/:userId")
    public getUser(_: any, ctx: any) {
        const userId = ctx.pathParameters.userId;

        const user = this.userDao.findById(userId);

        if (!user) {
            response.setStatus(response.NOT_FOUND);
            return { message: "User with that ID doesn't exist!" };
        }

        const countryName = this.countryDao.findById(user.Country).Name;

        return {
            "Username": user.Username,
            "Name": user.Name,
            "Password": user.Password,
            "Email": user.Email,
            "Phone": user.Phone,
            "Country": countryName
        }
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

                const formattedDate = `${date}:${month}:${year}`;

                const recieverBankAccount = this.bankAccountDao.findById(transaction.Reciever);
                const senderBankAccount = this.bankAccountDao.findById(transaction.Sender);

                const reciever = this.userDao.findById(recieverBankAccount.User);
                const sender = this.userDao.findById(senderBankAccount.User);

                const currencyCode = this.currencyDao.findById(transaction.Currency).Code;

                return {
                    "SenderId": sender.Id,
                    "Receiver": reciever.Username,
                    "Sender": sender.Username,
                    "Amount": transaction.Amount,
                    "Currency": currencyCode,
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

            if (!userTransactions) {
                response.setStatus(response.NOT_FOUND);
                return { message: "User doesn't have Transactions!" };
            }

            if (userTransactions.length === 0) {
                response.setStatus(response.OK);
                return userTransactions;
            }

            const allBankAccounts = this.bankAccountDao.findAll();
            let userInteractions: any = [];

            allBankAccounts.forEach(bankAccount => {
                userTransactions.forEach(transaction => {
                    if (transaction.Sender === bankAccount.Id || transaction.Reciever === bankAccount.Id) {
                        const user = this.userDao.findById(bankAccount.User);

                        userInteractions.push({
                            "Name": user.Username,
                            "IBAN": bankAccount.IBAN,
                            "BankAccountId": bankAccount.Id,
                            "Amount": bankAccount.Amount,
                            "Currency": transaction.Currency
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

    @Get("/monthlyStats/:userId")
    public getMonthlyStats(_: any, ctx: any) {
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

            const currentDate = new Date();
            const lastYearDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1); // Start of the 12th month back

            const filteredTransactions = allTransactions.filter((transaction: any) => {
                const transactionDate = new Date(transaction.Date);
                return transactionDate >= lastYearDate && transactionDate <= currentDate;
            });

            const incomes: Record<string, number> = {};
            const expenses: Record<string, number> = {};

            for (let i = 0; i < 12; i++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                incomes[monthKey] = 0;
                expenses[monthKey] = 0;
            }

            userBankAccounts.forEach(bankAccount => {
                filteredTransactions.forEach(transaction => {
                    const transactionDate = new Date(transaction.Date);
                    const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;

                    if (transaction.Sender === bankAccount.Id) {
                        expenses[monthKey] += transaction.Amount;
                    } else if (transaction.Reciever === bankAccount.Id) {
                        incomes[monthKey] += transaction.Amount;
                    }
                });
            });

            response.setStatus(response.OK);
            return { incomes, expenses };

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
                        const expirationDate = new Date(card.ExpirationDate);

                        const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
                        const year = expirationDate.getFullYear().toString().slice(-2);

                        const formattedDate = `${month}/${year}`;

                        const bankAccount = this.bankAccountDao.findById(card.BankAccount);
                        const currencyCode = this.currencyDao.findById(bankAccount.Currency).Code;

                        userCards.push({
                            "CardNumber": card.CardNumber,
                            "ExpirationDate": formattedDate,
                            "CV": card.CV,
                            "Balance": bankAccount.Amount,
                            "BankAccount": bankAccount.Id,
                            "Currency": currencyCode
                        });
                    }
                })
            })

            response.setStatus(response.OK);
            return { "UserCards": userCards };

        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }

    @Get("/bankAccountInfo/:bankAccountId")
    public getBankAccountInfo(_: any, ctx: any) {
        const bankAccountId = ctx.pathParameters.bankAccountId;

        const bankAccount = this.bankAccountDao.findById(bankAccountId);

        if (!bankAccount) {
            response.setStatus(response.NOT_FOUND);
            return { message: "Bank Account with that ID doesn't exist!" };
        }

        try {
            const creationDate = new Date(bankAccount.CreationDate);

            const date = creationDate.getDate();
            const month = (creationDate.getMonth() + 1).toString().padStart(2, '0');
            const year = creationDate.getFullYear().toString();

            const formattedCreationDate = `${date}/${month}/${year}`;

            const bankAccountInfo = {
                "IBAN": bankAccount.IBAN,
                "User": this.userDao.findById(bankAccount.User).Name,
                "Amount": bankAccount.Amount,
                "Currency": this.currencyDao.findById(bankAccount.Currency).Code,
                "Type": this.bankAccountTypeDao.findById(bankAccount.Type).Name,
                "Status": this.bankAccountStatusDao.findById(bankAccount.Status).Name,
                "CreationDate": formattedCreationDate
            }
            const bankAccountCards = this.cardDao.findAll({
                $filter: {
                    equals: { BankAccount: bankAccountId }
                }
            })

            const finalizedBankAccountCards = bankAccountCards.map(card => {
                const expirationDate = new Date(card.ExpirationDate);

                const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
                const year = expirationDate.getFullYear().toString().slice(-2);

                const formattedExpirationDate = `${month}/${year}`;

                const cardTypeName = this.cardTypeDao.findById(card.CardType).Name;
                const currencyCode = this.currencyDao.findById(bankAccount.Currency).Code;

                return {
                    "CardNumber": card.CardNumber,
                    "ExpirationDate": formattedExpirationDate,
                    "CardType": cardTypeName,
                    "Balance": bankAccount.Amount,
                    "CV": card.CV,
                    "Currency": currencyCode
                }
            })

            response.setStatus(response.OK);
            return {
                "BankAccount": bankAccountInfo,
                "BankAccountCards": finalizedBankAccountCards
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
                if (bankAccount.IBAN == userIBAN) {
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
            const requiredFields = ["Reciever", "Sender", "Amount", "Currency"];

            for (const field of requiredFields) {
                if (!body.hasOwnProperty(field)) {
                    response.setStatus(response.BAD_REQUEST);
                    return { message: `Missing property: ${field}` };
                }
            }

            const receiver = this.bankAccountDao.findById(body["Reciever"]);
            if (!receiver) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Bank account with ID ${body["Reciever"]} not found!` };
            }

            const sender = this.bankAccountDao.findById(body["Sender"]);
            if (!sender) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Bank account with ID ${body["Sender"]} not found!` };
            }

            const amount = body["Amount"];
            if (!(typeof amount === "number")) {
                response.setStatus(response.BAD_REQUEST);
                return { message: `Amount is not a number! Received type: ${typeof amount}.` };
            }

            if (amount <= 0) {
                response.setStatus(response.BAD_REQUEST);
                return { message: "Amount must be greater than zero." };
            }

            if (body.hasOwnProperty("Date")) {
                const transactionDateString = body["Date"];

                if (typeof transactionDateString !== "string") {
                    response.setStatus(response.BAD_REQUEST);
                    return { message: "Date must be a string in ISO format." };
                }
                const transactionDate = new Date(transactionDateString);

                if (isNaN(transactionDate.getTime())) {
                    response.setStatus(response.BAD_REQUEST);
                    return { message: "Entered Date is not a valid date." };
                }

                const currentTime = new Date();

                if (transactionDate <= currentTime) {
                    response.setStatus(response.BAD_REQUEST);
                    return { message: "Transaction date must be in the future." };
                }

                const processInstanceId = process.start("transaction-date-process", {
                    TransactionDate: body["Date"],
                    Sender: body["Sender"],
                    Receiver: body["Reciever"],
                    Amount: body["Amount"],
                    Currency: body["Currency"],
                });

                if (processInstanceId == null) {
                    response.setStatus(response.INTERNAL_SERVER_ERROR);
                    return { message: "Failed to create transaction schedule process!" };
                }

                response.setStatus(response.CREATED);
                return { message: `Transaction scheduled. Process Instance ID: ${processInstanceId}` };
            } else {
                const newTransaction = this.transactionDao.create(body);

                if (!newTransaction) {
                    throw new Error("Transaction creation failed!");
                }

                response.setStatus(response.CREATED);
                return newTransaction;
            }
        } catch (e: any) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }

}