import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import redisClient from './redis';
import BirdEyeAPIService from './birdeye.api.service';
import { NATIVE_MINT, COMMITMENT_LEVEL, TOKEN_2022_PROGRAM_ID, COINMARKETCAP_API_KEY } from './constants';
import { fetch as fetchPrice } from 'node-fetch';

// MintInfo Type Definition
interface MintInfo {
  address: string;
  mintAuthority: string | null;
  supply: string;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
}

// Improved TokenService with better error handling
export const TokenService = {
  // Fetches mint info for a given mint address
  getMintInfo: async (mint: string) => {
    try {
      const overview = await TokenService.getTokenOverview(mint);
      if (!overview) throw new Error("Token overview not found.");

      const secureinfo = await TokenService.fetchSecurityInfo(new PublicKey(mint));
      if (!secureinfo) throw new Error("Token security info not found.");

      return { overview, secureinfo };
    } catch (e) {
      console.error(`Error fetching mint info for ${mint}: ${e.message}`, e);
      return null;
    }
  },

  // Fetches token overview for a given mint address
  getTokenOverview: async (mint: string) => {
    const key = `${mint}_overview`;
    try {
      // Check if token overview is in the Redis cache
      const redisdata = await redisClient.get(key);
      if (redisdata) {
        return JSON.parse(redisdata);
      }

      // If not cached, fetch from the BirdEyeAPIService
      const overview = await BirdEyeAPIService.getTokenOverview(mint);
      if (!overview || !overview.address) {
        throw new Error("Failed to retrieve token overview from BirdEyeAPI.");
      }

      // Cache the fetched overview in Redis for future use
      await redisClient.set(key, JSON.stringify(overview));
      await redisClient.expire(key, 10); // Cache expiry for 10 seconds
      return overview;
    } catch (e) {
      console.error(`Error fetching token overview for ${mint}: ${e.message}`, e);
      return null;
    }
  },

  // Fetches security info for a given mint address
  fetchSecurityInfo: async (mint: PublicKey) => {
    const key = `${mint.toString()}_security`;
    try {
      // Check if security info is in Redis cache
      const data = await redisClient.get(key);
      if (data) return JSON.parse(data);

      // If not cached, fetch mint info from Solana blockchain
      const mintInfo = await getMint(mint);
      const mintdata = {
        address: mintInfo.address,
        mintAuthority: mintInfo.mintAuthority,
        supply: mintInfo.supply,
        decimals: mintInfo.decimals,
        isInitialized: mintInfo.isInitialized,
        freezeAuthority: mintInfo.freezeAuthority,
      };

      // Cache the fetched security info in Redis
      await redisClient.set(key, JSON.stringify(mintdata));
      await redisClient.expire(key, 60); // Cache expiry for 60 seconds
      return mintdata;
    } catch (error) {
      console.error(`Error fetching security info for ${mint.toString()}: ${error.message}`, error);
      return null;
    }
  },

  // Fetches SOL price from CoinMarketCap API
  getSOLPrice: async () => {
    return await TokenService.getPrice(NATIVE_MINT.toString());
  },

  // Fetches SPL token price from CoinMarketCap API
  getSPLPrice: async (mint: string) => {
    return await TokenService.getPrice(mint);
  },

  // A utility function to fetch token price from CoinMarketCap API
  getPrice: async (mint: string) => {
    try {
      const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${mint}&convert=USD`;

      // Fetch price using CoinMarketCap API
      const response = await fetchPrice(url, {
        method: 'GET',
        headers: {
          'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${mint}`);
      }

      const priceData = await response.json();
      if (!priceData || !priceData.data || !priceData.data[mint]) {
        throw new Error(`Price data not available for ${mint}`);
      }

      return priceData.data[mint].quote.USD.price;
    } catch (e) {
      console.error(`Error fetching price for ${mint}: ${e.message}`, e);
      return null;
    }
  },
};

// Helper function to get mint info from Solana blockchain
async function getMint(mint: PublicKey): Promise<MintInfo> {
  const connection = new Connection('https://api.mainnet-beta.solana.com', COMMITMENT_LEVEL as Commitment);

  try {
    const mintInfo = await connection.getParsedAccountInfo(mint);
    if (!mintInfo.value) throw new Error(`Mint ${mint.toString()} not found.`);
    
    const mintData = mintInfo.value.data.parsed.info;
    return {
      address: mint.toString(),
      mintAuthority: mintData.mintAuthority || null,
      supply: mintData.supply,
      decimals: mintData.decimals,
      isInitialized: mintData.isInitialized,
      freezeAuthority: mintData.freezeAuthority || null,
    };
  } catch (error) {
    console.error(`Error fetching mint data for ${mint.toString()}: ${error.message}`);
    throw new Error(`Failed to retrieve mint data for ${mint.toString()}`);
  }
}
