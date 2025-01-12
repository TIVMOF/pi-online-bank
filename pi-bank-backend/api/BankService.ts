import { BankAccountRepository as BankAccountDao } from "../gen/pi-bank-backend/dao/bankAccount/BankAccountRepository";
import { CardsRepository as CardsDao } from "../gen/pi-bank-backend/dao/cards/CardsRepository";
import { TransactionsRepository as TransactionsDao } from "../gen/pi-bank-backend/dao/transactions/TransactionsRepository";
import { UsersRepository as UsersDao } from "../gen/pi-bank-backend/dao/users/UsersRepository";

import { Controller, Get, Put, Post, response } from "sdk/http";

import axios from "axios";

const keycloakTokenEndpoint = "https://keycloak.proper-invest.tech/realms/pi-bank/protocol/openid-connect/token";
const keycloakClientId = "pi-bank-mobile";

@Controller
class BankService {
    private readonly bankAccountDao;
    private readonly cardsDao;
    private readonly transactionsDao;
    private readonly usersDao;

    constructor() {
        this.bankAccountDao = new BankAccountDao();
        this.cardsDao = new CardsDao();
        this.transactionsDao = new TransactionsDao();
        this.usersDao = new UsersDao();
    }

    @Post("/createUser")
    public createUser(_: any, ctx: any) {
    }

    @Get("userLogin/:username/:password")
    public async userLogin(_: any, ctx: any) {
        let username = ctx.pathParameters.username;
        let password = ctx.pathParameters.password;

        const allUsers = await this.usersDao.findAll({
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
