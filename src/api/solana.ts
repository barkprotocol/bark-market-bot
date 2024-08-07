import fs from 'fs';
import bs58 from 'bs58';
import { Keypair, Connection, Commitment, PublicKey, Transaction } from '@solana/web3.js';

/**
 * Sets up a connection to a Solana RPC endpoint.
 * @param {string} endpoint - The Solana RPC endpoint URL.
 * @param {Commitment} [commitment='confirmed'] - The level of commitment for the connection.
 * @returns {Connection} - The Solana Connection object.
 * @throws {Error} - Throws an error if the endpoint is invalid or if the connection fails.
 */
export function setupSolanaConnection(endpoint: string, commitment: Commitment = 'confirmed'): Connection {
    if (typeof endpoint !== 'string' || endpoint.trim() === '') {
        throw new Error('Invalid endpoint provided. Must be a non-empty string.');
    }

    try {
        return new Connection(endpoint, commitment);
    } catch (error) {
        console.error('Failed to create Solana connection:', error);
        throw new Error(`Failed to create Solana connection: ${error.message}`);
    }
}

/**
 * Retrieves a user keypair from a file containing a base58-encoded secret key.
 * @param {string} filePath - Path to the file containing the base58-encoded secret key.
 * @returns {Keypair} - The Solana Keypair object.
 * @throws {Error} - Throws an error if the file does not exist, the key is invalid, or any other issue occurs.
 */
export function getUserKeypair(filePath: string): Keypair {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
    }

    try {
        const secretKeyString = fs.readFileSync(filePath, { encoding: 'utf8' }).trim();
        const secretKey = bs58.decode(secretKeyString);

        // Ensure the secret key has the correct length
        if (secretKey.length !== 64) {
            throw new Error('Invalid secret key length. Expected a 64-byte key.');
        }

        return Keypair.fromSecretKey(secretKey);
    } catch (error) {
        console.error('Failed to get user keypair from file:', error);
        throw new Error(`Failed to get user keypair from file: ${error.message}`);
    }
}

/**
 * Converts a public key from its base58 string representation to a `PublicKey` object.
 * @param {string} base58PublicKey - Base58 encoded public key string.
 * @returns {PublicKey} - The `PublicKey` object.
 * @throws {Error} - Throws an error if the public key is invalid.
 */
export function base58ToPublicKey(base58PublicKey: string): PublicKey {
    try {
        return new PublicKey(base58PublicKey);
    } catch (error) {
        console.error('Failed to convert base58 public key to PublicKey:', error);
        throw new Error(`Failed to convert base58 public key to PublicKey: ${error.message}`);
    }
}

/**
 * Gets account info for a given public key from the Solana blockchain.
 * @param {Connection} connection - The Solana Connection object.
 * @param {PublicKey} publicKey - The public key to query.
 * @returns {Promise<any>} - The account info associated with the public key.
 * @throws {Error} - Throws an error if the account info retrieval fails.
 */
export async function getAccountInfo(connection: Connection, publicKey: PublicKey): Promise<any> {
    try {
        return await connection.getAccountInfo(publicKey);
    } catch (error) {
        console.error('Failed to get account info:', error);
        throw new Error(`Failed to get account info: ${error.message}`);
    }
}

/**
 * Sends a transaction to the Solana blockchain and confirms it.
 * @param {Connection} connection - The Solana Connection object.
 * @param {Transaction} transaction - The transaction to send.
 * @param {Array<Keypair>} [signers] - Optional list of signers for the transaction.
 * @param {Commitment} [commitment='confirmed'] - The commitment level for the transaction.
 * @returns {Promise<string>} - The transaction signature.
 * @throws {Error} - Throws an error if the transaction fails.
 */
export async function sendAndConfirmTransaction(
    connection: Connection,
    transaction: Transaction,
    signers: Array<Keypair> = [],
    commitment: Commitment = 'confirmed'
): Promise<string> {
    try {
        const signature = await connection.sendTransaction(transaction, signers, { commitment });
        await connection.confirmTransaction(signature, commitment);
        return signature;
    } catch (error) {
        console.error('Failed to send and confirm transaction:', error);
        throw new Error(`Failed to send and confirm transaction: ${error.message}`);
    }
}
