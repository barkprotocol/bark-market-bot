import TelegramBot from "node-telegram-bot-api";
import {
  cancelWithdrawHandler,
  withdrawCustomAmountScreenHandler,
  withdrawHandler,
} from "../screens/transfer.funds";
import { contractInfoScreenHandler } from "../screens/contract.info.screen";
import { GasFeeEnum } from "../services/user.trade.setting.service";
import {
  buyCustomAmountScreenHandler,
  buyHandler,
  sellCustomAmountScreenHandler,
  sellHandler,
  setSlippageScreenHandler,
} from "../screens/trade.screen";
import { WelcomeScreenHandler, welcomeGuideHandler } from "../screens/welcome.screen";
import {
  autoBuyAmountScreenHandler,
  changeGasFeeHandler,
  changeJitoTipFeeHandler,
  generateNewWalletHandler,
  presetBuyAmountScreenHandler,
  presetBuyBtnHandler,
  revealWalletPrivatekyHandler,
  setCustomAutoBuyAmountHandler,
  settingScreenHandler,
  switchAutoBuyOptsHandler,
  switchBurnOptsHandler,
  switchWalletHandler,
  walletViewHandler,
} from "../screens/settings.screen";
import { positionScreenHandler } from "../screens/position.screen";
import { OpenReferralWindowHandler } from "../screens/referral.link.handler";
import {
  openAlertBotDashboard,
  sendMsgForAlertScheduleHandler,
  updateSchedule,
} from "../screens/bot.dashboard";
import {
  backToReferralHomeScreenHandler,
  refreshPayoutHandler,
  sendPayoutAddressManageScreen,
  setSOLPayoutAddressHandler,
} from "../screens/payout.screen";

const handleDismissMessage = (bot: TelegramBot, callbackMessage: TelegramBot.Message) => {
  bot.deleteMessage(callbackMessage.chat.id, callbackMessage.message_id);
};

const handleWithdrawCommand = async (bot: TelegramBot, callbackMessage: TelegramBot.Message, data: any) => {
  if (data.command.includes("cancel_withdraw")) {
    await cancelWithdrawHandler(bot, callbackMessage);
  }
  if (data.command.includes("withdrawtoken_custom")) {
    await withdrawCustomAmountScreenHandler(bot, callbackMessage);
  }
  if (data.command.includes("withdraw_")) {
    const percent = data.command.slice("withdraw_".length);
    await withdrawHandler(bot, callbackMessage, percent);
  }
};

const handlePositionCommand = async (bot: TelegramBot, callbackMessage: TelegramBot.Message, data: any) => {
  if (data.command.includes("position")) {
    await positionScreenHandler(bot, callbackMessage);
  }
  if (data.command.includes("SPS_") || data.command.includes("BS_") || data.command.includes("SS_")) {
    const mint = data.command.slice(data.command.startsWith("SPS_") ? 4 : 3);
    const action = data.command.startsWith("SPS_") ? "switch_buy" : "switch_sell";
    await contractInfoScreenHandler(bot, callbackMessage, mint, action);
  }
};

const handleSettingsCommand = async (bot: TelegramBot, callbackMessage: TelegramBot.Message, data: any) => {
  if (data.command.includes("settings")) {
    await settingScreenHandler(bot, callbackMessage);
  }
  if (data.command === "generate_wallet") {
    await generateNewWalletHandler(bot, callbackMessage);
  }
  if (data.command === "switch_gas") {
    await changeGasFeeHandler(bot, callbackMessage, GasFeeEnum.LOW);
  }
  if (data.command === "custom_gas") {
    await setCustomFeeScreenHandler(bot, callbackMessage);
  }
  if (data.command === "switch_mev") {
    await changeJitoTipFeeHandler(bot, callbackMessage);
  }
  if (data.command === "custom_jitofee") {
    await setCustomJitoFeeScreenHandler(bot, callbackMessage);
  }
};

const handleBuySellCommand = async (bot: TelegramBot, callbackMessage: TelegramBot.Message, data: any) => {
  if (data.command.includes("buytoken_")) {
    const buyAmount = Number(data.command.slice("buytoken_".length));
    await buyHandler(bot, callbackMessage, buyAmount);
  }
  if (data.command.includes("selltoken_")) {
    const sellPercent = Number(data.command.slice("selltoken_".length));
    await sellHandler(bot, callbackMessage, sellPercent);
  }
};

export const callbackQueryHandler = async (
  bot: TelegramBot,
  callbackQuery: TelegramBot.CallbackQuery
) => {
  try {
    const { data: callbackData, message: callbackMessage } = callbackQuery;
    if (!callbackData || !callbackMessage) return;

    const data = JSON.parse(callbackData);

    // Dismiss message if needed
    if (data.command.includes("dismiss_message")) {
      handleDismissMessage(bot, callbackMessage);
      return;
    }

    // Handle withdraw-related commands
    await handleWithdrawCommand(bot, callbackMessage, data);

    // Handle position-related commands
    await handlePositionCommand(bot, callbackMessage, data);

    // Handle settings-related commands
    await handleSettingsCommand(bot, callbackMessage, data);

    // Handle buy/sell-related commands
    await handleBuySellCommand(bot, callbackMessage, data);

    // Additional command handling for other features
    if (data.command.includes("wallet_view")) {
      await walletViewHandler(bot, callbackMessage);
    }
    if (data.command === "referral") {
      await OpenReferralWindowHandler(bot, callbackMessage);
    }
    if (data.command === "payout_address") {
      await sendPayoutAddressManageScreen(bot, callbackMessage.chat, callbackMessage.message_id);
    }
    if (data.command === "set_sol_address") {
      await setSOLPayoutAddressHandler(bot, callbackMessage.chat);
    }
    if (data.command === "refresh_payout") {
      await refreshPayoutHandler(bot, callbackMessage);
    }
    if (data.command === "alert_bot" || data.command === "refresh_alert_bot") {
      await openAlertBotDashboard(bot, callbackMessage.chat);
    }
    if (data.command.includes("alert_schedule")) {
      await sendMsgForAlertScheduleHandler(bot, callbackMessage.chat);
    }
    if (data.command === "back_home") {
      await welcomeGuideHandler(bot, callbackMessage);
    }
  } catch (e) {
    console.log(e);
  }
};
