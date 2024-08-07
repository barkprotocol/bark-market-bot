declare module '@solana/web3.js' {
    import { Buffer } from 'buffer';

    export class PublicKey {
        constructor(value: string | Buffer | Uint8Array | Array<number>);

        /**
         * Converts the PublicKey to a string representation for easier logging and debugging.
         * @returns {string} The string representation of the PublicKey.
         */
        toString(): string;

        static isPublicKey(value: any): value is PublicKey;
        toBase58(): string;
        toBuffer(): Buffer;
        equals(other: PublicKey): boolean;
    }

    export class Keypair {
        constructor();
        
        publicKey: PublicKey;
        secretKey: Uint8Array;
        
        /**
         * Creates a Keypair instance from a secret key.
         * @param {Uint8Array} secretKey - The secret key as a Uint8Array.
         * @returns {Keypair} The Keypair instance.
         */
        static fromSecretKey(secretKey: Uint8Array): Keypair;

        /**
         * Generates a new Keypair with a random secret key.
         * @returns {Keypair} A new Keypair instance with a random secret key.
         */
        static generate(): Keypair;
    }

    export type Commitment = 'processed' | 'confirmed' | 'finalized';

    export class Connection {
        constructor(endpoint: string, commitment?: Commitment);
        
        getBalance(publicKey: PublicKey, commitment?: Commitment): Promise<number>;

        /**
         * Sends a transaction to the network.
         * @param {Transaction} transaction - The transaction to send.
         * @param {Array<Keypair>} [signers] - The signers for the transaction.
         * @param {Commitment} [commitment] - The commitment level to use.
         * @returns {Promise<string>} A promise that resolves to the transaction signature.
         */
        sendTransaction(transaction: Transaction, signers?: Array<Keypair>, commitment?: Commitment): Promise<string>;

        /**
         * Fetches account information for a given public key.
         * @param {PublicKey} publicKey - The public key of the account to retrieve.
         * @param {Commitment} [commitment] - The level of commitment to the transaction.
         * @returns {Promise<AccountInfo | null>} A promise that resolves to the account information or null if not found.
         */
        getAccountInfo(publicKey: PublicKey, commitment?: Commitment): Promise<AccountInfo | null>;

        /**
         * Confirms the transaction status by its signature.
         * @param {string} signature - The transaction signature to confirm.
         * @param {Commitment} [commitment] - The level of commitment to the transaction.
         * @returns {Promise<ConfirmationStatus>} A promise that resolves to the transaction confirmation status.
         */
        confirmTransaction(signature: string, commitment?: Commitment): Promise<ConfirmationStatus>;
    }

    export class Transaction {
        constructor();
        
        /**
         * Signs the transaction with the provided signers.
         * @param {...Array<Keypair>} signers - The signers for the transaction.
         */
        sign(...signers: Array<Keypair>): void;

        serialize(): Uint8Array;

        /**
         * Adds instructions to the transaction.
         * @param {...Array<any>} instructions - The instructions to add.
         */
        add(...instructions: Array<any>): void;

        /**
         * Retrieves the base58 encoded signature of the transaction.
         * @returns {string} The base58 encoded signature of the transaction.
         */
        getSignature(): string;
    }
}
