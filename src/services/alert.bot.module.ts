import TelegramBot from "node-telegram-bot-api";
import redisClient from "./redis";
import {
  ALERT_BB_IMAGE,
  AlertBotID,
  BarkBotID,
  BridgeBotID,
} from "../bot.opts";
import {
  getReferralList,
  update_channel_id,
} from "./referral.service";
import { ReferralIdenticalType } from "../main";
import { ReferralChannelService, ReferralPlatform } from "./referral.channel.service";

type ReferralChannel = {
  chat_id: string; // channel id
  channel_name: string;
};

export type ReferralData = {
  channels: ReferralChannel[];
  referral_code: string;
  creator: string;
  platform: ReferralPlatform; // TradeBot, BridgeBot
  schedule: string;
};

export const alertbotModule = async (bot: TelegramBot) => {
  try {
    const referrals = await getReferralList();
    if (!referrals) return;
    for (const referral of referrals) {
      await processReferral(referral, bot);  // ensure async is handled properly
    }
  } catch (e) {
    console.error("Error in alertbotModule:", e);
  }
};

const processReferral = async (referral: ReferralData, bot: TelegramBot) => {
  try {
    const { creator, referral_code, channels, platform, schedule } = referral;
    const scheduleInSeconds = parseInt(schedule) * 60;
    const isValid = await validateSchedule(referral_code, scheduleInSeconds);
    if (!isValid) return;

    const isTradeBot = platform === ReferralPlatform.TradeBot;
    for (let idx = 0; idx < channels.length; idx++) {
      const { chat_id } = channels[idx];
      await sendAlert(bot, chat_id, referral_code, creator, idx, isTradeBot);
    }
  } catch (e) {
    console.error("Error in processReferral:", e);
  }
};

const sendAlert = async (
  bot: TelegramBot,
  channelChatId: string,
  referral_code: string,
  creator: string,
  idx: number,
  isTradeBot: boolean
) => {
  try {
    if (!channelChatId || channelChatId === "") return;

    await bot.getChat(channelChatId);  // Ensure chat exists

    const botId = isTradeBot ? BarkBotID : BridgeBotID;
    const botImg = isTradeBot ? ALERT_BB_IMAGE : ALERT_BB_IMAGE;
    const txt = isTradeBot ? "Try BarkBOT Now" : "Try BarkBridge Now";
    const referralLink = `https://t.me/${botId}?start=${referral_code}`;

    const inline_keyboard = [
      [
        {
          text: txt,
          url: referralLink,
        },
      ],
    ];
    if (isTradeBot) {
      inline_keyboard.push([
        {
          text: "Trade with us 📈",
          url: "https://t.me/@BarkProtocolBot",
        },
      ]);
    }

    await bot.sendPhoto(channelChatId, botImg, {
      caption: "",
      reply_markup: {
        inline_keyboard,
      },
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error("Error in sendAlert for channel:", channelChatId, referral_code);
    await handleError(error, creator, idx, channelChatId);
  }
};

const handleError = async (
  error: any,
  creator: string,
  idx: number,
  channelChatId: string
) => {
  try {
    const errMsg = error?.response?.body?.description || "Unknown error";
    if (errMsg.includes("chat not found")) {
      const lastNum: string | null = await redisClient.get(channelChatId);
      if (!lastNum) {
        await redisClient.set(channelChatId, "0");
        return;
      }
      const retryCounter = parseInt(lastNum) + 1;
      if (retryCounter <= 3) {
        await redisClient.set(channelChatId, retryCounter.toString());
        return;
      }
      await redisClient.del(channelChatId);

      const res = await update_channel_id(creator, idx, "delete");
      if (!res) {
        console.error("ServerError: cannot remove channel", creator, idx);
      }
    }
  } catch (e) {
    console.error("Error in handleError:", e);
  }
};

const validateSchedule = async (referral_code: string, schedule: number) => {
  try {
    const last_ts: string | null = await redisClient.get(referral_code);
    const timestamp = Math.floor(Date.now() / 1000);  // ensure seconds
    if (!last_ts) {
      await redisClient.set(referral_code, timestamp.toString());
      return true;
    }
    const last_timestamp = Number(last_ts);
    if (timestamp - last_timestamp > schedule) {
      await redisClient.set(referral_code, timestamp.toString());
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error in validateSchedule:", e);
    return false;
  }
};

export const newReferralChannelHandler = async (msg: TelegramBot.Message) => {
  try {
    const { chat, from, new_chat_members } = msg;
    if (from && new_chat_members && from.username) {
      // if bot added me, return
      if (from.is_bot) return;

      const alertbotInfo = new_chat_members.find(
        (member) => member.username === AlertBotID
      );
      if (!alertbotInfo) return;

      const creator = from.username;
      const chat_id = chat.id;
      const channel_name = chat.title ?? "";

      return {
        chatId: chat_id.toString(),
        referrer: creator,
        channelName: channel_name,
        messageId: msg.message_id.toString(),
      } as ReferralIdenticalType;
    }
    return null;
  } catch (e) {
    console.error("Error in newReferralChannelHandler:", e);
    return null;
  }
};

export const removeReferralChannelHandler = async (
  msg: TelegramBot.Message
) => {
  try {
    const { chat, from, left_chat_member } = msg;
    if (from && left_chat_member && from.username) {
      // if bot added me, return
      if (from.is_bot) return;

      const alertbotInfo = left_chat_member.username === AlertBotID;
      if (!alertbotInfo) return;

      const creator = from.username;
      const chat_id = chat.id;

      const referralChannelService = new ReferralChannelService();
      await referralChannelService.deleteReferralChannel({
        creator,
        chat_id: chat_id.toString(),
        channel_name: chat.title,
      });
    }
  } catch (e) {
    console.error("Error in removeReferralChannelHandler:", e);
  }
};

export const sendAlertForOurChannel = async (alertBot: TelegramBot) => {
  try {
    const chat_id = "-7606711552";
    await alertBot.getChat(chat_id);
    await alertBot.sendPhoto(chat_id, ALERT_BB_IMAGE, {
      caption: "",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Try BarkBOT now!",
              url: `https://t.me/BarkProtocolBot`,
            },
          ],
        ],
      },
      parse_mode: "HTML",
    });
  } catch (e) {
    console.error("Error in sendAlertForOurChannel:", e);
  }
};
