import { Cluster } from "@solana/web3.js";

// Define acceptable cluster values
const VALID_CLUSTERS: Cluster[] = ["mainnet-beta", "devnet", "testnet"];

/**
 * Validate the `CLUSTER` environment variable.
 * @param cluster The value of the `CLUSTER` environment variable.
 * @returns The validated cluster value.
 * @throws Error if the cluster value is invalid.
 */
function validateCluster(cluster: any): Cluster {
    if (typeof cluster !== 'string') {
        throw new Error(`Invalid type for cluster value: ${typeof cluster}. Expected a string.`);
    }

    const normalizedCluster = cluster.trim().toLowerCase() as Cluster;

    if (VALID_CLUSTERS.includes(normalizedCluster)) {
        return normalizedCluster;
    } else {
        throw new Error(`Invalid cluster value: "${cluster}". Accepted values are: ${VALID_CLUSTERS.join(', ')}.`);
    }
}

// Get and validate the `CLUSTER` environment variable, default to "mainnet-beta"
const defaultCluster: Cluster = "mainnet-beta";
export const ENV: Cluster = validateCluster(process.env.CLUSTER || defaultCluster);

// Application-level configurations
export const APP_CONFIG = {
    // Logging configurations
    logLevel: process.env.LOG_LEVEL || 'info',
    logFilePath: process.env.LOG_FILE_PATH || 'application.log',
    exceptionFilePath: process.env.EXCEPTION_FILE_PATH || 'exceptions.log',
    rejectionFilePath: process.env.REJECTION_FILE_PATH || 'rejections.log',

    // Token Mint Addresses
    BARK_MINT_ADDRESS: "2NTvEssJ2i998V2cMGT4Fy3JhyFnAzHFonDo9dbAkVrg",
    USDC_MINT_ADDRESS: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    SOL_MINT_ADDRESS: "So11111111111111111111111111111111111111112",

    // Cluster URLs (for potential usage in application)
    CLUSTER_URLS: {
        'mainnet-beta': 'https://api.mainnet-beta.solana.com',
        'devnet': 'https://api.devnet.solana.com',
        'testnet': 'https://api.testnet.solana.com'
    },

    // Trading Strategy Parameters
    TRADING_STRATEGY: {
        waitTime: Number(process.env.TRADING_WAIT_TIME) || 60000, // 1 minute in milliseconds
        slippageBps: Number(process.env.TRADING_SLIPPAGE_BPS) || 50, // 0.5% slippage
        priceTolerance: Number(process.env.TRADING_PRICE_TOLERANCE) || 0.02, // 2% price tolerance
        rebalancePercentage: Number(process.env.TRADING_REBALANCE_PERCENTAGE) || 0.5, // 50% rebalance
    },

    // Dynamic Slippage Adjustment Configuration
    DYNAMIC_SLIPPAGE: {
        enabled: process.env.DYNAMIC_SLIPPAGE_ENABLED === 'true',
        baseSlippageBps: Number(process.env.DYNAMIC_SLIPPAGE_BASE_BPS) || 50, // Base slippage in basis points (0.5%)
        maxSlippageBps: Number(process.env.DYNAMIC_SLIPPAGE_MAX_BPS) || 100, // Maximum slippage in basis points (1%)
    }
};

export default APP_CONFIG;
