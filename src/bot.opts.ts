export const BotMenu = [
  { command: 'start', description: 'Welcome' },
  { command: 'position', description: 'Positions' },
  { command: 'settings', description: 'Settings & Tools' },
];

export const BUY_XSOL_TEXT = `🐾Buy X SOL\n\n<i>💲 Enter SOL Value in format "0.05"</i>`;
export const PRESET_BUY_TEXT = `🐾Preset Buy SOL Button \n\n<i>💲 Enter SOL Value in format "0.0X"</i>`;
export const AUTO_BUY_TEXT = `🐾Auto Buy SOL Button \n\n<i>💲 Enter SOL Value in format "0.0X"</i>`;
export const SELL_XPRO_TEXT = `🐾Sell X %\n\n<i>💲 Enter X Value in format "25.5"</i>`;
export const WITHDRAW_XTOKEN_TEXT = `🐾Withdraw X token\n\n<i>💲 Enter X Value in format "25.5"</i>`;
export const SET_SLIPPAGE_TEXT = `🐾Slippage X %\n\n<i>💲 Enter X Value in format "2.5"</i>`;
export const BarkBotID = process.env.BARK_BOT_ID;
export const WELCOME_REFERRAL = 'https://ucarecdn.com/93413ee3-c509-497d-8f55-f9fa4589e6de/barkmascottrasparentbg.png';
export const ALERT_BT_BOT_IMAGE = 'https://ucarecdn.com/da79bf13-a326-4635-a454-e564ec6c5916/donation_bark.png';
export const ALERT_BB_IMAGE = 'https://ucarecdn.com/da79bf13-a326-4635-a454-e564ec6c5916/donation_bark.png';
export const AlertBotID = process.env.BARKBOT_ALERT_BOT_ID;
export const BridgeBotID = process.env.BridgeBotID;

export const INPUT_SOL_ADDRESS = 'Please send your SOL payout address in solana network.';
export const SET_GAS_FEE = `🐾 Custom GAS\n\n<i>💲 Enter SOL Value in format "0.001"</i>`;
export const SET_JITO_FEE = `🐾 Custom Fee Amount\n\n<i>💲 Enter SOL Value in format "0.001"</i>`;

export const WITHDRAW_TOKEN_AMT_TEXT = `<i>🐾 Enter your receive wallet address</i>`;
export enum CommandEnum {
  CLOSE = "dismiss_message",
  Dismiss = "dismiss_message",
  REFRESH = "refresh"
}
