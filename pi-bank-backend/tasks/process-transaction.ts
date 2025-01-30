import { BankAccountRepository as BankAccountDao } from "../gen/pi-bank-backend/dao/bankAccount/BankAccountRepository";
import { TransactionRepository as TransactionDao } from "../gen/pi-bank-backend/dao/transaction/TransactionRepository";

import { process } from "sdk/bpm";

const bankAccountDao = new BankAccountDao();
const transactionDao = new TransactionDao();

const execution = process.getExecutionContext();
const executionId = execution.getId();

const senderId = process.getVariable(executionId, "Sender");
const receiverId = process.getVariable(executionId, "Receiver");
const amount = process.getVariable(executionId, "Amount");
const currencyId = process.getVariable(executionId, "Currency");

const receiver = await bankAccountDao.findById(receiverId);
if (!receiver) {
    throw new Error(`Bank account with ID ${receiverId} not found!`);
}

const sender = await bankAccountDao.findById(senderId);
if (!sender) {
    throw new Error(`Bank account with ID ${senderId} not found!`);
}

if (!(typeof amount === "number")) {
    throw new Error(`Amount is not a number! Received type: ${typeof amount}.`);
}

if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
}

const body = {
    "Reciever": receiverId,
    "Sender": senderId,
    "Amount": amount,
    "Currency": currencyId,
};

const newTransaction = await transactionDao.create(body);
if (!newTransaction) {
    throw new Error("Transaction creation failed!");
}
