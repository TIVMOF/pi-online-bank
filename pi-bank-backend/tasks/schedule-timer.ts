import { process } from "sdk/bpm";

const execution = process.getExecutionContext();
const executionId = execution.getId();

const transactionDate = process.getVariable(executionId, "TransactionDate");

if (!transactionDate) {
    throw new Error("TransactionDate is missing or invalid.");
}

const currentTime = new Date();
const scheduledTime = new Date(transactionDate);

if (isNaN(scheduledTime.getTime())) {
    throw new Error("TransactionDate is not a valid date.");
}

if (scheduledTime <= currentTime) {
    throw new Error("Transaction date has already passed.");
}

// const delay = Math.floor((scheduledTime.getTime() - currentTime.getTime()) / 1000);
// process.setVariable(executionId, "TimerDelay", delay);

process.setVariable(executionId, "TimerDelay", scheduledTime.toISOString());


// console.log(`Timer scheduled for ${delay} seconds.`);
