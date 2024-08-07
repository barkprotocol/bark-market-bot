import dotenv from 'dotenv';
import { JupiterClient } from './api/jupiter';
import { setupSolanaConnection } from './api/solana';
import { MarketMaker } from './strategies/basicMM';
import { loadKeypair } from './wallet';
import winston from 'winston';
import Joi from 'joi';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Set up logging with winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log', maxsize: 10485760, maxFiles: 5 }) // Log rotation
    ],
});

// Define environment variable schema using Joi
const envSchema = Joi.object({
    SOLANA_RPC_ENDPOINT: Joi.string().uri().required().description('The Solana RPC endpoint URL.'),
    USER_KEYPAIR: Joi.string().required().description('The path to the file containing the user keypair.'),
    ENABLE_TRADING: Joi.string().valid('true', 'false').default('false').description('Flag to enable or disable trading. Defaults to false.'),
}).unknown(true); // Allow unknown variables

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
    logger.error(`Environment validation error: ${error.message}`);
    process.exit(1);
}

// Main function
async function main(): Promise<void> {
    const solanaRpcEndpoint = envVars.SOLANA_RPC_ENDPOINT;
    const userKeypairPath = envVars.USER_KEYPAIR;
    const enableTrading = envVars.ENABLE_TRADING === 'true';

    // Set up Solana connection
    let connection;
    try {
        connection = setupSolanaConnection(solanaRpcEndpoint);
        logger.info(`Connected to Solana network at: ${solanaRpcEndpoint}`);
    } catch (error) {
        logger.error(`Failed to connect to Solana network: ${error.message}`);
        process.exit(1);
    }

    // Validate the keypair file path
    if (!fs.existsSync(userKeypairPath)) {
        logger.error(`Keypair file not found: ${userKeypairPath}`);
        process.exit(1);
    }

    // Load the user's keypair
    let userKeypair;
    try {
        userKeypair = loadKeypair(userKeypairPath);
        logger.info(`MarketMaker Public Key: ${userKeypair.publicKey.toBase58()}`);
    } catch (error) {
        logger.error(`Failed to load user keypair: ${error.message}`);
        process.exit(1);
    }

    // Initialize Jupiter client
    let jupiterClient: JupiterClient;
    try {
        jupiterClient = new JupiterClient(connection, userKeypair);
        logger.info('Jupiter client initialized successfully.');
    } catch (error) {
        logger.error(`Failed to initialize Jupiter client: ${error.message}`);
        process.exit(1);
    }

    // Create and run the market maker
    const marketMaker = new MarketMaker();
    try {
        await marketMaker.runMM(jupiterClient, enableTrading);
    } catch (error) {
        logger.error(`Error running MarketMaker: ${error.message}`);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM. Shutting down gracefully...');
    process.exit(0);
});

// Execute the main function and handle any unhandled errors
main().catch((error) => {
    logger.error(`Unhandled error in main function: ${error.message}`);
    process.exit(1);
});
