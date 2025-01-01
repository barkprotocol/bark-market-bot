import TelegramBot from "node-telegram-bot-api";

export interface UserInfo {
  username: string;
  referrer_wallet?: string;
}

export interface PayoutAddressScreenProps {
  bot: TelegramBot;
  chat: TelegramBot.Chat;
  message_id: number;
}

export interface SetSOLPayoutAddressProps {
  bot: TelegramBot;
  chat: TelegramBot.Chat;
}

export interface UpdateSOLAddressProps {
  bot: TelegramBot;
  chat: TelegramBot.Chat;
  old_message_id: number;
  address: string;
}

