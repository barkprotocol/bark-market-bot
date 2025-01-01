import TelegramBot from "node-telegram-bot-api";
import { AlertBotID, WELCOME_REFERRAL } from "../bot.opts";
import { get_referrer_info } from "../services/referral.service";
import { ReferralChannelController } from "../controllers/referral.channel";
import { UserService } from "../services/user.service";
import { schedule } from "node-cron";
import {
  ReferralChannelService,
  ReferralPlatform,
} from "../services/referral.channel.service";

export const openAlertBotDashboard = async (
  bot: TelegramBot,
  chat: TelegramBot.Chat
) => {
  try {
    const chatId = chat.id;
    const username = chat.username;

    if (!username) {
      bot.sendMessage(chatId, "Username is missing. Please make sure your Telegram username is set.");
      return;
    }

    const refdata = await get_referrer_info(username);
    if (!refdata) {
      bot.sendMessage(
        chatId,
        "You have no referral code. Please create a referral code first."
      );
      return;
    }

    const { schedule, uniquecode } = refdata;

    const channels = await ReferralChannelController.find({
      referral_code: uniquecode,
    });

    const inlineKeyboards = [
      [
        {
          text: "Alert Schedule 🕓",
          callback_data: JSON.stringify({
            command: "alert_schedule",
          }),
        },
        {
          text: "Invite AlertBot 🤖",
          url: `https://t.me/${AlertBotID}?startgroup=tradebot`,
        },
      ],
      [
        {
          text: "Refresh bot info",
          callback_data: JSON.stringify({
            command: "refresh_alert_bot",
          }),
        },
        {
          text: "Back",
          callback_data: JSON.stringify({
            command: "back_from_ref",
          }),
        },
      ],
    ];

    const reply_markup = {
      inline_keyboard: inlineKeyboards,
    };

    let channelList = ``;
    for (const channel of channels) {
      const { channel_name } = channel;
      channelList += `🟢 ${channel_name}\n`;
    }

    if (channels.length <= 0) {
      channelList +=
        "You have not invited our alert bot into any channel yet.\n";
    }
    const contents =
      `<b>AlertBot Configuration</b>\n\n` +
      `<b>Channels</b>\n` +
      `${channelList}\n` +
      "<b>Alert schedule</b>\n" +
      `Bot will send alerts every <b>${schedule ?? 30}</b> minutes.\n\n` +
      `Once you setup at least one group, you can then invite @${AlertBotID} into your group-chat.\n\n` +
      `If you want to update the settings, you can do it through the menu down below 👇🏼`;
    await bot.sendPhoto(chatId, WELCOME_REFERRAL, {
      caption: contents,
      reply_markup,
      parse_mode: "HTML",
    });
  } catch (e) {
    console.error("Error in openAlertBotDashboard:", e);
    bot.sendMessage(chat.id, "Something went wrong while fetching your data. Please try again later.");
  }
};

export const sendMsgForAlertScheduleHandler = async (
  bot: TelegramBot,
  chat: TelegramBot.Chat
) => {
  try {
    if (!chat.username) {
      bot.sendMessage(chat.id, "Username is missing. Please set your Telegram username.");
      return;
    }

    const msgText = `Please, set a time alert frequency 👇🏼.`;

    const inlineKeyboards = [
      [
        {
          text: "10mins",
          callback_data: JSON.stringify({
            command: "schedule_time_10",
          }),
        },
        {
          text: "30mins",
          callback_data: JSON.stringify({
            command: "schedule_time_30",
          }),
        },
      ],
      [
        {
          text: "1h",
          callback_data: JSON.stringify({
            command: "schedule_time_60",
          }),
        },
        {
          text: "3h",
          callback_data: JSON.stringify({
            command: "schedule_time_180",
          }),
        },
        {
          text: "4h",
          callback_data: JSON.stringify({
            command: "schedule_time_240",
          }),
        },
        {
          text: "6h",
          callback_data: JSON.stringify({
            command: "schedule_time_360",
          }),
        },
      ],
    ];

    const reply_markup = {
      inline_keyboard: inlineKeyboards,
    };

    await bot.sendMessage(chat.id, msgText, {
      reply_markup,
      parse_mode: "HTML",
    });
  } catch (e) {
    console.error("Error in sendMsgForAlertScheduleHandler:", e);
    bot.sendMessage(chat.id, "Something went wrong while setting the alert schedule. Please try again.");
  }
};

export const updateSchedule = async (
  bot: TelegramBot,
  chat: TelegramBot.Chat,
  scheduleTime: string
) => {
  try {
    const chatId = chat.id;
    const username = chat.username;

    if (!username) {
      bot.sendMessage(chatId, "Username is missing. Please make sure your Telegram username is set.");
      return;
    }

    const referralChannelService = new ReferralChannelService();
    const result = await referralChannelService.updateReferralChannel({
      creator: username,
      platform: ReferralPlatform.TradeBot,
      schedule: scheduleTime,
    });

    if (!result) {
      bot.sendMessage(chatId, "Failed to update the schedule in the system. Please try again later.");
      return;
    }

    const res = await UserService.updateMany(
      { username: username },
      { schedule: scheduleTime }
    );

    if (res) {
      bot.sendMessage(chatId, "Successfully updated the alert schedule!");
      setUpCronJob(scheduleTime); // Set up cron job for alerts
    } else {
      bot.sendMessage(chatId, "Failed to update your alert schedule. Please try again.");
    }
  } catch (e) {
    console.error("Error in updateSchedule:", e);
    bot.sendMessage(chat.id, "Something went wrong while updating your schedule. Please try again.");
  }
};

// Function to set up a cron job based on selected schedule time
const setUpCronJob = (scheduleTime: string) => {
  try {
    let cronTime = "0 * * * *"; // Default 1 hour
    switch (scheduleTime) {
      case "10":
        cronTime = "*/10 * * * *"; // Every 10 minutes
        break;
      case "30":
        cronTime = "*/30 * * * *"; // Every 30 minutes
        break;
      case "60":
        cronTime = "0 * * * *"; // Every hour
        break;
      case "180":
        cronTime = "0 */3 * * *"; // Every 3 hours
        break;
      case "240":
        cronTime = "0 */4 * * *"; // Every 4 hours
        break;
      case "360":
        cronTime = "0 */6 * * *"; // Every 6 hours
        break;
      default:
        cronTime = "0 * * * *"; // Default to 1 hour
        break;
    }

    // Schedule the cron job
    schedule(cronTime, () => {
      console.log(`Alert sent based on schedule: ${scheduleTime} minutes`);
      // Add logic to send alerts here (for example, send a message to users or channels)
    });

  } catch (e) {
    console.error("Error in setUpCronJob:", e);
  }
};
