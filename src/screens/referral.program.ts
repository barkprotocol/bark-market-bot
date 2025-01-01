import TelegramBot, {
    KeyboardButton,
    ReplyKeyboardMarkup,
    InlineKeyboardMarkup,
  } from "node-telegram-bot-api";
  import { BarkBotID, WELCOME_REFERRAL } from "../bot.opts";
  import { copytoclipboard } from "../utils";
  import {
    get_referral_amount,
    get_referral_num,
  } from "../services/referral.service";
  
  interface ReferralStats {
    num: number;
    totalAmount: number;
  }
  
  // Define types for inline keyboard buttons
  interface InlineKeyboardButton {
    text: string;
    callback_data: string;
  }
  
  const createInlineKeyboard = (buttons: InlineKeyboardButton[][]): InlineKeyboardMarkup => ({
    inline_keyboard: buttons,
  });
  
  export const showWelcomeReferralProgramMessage = async (
    bot: TelegramBot,
    chat: TelegramBot.Chat,
    uniquecode?: string
  ): Promise<void> => {
    try {
      const chatId = chat.id;
  
      const commonButtons: InlineKeyboardButton[][] = [
        [
          {
            text: "Manage payout 📄",
            callback_data: JSON.stringify({ command: "payout_address" }),
          },
        ],
        [
          {
            text: "Set up Alert Bot 🤖",
            callback_data: JSON.stringify({ command: "alert_bot" }),
          },
          {
            text: "❌ Close",
            callback_data: JSON.stringify({ command: "dismiss_message" }),
          },
        ],
      ];
  
      if (!uniquecode) {
        const newUserButtons: InlineKeyboardButton[][] = [
          [
            {
              text: "Create a referral code 💰",
              callback_data: JSON.stringify({ command: "create_referral_code" }),
            },
          ],
          ...commonButtons,
        ];
  
        const caption = "<b>🎉 Welcome to the referral program</b>\n\n" +
                        "Please create a unique referral code to get started👇.";
  
        await bot.sendPhoto(chatId, WELCOME_REFERRAL, {
          caption,
          reply_markup: createInlineKeyboard(newUserButtons),
          parse_mode: "HTML",
        });
      } else {
        const referralStats = await getReferralStats(uniquecode);
        const referralLink = `https://t.me/${BarkBotID}?start=${uniquecode}`;
  
        const contents = 
          "<b>🎉 Welcome to referral program</b>\n\n" +
          "<b>Refer your friends and earn 25% of their fees in the first 45 days, 20% in the next 45 days and 15% forever!</b>\n\n" +
          `<b>Referred Count: ${referralStats.num}\nSol Earned: ${referralStats.totalAmount}</b>\n\n` +
          `<b>Your referral code 🔖</b>\n${copytoclipboard(uniquecode)}\n\n` +
          `<b>Your referral link 🔗</b>\n${copytoclipboard(referralLink)}\n\n` +
          "- Share your referral link with whoever you want and earn from their swaps 🔁\n" +
          "- Check profits, payouts and change the payout address 📄\n";
  
        await bot.sendPhoto(chatId, WELCOME_REFERRAL, {
          caption: contents,
          reply_markup: createInlineKeyboard(commonButtons),
          parse_mode: "HTML",
        });
      }
    } catch (error) {
      console.error("Error in showWelcomeReferralProgramMessage:", error);
      // Consider sending an error message to the user
      // await bot.sendMessage(chat.id, "An error occurred. Please try again later.");
    }
  };
  
  const getReferralStats = async (uniquecode: string): Promise<ReferralStats> => {
    try {
      const [numResult, amountResult] = await Promise.all([
        get_referral_num(uniquecode),
        get_referral_amount(uniquecode),
      ]);
      return {
        num: numResult.num,
        totalAmount: amountResult.totalAmount,
      };
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      return { num: 0, totalAmount: 0 };
    }
  };
  
  