import {
  getPdaPoolId,
  LiquidityPoolKeys,
  MARKET_STATE_LAYOUT_V3,
  MarketStateV3,
  SPL_MINT_LAYOUT,
  Token,
  TokenAmount,
} from "@raydium-io/raydium-sdk";
import { NATIVE_MINT } from "@solana/spl-token";
import { Connection, PublicKey, KeyedAccountInfo } from "@solana/web3.js";
import {
  RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
  OPENBOOK_PROGRAM_ID,
  RAYDIUM_LIQUIDITY_PROGRAM_ID_CLMM,
} from "./liquidity";
import { MinimalMarketLayoutV3 } from "./market";
import { MintLayout, TokenAccountLayout } from "./types";
import {
  connection,
  COMMITMENT_LEVEL,
  RPC_WEBSOCKET_ENDPOINT,
  PRIVATE_RPC_ENDPOINT,
  RAYDIUM_AMM_URL,
  private_connection,
  RAYDIUM_CLMM_URL,
} from "../config";
import { OpenMarketService } from "../services/openmarket.service";
import { TokenService } from "../services/token.metadata";
import { RaydiumTokenService } from "../services/raydium.token.service";
import redisClient from "../services/redis";
import { syncAmmPoolKeys, syncClmmPoolKeys } from "./raydium.service";

const solanaConnection = new Connection(PRIVATE_RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
});

const existingLiquidityPools: Set<string> = new Set<string>();
const existingOpenBookMarkets: Set<string> = new Set<string>();

async function initDB(): Promise<void> {
  try {
    await initAMM();
    await initCLMM();
  } catch (error) {
    console.error("Error initializing DB:", error);
  }
}

async function fetchPoolData(url: string, isAmm: boolean): Promise<void> {
  try {
    console.log(` - ${isAmm ? "AMM" : "CLMM"} Pool data fetching is started...`);
    const response = await fetch(url);
    const data = await response.json();
    console.log(` - ${isAmm ? "AMM" : "CLMM"} Pool data fetched successfully...`);

    const batchSize = 100; // Adjust batch size as needed
    const batches: Array<Array<any>> = [];

    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (item: any) => {
          if (
            (item.baseMint === NATIVE_MINT.toString() ||
              item.quoteMint === NATIVE_MINT.toString()) &&
            Number(item.liquidity || item.tvl) > 0
          ) {
            const tokenMint =
              item.baseMint === NATIVE_MINT.toString() ? item.quoteMint : item.baseMint;
            
            const tokenMetadata = await TokenService.fetchMetadataInfo(tokenMint);
            const data = {
              name: tokenMetadata.name,
              symbol: tokenMetadata.symbol,
              mint: tokenMint,
              isAmm,
              poolId: item.ammId || item.id,
              creation_ts: Date.now(),
            };
            await RaydiumTokenService.create(data);
          }
        })
      );
    }
  } catch (error) {
    console.error(`Error fetching ${isAmm ? "AMM" : "CLMM"} data:`, error);
  }
}

async function initAMM(): Promise<void> {
  await fetchPoolData(RAYDIUM_AMM_URL, true);
}

async function initCLMM(): Promise<void> {
  await fetchPoolData(RAYDIUM_CLMM_URL, false);
}

interface MinimalTokenAccountData {
  mint: PublicKey;
  market: MinimalMarketLayoutV3;
}

export async function saveTokenAccount(
  mint: PublicKey,
  accountData: MinimalMarketLayoutV3
) {
  const key = `openmarket_${mint}`;
  const res = await redisClient.get(key);
  if (res === "added") return;

  const tokenAccount: MinimalTokenAccountData = {
    mint,
    market: {
      bids: accountData.bids,
      asks: accountData.asks,
      eventQueue: accountData.eventQueue,
    },
  };

  await redisClient.set(key, "added");
  await OpenMarketService.create(tokenAccount);
  return tokenAccount;
}

export async function checkMintable(
  vault: PublicKey
): Promise<boolean | undefined> {
  try {
    const { data } = await solanaConnection.getAccountInfo(vault) || {};
    if (!data) return;

    const deserialize = MintLayout.decode(data);
    return deserialize.mintAuthorityOption === 0;
  } catch (e) {
    console.error(`Failed to check mint for vault: ${vault}`, e);
  }
}

export async function getTop10HoldersPercent(
  connection: Connection,
  mint: string,
  supply: number
): Promise<number> {
  try {
    const accounts = await connection.getTokenLargestAccounts(
      new PublicKey(mint)
    );
    let sum = 0;
    let counter = 0;
    for (const account of accounts.value) {
      if (account.uiAmount && counter < 10) {
        sum += account.uiAmount;
        counter++;
      }
    }
    return sum / supply;
  } catch (e) {
    console.error(`Failed to get top 10 holders for ${mint}`, e);
    return 0;
  }
}

export async function processOpenBookMarket(
  updatedAccountInfo: KeyedAccountInfo
) {
  try {
    const accountData = MARKET_STATE_LAYOUT_V3.decode(
      updatedAccountInfo.accountInfo.data
    );

    await saveTokenAccount(accountData.baseMint, accountData);
  } catch (e) {
    console.error("Failed to process OpenBook market data:", e);
  }
}

export const runListener = async () => {
  const runTimestamp = Math.floor(new Date().getTime() / 1000);

  const ammSubscriptionId = solanaConnection.onLogs(
    RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
    async ({ logs, err, signature }) => {
      if (err) return;
      if (logs && logs.some((log) => log.includes("initialize2"))) {
        fetchRaydiumMints(signature, RAYDIUM_LIQUIDITY_PROGRAM_ID_V4.toString(), true);
      }
    },
    COMMITMENT_LEVEL
  );

  const clmmSubscriptionId = solanaConnection.onLogs(
    RAYDIUM_LIQUIDITY_PROGRAM_ID_CLMM,
    async ({ logs, err, signature }) => {
      if (err) return;
      if (logs && logs.some((log) => log.includes("OpenPositionV2"))) {
        fetchRaydiumMints(signature, RAYDIUM_LIQUIDITY_PROGRAM_ID_CLMM.toString(), false);
      }
    },
    COMMITMENT_LEVEL
  );

  async function fetchRaydiumMints(txId: string, instructionName: string, isAmm: boolean) {
    try {
      const tx = await connection.getParsedTransaction(txId, { maxSupportedTransactionVersion: 0, commitment: "confirmed" });
      const accounts = tx?.transaction.message.instructions.find((ix) => ix.programId.toString() === instructionName)?.accounts as PublicKey[];
      
      if (!accounts) return;

      const poolId = accounts[isAmm ? 4 : 5];
      if (existingLiquidityPools.has(poolId.toString())) return;
      existingLiquidityPools.add(poolId.toString());

      const tokenAaccount = accounts[isAmm ? 8 : 21];
      const tokenBaccount = accounts[isAmm ? 9 : 20];
      
      const key = `raydium_mint_${poolId.toString()}`;
      const res = await redisClient.get(key);
      if (res === "added") return;

      const tokenMetadata = await TokenService.fetchMetadataInfo(tokenAaccount);
      const data = {
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        mint: tokenAaccount.toString(),
        isAmm,
        poolId: poolId.toString(),  // Convert to string
        creation_ts: Date.now(),
      };

      await redisClient.set(key, "added");
      await RaydiumTokenService.create(data);

      if (isAmm) {
        await syncAmmPoolKeys(poolId.toString());
      } else {
        await syncClmmPoolKeys(poolId.toString());
      }
    } catch (e) {
      console.error("Error fetching Raydium mint:", e);
    }
  }

  console.info(`Listening for Raydium AMM changes: ${ammSubscriptionId}`);
  console.info(`Listening for Raydium CLMM changes: ${clmmSubscriptionId}`);
};
