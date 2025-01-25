import { BankAccountRepository } from "../../gen/pi-bank-backend/dao/bankAccount/BankAccountRepository";

export const trigger = (event) => {
    console.log("test");
    const BankAccountDao = new BankAccountRepository();

    if (event.operation === "create") {
        console.log("test");
        const transaction = event.entity;

        const sender = transaction.Sender;

        const receiver = transaction.Reciever;
        const amount = transaction.Amount;

        const senderAccount = BankAccountDao.findById(sender);
        const receiverAccount = BankAccountDao.findById(receiver);

        console.log(senderAccount);
        console.log(receiverAccount);

        if (!senderAccount) {
            return;
        }

        if (!receiverAccount) {
            return;
        }

        if (amount <= 0) {
            return;
        }

        const senderAmount = senderAccount.Amount - amount;
        const receiverAmount = receiverAccount.Amount + amount;

        if (senderAmount <= 0) {
            return;
        }

        if (receiverAmount <= 0) {
            return;
        }

        senderAccount.Amount = senderAmount;
        receiverAccount.Amount = receiverAmount;

        BankAccountDao.update(senderAccount);
        BankAccountDao.update(receiverAccount);

        console.log("Transaction Event!");
    }
}
