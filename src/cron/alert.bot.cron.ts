import TelegramBot from "node-telegram-bot-api";
import {
  alertbotModule,
  sendAlertForOurChannel,
} from "../services/alert.bot.module";
import cron from "node-cron";
import { ALERT_BOT_TOKEN_SECRET } from "../config";

// Ensure ALERT_BOT_TOKEN_SECRET is defined in environment variables
const alertBotToken = ALERT_BOT_TOKEN_SECRET;
if (!alertBotToken) {
  throw new Error(
    "ALERT_BOT_TOKEN_SECRET is not defined in the environment variables"
  );
}

// Initialize Telegram bot
export const alertBot = new TelegramBot(alertBotToken, { polling: true });

// Helper function to schedule tasks with the correct type signature
const scheduleTask = (cronExpression: string, task: (now: "init" | Date | "manual") => void) => {
  try {
    cron.schedule(cronExpression, task).start();
    console.log(`Scheduled task with cron expression: ${cronExpression}`);
  } catch (error) {
    console.error(`Error running the Schedule Job: ${error}`);
  }
};

// Schedule tasks

// Every minute task: Alert bot module
const EVERY_1_MIN = "*/1 * * * *"; // Runs every minute
export const runAlertBotSchedule = () => {
  scheduleTask(EVERY_1_MIN, () => alertbotModule(alertBot));
};

// Every 10 minutes task: Send alert to our channel
const EVERY_10_MIN = "0 * * * *"; // Runs every hour at minute 0
export const runAlertBotForChannel = () => {
  scheduleTask(EVERY_10_MIN, () => sendAlertForOurChannel(alertBot));
};
