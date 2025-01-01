import { PublicKey } from "@solana/web3.js";

// Constants for API URLs, Tokens, and configuration
export const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112');  // Example SOL mint address
export const COMMITMENT_LEVEL = 'finalized';  // Use the finalized commitment level
export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXkQd5J8X8wnF8MPzYx');  // SPL Token Program ID
export const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || '';  // API Key for CoinMarketCap, from environment

// MongoDB and Redis Configuration
export const MONGODB_URL = process.env.MONGODB_URL || '';  // MongoDB connection URL
export const REDIS_URI = process.env.REDIS_URI || '';  // Redis connection URI

// BarkBOT - Telegram Bot IDs and API Tokens
export const BARK_BOT_ID = process.env.BARK_BOT_ID || '';  // Bark Bot ID
export const BARK_ALERT_BOT_ID = process.env.BARK_ALERT_BOT_ID || '';  // Bark Alert Bot ID
export const BridgeBotID = process.env.BridgeBotID || '';  // Bridge Bot ID
export const ALERT_BOT_API_TOKEN = process.env.ALERT_BOT_API_TOKEN || '';  // Alert Bot API Token
export const TELEGRAM_BOT_API_TOKEN = process.env.TELEGRAM_BOT_API_TOKEN || '';  // Telegram Bot API Token

// RPC Endpoints
export const MAINNET_RPC = process.env.MAINNET_RPC || 'https://api.mainnet-beta.solana.com';  // Mainnet RPC URL
export const PRIVATE_RPC_ENDPOINT = process.env.PRIVATE_RPC_ENDPOINT || '';  // Private RPC URL
export const RPC_WEBSOCKET_ENDPOINT = process.env.RPC_WEBSOCKET_ENDPOINT || '';  // RPC WebSocket URL

// External API Configuration
export const JITO_UUID = process.env.JITO_UUID || '';  // JITO UUID for API authentication
export const BIRD_EYE_API = process.env.BIRD_EYE_API || '';  // Bird Eye API endpoint
export const BARKBOT_API_ENDPOINT = process.env.BARKBOT_API_ENDPOINT || '';  // BARKBOT API endpoint
export const PNL_IMG_GENERATOR_API = process.env.PNL_IMG_GENERATOR_API || '';  // PNL Image Generator API endpoint
