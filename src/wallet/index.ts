import fs from 'fs';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import logger from '../utils/logger';

/**
 * Load user keypair from a specified file.
 * @returns {Keypair} - The loaded keypair.
 * @throws {Error} - Throws an error if the file does not exist, the keypair is invalid, or any other issue occurs.
 */
export function loadKeypair(): Keypair {
    const keypairPath = process.env.USER_KEYPAIR;

    if (!keypairPath) {
        throw new Error('Environment variable USER_KEYPAIR is not set.');
    }

    if (!fs.existsSync(keypairPath)) {
        throw new Error(`Keypair file not found at path: ${keypairPath}`);
    }

    try {
        // Read and trim the keypair file content
        const secretKeyString = fs.readFileSync(keypairPath, { encoding: 'utf8' }).trim();
        
        // Decode the base58-encoded secret key
        const secretKey = bs58.decode(secretKeyString);
        
        // Validate secret key length
        if (secretKey.length !== 64) {
            throw new Error('Invalid secret key length. Expected 64 bytes.');
        }
        
        // Create and return Keypair from secret key
        return Keypair.fromSecretKey(secretKey);
    } catch (error) {
        logger.error(`Failed to load keypair: ${error.message}`);
        throw error;  // Rethrow the error to be handled by higher-level code
    }
}
