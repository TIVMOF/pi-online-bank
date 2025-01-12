import { BankAccountRepository as BankAccountDao } from "../gen/pi-bank-backend/dao/bankAccount/BankAccountRepository";
import { CardRepository as CardDao } from "../gen/pi-bank-backend/dao/card/CardRepository";
import { TransactionRepository as TransactionDao } from "../gen/pi-bank-backend/dao/transaction/TransactionRepository";
import { UserRepository as UserDao } from "../gen/pi-bank-backend/dao/user/UserRepository";

import { Controller, Get, Put, Post, response } from "sdk/http";

const keycloakTokenEndpoint = "https://keycloak.proper-invest.tech/realms/pi-bank/protocol/openid-connect/token";
const keycloakClientId = "pi-bank-mobile";

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

    @Post("/createUser")
    public createUser(_: any, ctx: any) {
    }

    @Get("userLogin/:username/:password")
    public async userLogin(_: any, ctx: any) {
        let username = ctx.pathParameters.username;
        let password = ctx.pathParameters.password;

        const allUsers = await this.userDao.findAll({
            $filter: {
                equals: { Username: username, Password: password },
            },
        });

        if (!allUsers || allUsers.length === 0) {
            return {
                statusCode: 404,
                body: { message: "Invalid username or password" },
            };
        }

        try {
            const tokenResponse = await fetch(keycloakTokenEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "password",
                    client_id: keycloakClientId,
                    username,
                    password,
                }).toString(),
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json();
                console.error("Keycloak authentication failed:", errorData);

                return {
                    statusCode: 401,
                    body: { message: "Authentication failed" },
                };
            }

            const token = await tokenResponse.json();

            return {
                statusCode: 200,
                body: {
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token,
                },
            };
        } catch (error) {
            console.error("Error during Keycloak token request:", error);

            return {
                statusCode: 500,
                body: { message: "Internal server error" },
            };
        }
    }
}
