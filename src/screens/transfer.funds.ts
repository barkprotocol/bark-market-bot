import TelegramBot, {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Message,
} from "node-telegram-bot-api";
import {
  closeReplyMarkup,
  sendInsufficientNotification,
  sendUsernameRequiredNotification,
} from "./common.screen";
import { UserService } from "../services/user.service";
import { copytoclipboard, isValidWalletAddress } from "../utils";
import { TokenService } from "../services/token.metadata";
import { BarkBotVersion } from "../config";
import { WITHDRAW_TOKEN_AMT_TEXT, WITHDRAW_XTOKEN_TEXT } from "../bot.opts";
import { MsgLogService } from "../services/msglog.service";
import { JupiterService } from "../services/jupiter.service";
import { NATIVE_MINT } from "@solana/spl-token";

interface TokenAccount {
  mint: string;
  amount: number;
  symbol: string;
  decimals?: number;
}

interface WithdrawMessageData {
  tokenName: string;
  symbol: string;
  isToken2022: boolean;
  mint: string;
  amount: number;
  price: number;
}

const createLoadingMessage = (walletAddress: string): string => {
  return `<b>BarkBOT ${BarkBotVersion}</b>\n` +
         `💳 <b>Your wallet address</b>\n` +
         `<i>${copytoclipboard(walletAddress)}</i>\n\n` +
         `<b>Balance: loading...</b>\n`;
};

const createBalanceMessage = (walletAddress: string, solBalance: number): string => {
  return `<b>BarkBOT ${BarkBotVersion}</b>\n` +
         `💳 <b>Your wallet address</b>\n` +
         `<i>${copytoclipboard(walletAddress)}</i>\n\n` +
         `<b>Balance: ${solBalance} SOL</b>\n`;
};

const createWithdrawCaption = (data: WithdrawMessageData, status: string, suffix: string = ""): string => {
  const { tokenName, symbol, isToken2022, mint, amount, price } = data;
  return `🌳 Token: <b>${tokenName ?? "undefined"} (${symbol ?? "undefined"})</b> ` +
         `${isToken2022 ? "<i>Token2022</i>" : ""}\n` +
         `<i>${copytoclipboard(mint)}</i>\n` +
         status +
         `💲 <b>Value: ${amount} ${symbol} ($ ${(amount * price).toFixed(3)})</b>\n` +
         suffix;
};

const sendLoadingState = async (
  bot: TelegramBot,
  chatId: number,
  replaceId: number,
  walletAddress: string
) => {
  const loadingKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: [[
      {
        text: "Loading...",
        callback_data: JSON.stringify({ command: "dummy_button" })
      },
      {
        text: "↩️ Back",
        callback_data: JSON.stringify({ command: "back_home" })
      }
    ]]
  };

  await bot.editMessageText(createLoadingMessage(walletAddress), {
    message_id: replaceId,
    chat_id: chatId,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: loadingKeyboard
  });
};

const sendBalanceAndWithdrawOptions = async (
  bot: TelegramBot,
  chatId: number,
  replaceId: number,
  user: any,
  tokenAccounts: TokenAccount[],
  solBalance: number
) => {
  let caption = createBalanceMessage(user.wallet_address, solBalance);
  const keyboard: InlineKeyboardButton[][] = [
    [
      {
        text: "🌳 Withdraw SOL",
        callback_data: JSON.stringify({ command: `TF_${NATIVE_MINT.toString()}` })
      },
      {
        text: "↩️ Back",
        callback_data: JSON.stringify({ command: "settings" })
      }
    ]
  ];

  tokenAccounts.forEach((token, index) => {
    const { mint: mintAddress, amount: tokenBalance, symbol } = token;
    caption += `\n- <b>Token: ${tokenBalance} ${symbol}</b>\n` +
               `<i>${copytoclipboard(mintAddress)}</i>\n`;

    const row = Math.floor((index + 3) / 3);
    if (!keyboard[row]) {
      keyboard[row] = [];
    }

    keyboard[row].push({
      text: `Withdraw ${symbol || mintAddress}`,
      callback_data: JSON.stringify({ command: `TF_${mintAddress}` })
    });
  });

  await bot.editMessageText(caption, {
    message_id: replaceId,
    chat_id: chatId,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: keyboard }
  });
};

export const transferFundScreenHandler = async (
  bot: TelegramBot,
  msg: Message,
  replaceId: number
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

    await sendLoadingState(bot, chatId, replaceId, user.wallet_address);

    // Fetch balances
    const [solBalance, tokenAccounts] = await Promise.all([
      TokenService.getSOLBalance(user.wallet_address, true),
      TokenService.getTokenAccounts(user.wallet_address)
    ]);

    // Send balance and withdrawal options
    await sendBalanceAndWithdrawOptions(bot, chatId, replaceId, user, tokenAccounts, solBalance);
  } catch (error) {
    console.error("Error in transferFundScreenHandler:", error);
  }
};

export const withdrawButtonHandler = async (
  bot: TelegramBot,
  msg: Message,
  mint: string
): Promise<void> => {
  try {
    const { id: chatId, username } = msg.chat;

    if (!username) {
      console.error("Username not found in chat object");
      return;
    }

    const user = await UserService.findOne({ username });
    if (!user) {
      console.error(`User not found for username: ${username}`);
      return;
    }

    const sentMessage = await bot.sendMessage(chatId, WITHDRAW_TOKEN_AMT_TEXT, {
      parse_mode: "HTML",
      reply_markup: { force_reply: true }
    });

    await MsgLogService.create({
      username,
      mint,
      wallet_address: user.wallet_address,
      chat_id: chatId,
      msg_id: sentMessage.message_id,
      parent_msgid: msg.message_id
    });

  } catch (error) {
    console.error("Error in withdrawButtonHandler:", error);
  }
};

export const withdrawAddressHandler = async (
  bot: TelegramBot,
  msg: Message,
  receive_address: string,
  reply_message_id: number
): Promise<void> => {
  try {
    const { id: chatId, username } = msg.chat;
    if (!username) {
      console.error("Username not found in chat object");
      return;
    }

    const user = await UserService.findOne({ username });
    if (!user) {
      console.error(`User not found for username: ${username}`);
      return;
    }

    if (!isValidWalletAddress(receive_address)) {
      await bot.sendMessage(
        chatId,
        `<b>Invalid wallet address. Please try again.</b>`,
        closeReplyMarkup
      );
      return;
    }

    const msglog = await MsgLogService.findOne({
      username,
      msg_id: reply_message_id,
    });

    if (!msglog) {
      console.error(`Message log not found for reply_message_id: ${reply_message_id}`);
      return;
    }

    const { mint } = msglog;
    const mintinfo = await TokenService.getMintInfo(mint);

    if (!mintinfo) {
      console.error(`Mint info not found for mint: ${mint}`);
      return;
    }

    const { name, symbol } = mintinfo.overview;
    const { isToken2022 } = mintinfo.secureinfo;

    const balance = mint === NATIVE_MINT.toString()
      ? await TokenService.getSOLBalance(user.wallet_address)
      : await TokenService.getSPLBalance(mint, user.wallet_address, isToken2022);

    const tokenName = mint === NATIVE_MINT.toString() ? "SOL" : name;
    const caption =
      `<b>Token: ${tokenName} (${symbol ?? "undefined"})</b>\n` +
      `<i>${copytoclipboard(mint)}</i>\n` +
      `Balance: ${balance}\n\n` +
      `<b>Receive wallet:</b> ${copytoclipboard(receive_address)}`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Withdraw 10%", callback_data: JSON.stringify({ command: "withdraw_10" }) },
          { text: "Withdraw 50%", callback_data: JSON.stringify({ command: "withdraw_50" }) },
          { text: "Withdraw 100%", callback_data: JSON.stringify({ command: "withdraw_100" }) },
        ],
        [
          { text: "Withdraw X", callback_data: JSON.stringify({ command: "withdrawtoken_custom" }) },
          { text: "❌ Cancel", callback_data: JSON.stringify({ command: "cancel_withdraw" }) },
        ],
      ],
    };

    const sentMessage = await bot.sendMessage(chatId, caption, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: keyboard,
    });

    await MsgLogService.create({
      chat_id: chatId,
      msg_id: sentMessage.message_id,
      username,
      mint,
      wallet_address: receive_address,
      spl_amount: mint === NATIVE_MINT.toString() ? 0 : balance,
      parent_msgid: reply_message_id,
      sol_amount: mint === NATIVE_MINT.toString() ? balance : 0,
    });

  } catch (error) {
    console.error("Error in withdrawAddressHandler:", error);
  }
};
