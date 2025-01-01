import TelegramBot from "node-telegram-bot-api";
import { showWelcomeReferralProgramMessage } from "./welcome.referral.screen";
import { generateReferralCode } from "../utils";
import { UserService } from "../services/user.service";
import { ReferralChannelService } from "../services/referral.channel.service";

interface UserInfo {
  referrer_code: string;
  // Add other properties as needed
}

export const OpenReferralWindowHandler = async (
  bot: TelegramBot,
  msg: TelegramBot.Message
): Promise<void> => {
  const chat = msg.chat;
  const username = chat.username;

  if (!username) {
    console.log("Username not found in chat object");
    return;
  }

  try {
    const referrerCode = await GenerateReferralCode(username);
    
    if (referrerCode) {
      await showWelcomeReferralProgramMessage(bot, chat, referrerCode);
    } else {
      console.log(`Failed to generate referral code for user: ${username}`);
      // Consider sending an error message to the user
      // await bot.sendMessage(chat.id, "An error occurred. Please try again later.");
    }
  } catch (error) {
    console.error("Error in OpenReferralWindowHandler:", error);
    // Consider sending an error message to the user
    // await bot.sendMessage(chat.id, "An error occurred. Please try again later.");
  }
};

export const GenerateReferralCode = async (username: string): Promise<string | undefined> => {
  try {
    const userInfo = await UserService.findOne({ username }) as UserInfo | null;

    if (!userInfo) {
      console.log(`User not found: ${username}`);
      return undefined;
    }

    if (userInfo.referrer_code) {
      return userInfo.referrer_code;
    }

    const uniqueCode = generateReferralCode(10);
    const referralChannelService = new ReferralChannelService();
    
    const res = await referralChannelService.createReferralChannel(username, uniqueCode);

    if (!res) {
      console.log(`Failed to create referral channel for user: ${username}`);
      return undefined;
    }

    await UserService.updateMany(
      { username },
      { referrer_code: uniqueCode }
    );

    return uniqueCode;
  } catch (error) {
    console.error("Error in GenerateReferralCode:", error);
    return undefined;
  }
};

