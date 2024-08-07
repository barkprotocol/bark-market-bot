import bs58 from 'bs58';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

/**
 * Extracts and encodes the signature from a Solana transaction.
 * @param {Transaction | VersionedTransaction} transaction - The Solana transaction object.
 * @returns {string} - The base58 encoded signature of the transaction.
 * @throws {Error} - If the transaction does not have a signature or is of an unsupported type.
 */
export function getSignature(transaction: Transaction | VersionedTransaction): string {
    let signature: Uint8Array;

    if (transaction instanceof VersionedTransaction) {
        // For VersionedTransaction, access the first signature directly
        if (transaction.signatures.length > 0) {
            signature = transaction.signatures[0];
        } else {
            throw new Error('VersionedTransaction does not have any signatures.');
        }
    } else if (transaction instanceof Transaction) {
        // For Transaction, access the signature from the first signature object
        if (transaction.signatures.length > 0) {
            const sig = transaction.signatures[0];
            if (sig && sig.signature) {
                signature = sig.signature;
            } else {
                throw new Error('Transaction signature is undefined or invalid.');
            }
        } else {
            throw new Error('Transaction does not have any signatures.');
        }
    } else {
        throw new Error('Unsupported transaction type. Expected Transaction or VersionedTransaction.');
    }

    // Ensure the signature is a Uint8Array
    if (!(signature instanceof Uint8Array)) {
        throw new Error('Signature is not a valid Uint8Array.');
    }

    return bs58.encode(signature);
}
