import TelegramBot, { InlineKeyboardButton, InlineKeyboardMarkup } from "node-telegram-bot-api";
import { TokenService } from "../services/token.metadata";
import { copytoclipboard } from "../utils";
import { UserService } from "../services/user.service";
import { sendUsernameRequiredNotification } from "./common.screen";
import { BarkBotVersion } from "../config";

interface TokenAccount {
  mint: string;
  amount: number;
  symbol: string;
  decimals?: number;
}

interface InlineKeyboardData {
  command: string;
}

const createInitialMessage = (walletAddress: string): string => {
  return `<b>BarkBOT ${BarkBotVersion}</b>\n` +
         `💳 <b>Your wallet address</b>\n` +
         `<i>${copytoclipboard(walletAddress)}</i>\n\n` +
         `<b>Loading...</b>\n`;
};

const createPositionMessage = (walletAddress: string, solBalance: number, hasTokens: boolean): string => {
  let message = `<b>BarkBOT ${BarkBotVersion}</b>\n` +
                `💳 <b>Your wallet address</b>\n` +
                `<i>${copytoclipboard(walletAddress)}</i>\n\n` +
                `💳 Balance: <b>${solBalance} SOL</b>\n\n` +
                `<b>Please choose a token to buy/sell.</b>\n`;

  if (!hasTokens) {
    message += `\n<i>You don't hold any tokens in this wallet</i>`;
  }
  
  return message;
};

const createTokenSection = (token: TokenAccount): string => {
  return `\n- <b>Token: ${token.symbol}</b>\n` +
         `<b>Amount: ${token.amount}</b>\n` +
         `<i>${copytoclipboard(token.mint)}</i>\n`;
};

const createInlineKeyboard = (tokens: TokenAccount[]): InlineKeyboardButton[][] => {
  const keyboard: InlineKeyboardButton[][] = [];
  let currentRow: InlineKeyboardButton[] = [];

  // Add token buttons (3 per row)
  tokens.forEach((token, index) => {
    currentRow.push({
      text: token.symbol || token.mint,
      callback_data: JSON.stringify({ command: `SPS_${token.mint}` } as InlineKeyboardData)
    });

    if (currentRow.length === 3 || index === tokens.length - 1) {
      keyboard.push([...currentRow]);
      currentRow = [];
    }
  });

  // Add control buttons
  keyboard.push([
    {
      text: "🔄 Refresh",
      callback_data: JSON.stringify({ command: "pos_ref" } as InlineKeyboardData)
    },
    {
      text: "❌ Close",
      callback_data: JSON.stringify({ command: "dismiss_message" } as InlineKeyboardData)
    }
  ]);

  return keyboard;
};

export const positionScreenHandler = async (
  bot: TelegramBot,
  msg: TelegramBot.Message,
  replaceId?: number
): Promise<void> => {
  try {
    const { chat } = msg;
    const { id: chatId, username } = chat;

    if (!username) {
      await sendUsernameRequiredNotification(bot, msg);
      return;
    }

    const user = await UserService.findOne({ username });
    if (!user) {
      console.error(`User not found for username: ${username}`);
      return;
    }

    // Send initial loading message
    const initialMarkup: InlineKeyboardMarkup = {
      inline_keyboard: [[{
        text: "❌ Close",
        callback_data: JSON.stringify({ command: "dismiss_message" } as InlineKeyboardData)
      }]]
    };

    let messageId = replaceId;
    if (replaceId) {
      await bot.editMessageText(createInitialMessage(user.wallet_address), {
        message_id: replaceId,
        chat_id: chatId,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: initialMarkup
      });
    } else {
      const sentMessage = await bot.sendMessage(chatId, createInitialMessage(user.wallet_address), {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: initialMarkup
      });
      messageId = sentMessage.message_id;
    }

    // Fetch token data
    const [tokenAccounts, solBalance] = await Promise.all([
      TokenService.getTokenAccounts(user.wallet_address),
      TokenService.getSOLBalance(user.wallet_address)
    ]);

    // Filter and process tokens
    const validTokens = tokenAccounts.filter(token => 
      token.symbol !== "SOL" && token.amount >= 0.000005
    );

    // Build message and keyboard
    let caption = createPositionMessage(user.wallet_address, solBalance, validTokens.length > 0);
    validTokens.forEach(token => {
      caption += createTokenSection(token);
    });

    const keyboard = createInlineKeyboard(validTokens);

    // Update message with token information
    await bot.editMessageText(caption, {
      message_id: messageId,
      chat_id: chatId,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: keyboard }
    });

  } catch (error) {
    console.error("Error in positionScreenHandler:", error);
    // Consider sending an error message to the user
    // await bot.sendMessage(chatId, "An error occurred while fetching your positions. Please try again later.");
  }
};

