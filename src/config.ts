import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import 'dotenv/config';

// Configuration variables
export const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/barkbot";
export const TELEGRAM_BOT_API_TOKEN = process.env.TELEGRAM_BOT_API_TOKEN;
export const ALERT_BOT_TOKEN_SECRET = process.env.ALERT_BOT_API_TOKEN;
export const REDIS_URI = process.env.REDIS_URI || "redis://localhost:6379";

export const MAINNET_RPC = process.env.MAINNET_RPC || "https://api.mainnet-beta.solana.com";
export const RPC_WEBSOCKET_ENDPOINT = process.env.RPC_WEBSOCKET_ENDPOINT || "ws://api.mainnet-beta.solana.com";
export const PRIVATE_RPC_ENDPOINT = process.env.PRIVATE_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";

// Commitment level for transactions
export const COMMITMENT_LEVEL = 'finalized' as Commitment;

// Solana connections
export const connection = new Connection(MAINNET_RPC, COMMITMENT_LEVEL);
export const private_connection = new Connection(PRIVATE_RPC_ENDPOINT, COMMITMENT_LEVEL);

// Reserve wallet public key
export const RESERVE_WALLET = new PublicKey("BARKkeAwhTuFzcLHX4DjotRsmjXQ1MshGrZbn1CUQqMo");

// API URLs and keys
export const BIRDEYE_API_URL = "https://public-api.birdeye.so";
export const BIRDEYE_API_KEY = process.env.BIRD_EYE_API || "";
export const JITO_UUID = process.env.JITO_UUID || "";
export const REQUEST_HEADER = {
  'accept': 'application/json',
  'x-chain': 'solana',
  'X-API-KEY': BIRDEYE_API_KEY,
};

// Referral account public key
export const REFERRAL_ACCOUNT = "AVuaymKvgzKcJWF8aSR3JfKN3T8k3WjT4ANTVxLdkU3x";

// Time constants
export const MIN = 60;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
export const WK = 7 * DAY;

// Jupiter project public key
export const JUPITER_PROJECT = new PublicKey(
  "45ruCyfdRkWpRNGEqWzjCiXRHkZs8WXCLQ67Pnpye7Hp",
);

// Max checks for JITO
export const MAX_CHECK_JITO = 20;

// Max wallets allowed
export const MAX_WALLET = 5;

// Bot version
export const BarkBotVersion = '| Beta Version';

// BARKBot and PNL image generator API endpoints
export const BARKBOT_API_ENDPOINT = process.env.BARKBOT_API_ENDPOINT || "http://127.0.0.1:5001";
export const PNL_IMG_GENERATOR_API = process.env.PNL_IMG_GENERATOR_API || "http://127.0.0.1:3001";

// Profit and loss threshold in USD
export const PNL_SHOW_THRESHOLD_USD = 0.00000005;

// Raydium-related constants and API URLs
export const RAYDIUM_PASS_TIME = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
export const RAYDIUM_AMM_URL = 'https://api.raydium.io/v2/main/pairs';
export const RAYDIUM_CLMM_URL = 'https://api.raydium.io/v2/ammV3/ammPools';

// Example: Fetching balance and bot data

// Function to get balance from Solana network
async function getBalance() {
  try {
    const balance = await connection.getBalance(RESERVE_WALLET);
    console.log(`Reserve wallet balance: ${balance / 1e9} SOL`);
  } catch (error) {
    console.error('Error fetching balance:', error);
  }
}

// Function to make an API request to the BARK bot endpoint
async function fetchBotData() {
  try {
    const response = await fetch(`${BARKBOT_API_ENDPOINT}/data`, {
      headers: {
        'Authorization': `Bearer ${TELEGRAM_BOT_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data from BarkBOT API');
    }

    const data = await response.json();
    console.log('Fetched Bot Data:', data);
  } catch (error) {
    console.error('Error fetching bot data:', error);
  }
}

// Run the example functions
async function run() {
  await getBalance();
  await fetchBotData();
}

run();
