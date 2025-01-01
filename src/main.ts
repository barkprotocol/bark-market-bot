import TelegramBot from "node-telegram-bot-api";
import { PNL_IMG_GENERATOR_API, TELEGRAM_BOT_API_TOKEN } from "./config";
import { AlertBotID, BotMenu } from "./bot.opts";
import { WelcomeScreenHandler } from "./screens/welcome.screen";
import { callbackQueryHandler } from "./controllers/callback.handler";
import { messageHandler } from "./controllers/message.handler";
import { positionScreenHandler } from "./screens/position.screen";
import { UserService } from "./services/user.service";
import {
  alertBot,
  runAlertBotForChannel,
  runAlertBotSchedule,
} from "./cron/alert.bot.cron";
import {
  newReferralChannelHandler,
  removeReferralChannelHandler,
} from "./services/alert.bot.module";
import { runSOLPriceUpdateSchedule } from "./cron/sol.price.cron";
import { settingScreenHandler } from "./screens/settings.screen";
import {
  ReferralChannelService,
  ReferralPlatform,
} from "./services/referral.channel.service";
import { ReferrerListService } from "./services/referrer.list.service";
import { runListener } from "./raydium";
import { wait } from "./utils/wait";
import { runOpenmarketCronSchedule } from "./cron/remove.openmarket.cron";

const token = TELEGRAM_BOT_API_TOKEN;

if (!token) {
  throw new Error(
    "TELEGRAM_BOT API_KEY is not defined in the environment variables"
  );
}

export interface ReferralIdenticalType {
  referrer: string;
  chatId: string;
  messageId: string;
  channelName: string;
}

const startTradeBot = () => {
  const bot = new TelegramBot(token, { polling: true });

  // Run scheduled cron jobs and listeners
  runOpenmarketCronSchedule();
  runListener();
  runAlertBotSchedule();
  runSOLPriceUpdateSchedule();

  // Set bot commands
  bot.setMyCommands(BotMenu);

  // Handle callback queries
  bot.on(
    "callback_query",
    async function onCallbackQuery(callbackQuery: TelegramBot.CallbackQuery) {
      callbackQueryHandler(bot, callbackQuery);
    }
  );

  // Handle messages
  bot.on("message", async (msg: TelegramBot.Message) => {
    messageHandler(bot, msg);
  });

  // Handle /start command
  bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    bot.deleteMessage(msg.chat.id, msg.message_id);

    await WelcomeScreenHandler(bot, msg);

    const referralCode = UserService.extractUniqueCode(msg.text ?? "");
    const chat = msg.chat;
    if (referralCode && chat.username) {
      const data = await UserService.findLastOne({ username: chat.username });
      if (!data || !data.referral_code) {
        await UserService.updateMany(
          { username: chat.username },
          {
            referral_code: referralCode,
            referral_date: new Date(),
          }
        );
      }
    }
  });

  // Handle /position command
  bot.onText(/\/position/, async (msg: TelegramBot.Message) => {
    await positionScreenHandler(bot, msg);
  });

  // Handle /settings command
  bot.onText(/\/settings/, async (msg: TelegramBot.Message) => {
    await settingScreenHandler(bot, msg);
  });

  // Handle start command for AlertBot
  alertBot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    const { from, chat, text, message_id } = msg;

    if (text && text.includes(`/start@${AlertBotID}`)) {
      await wait(3000); // Wait before deleting message

      try {
        alertBot.deleteMessage(chat.id, message_id);
      } catch (e) {}

      if (from && text.includes(" ")) {
        const referrerInfo = await ReferrerListService.findLastOne({
          referrer: from.username,
          chatId: chat.id.toString(),
        });

        if (!referrerInfo) return;

        const parts = text.split(" ");
        if (parts.length < 1 || parts[0] !== `/start@${AlertBotID}`) {
          return;
        }

        const botType = parts[1];
        const referralChannelService = new ReferralChannelService();

        if (botType === "tradebot") {
          await referralChannelService.addReferralChannel({
            creator: referrerInfo.referrer,
            platform: ReferralPlatform.TradeBot,
            chat_id: referrerInfo.chatId,
            channel_name: referrerInfo.channelName,
          });
        } else if (botType === "bridgebot") {
          await referralChannelService.addReferralChannel({
            creator: referrerInfo.referrer,
            platform: ReferralPlatform.BridgeBot,
            chat_id: referrerInfo.chatId,
            channel_name: referrerInfo.channelName,
          });
        }
      }
    }
  });

  // Handle new members joining AlertBot's channel
  alertBot.on("new_chat_members", async (msg: TelegramBot.Message) => {
    const data = await newReferralChannelHandler(msg);
    if (data) {
      try {
        await ReferrerListService.create(data);
      } catch (e) {}
    }
  });

  // Handle a member leaving AlertBot's channel
  alertBot.on("left_chat_member", async (msg: TelegramBot.Message) => {
    await removeReferralChannelHandler(msg);
  });
};

export default startTradeBot;
