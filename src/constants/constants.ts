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
        throw new Error(`Invalid cluster value: ${cluster}. Accepted values are ${VALID_CLUSTERS.join(', ')}.`);
    }
}

// Get and validate the `CLUSTER` environment variable, default to "mainnet-beta"
const clusterEnv = process.env.CLUSTER || "mainnet-beta";
export const ENV: Cluster = validateCluster(clusterEnv);

if (process.env.CLUSTER === undefined) {
    console.warn(`Using default cluster value: ${ENV}`);
}

// Token Mint Addresses
export const BARK_MINT_ADDRESS = "2NTvEssJ2i998V2cMGT4Fy3JhyFnAzHFonDo9dbAkVrg";
export const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";

// Additional constants
export const DEFAULT_SLIPPAGE_BPS = 50; // Default slippage basis points (0.5%)
export const DEFAULT_WAIT_TIME = 60000;  // Default wait time in milliseconds (1 minute)
