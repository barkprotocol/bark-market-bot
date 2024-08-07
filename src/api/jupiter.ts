import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';

interface QuoteResponse {
    [key: string]: any;
}

interface SwapTransactionResponse {
    swapTransaction: string;
}

class RateLimitError extends Error {}
class TransactionError extends Error {}

/**
 * Class for interacting with the Jupiter API to perform token swaps on the Solana blockchain.
 */
export class JupiterClient {
    private baseUri: string;
    private retryAttempts: number;
    private retryDelay: number;

    /**
     * Constructs a JupiterClient instance.
     * @param connection The Solana connection object.
     * @param userKeypair The user's Solana Keypair.
     * @param retryAttempts Number of retry attempts.
     * @param retryDelay Initial delay between retries in milliseconds.
     */
    constructor(
        private connection: Connection,
        private userKeypair: Keypair,
        retryAttempts: number = 3,
        retryDelay: number = 1000
    ) {
        this.baseUri = process.env.JUPITER_API_BASE_URI || 'https://quote-api.jup.ag/v6';
        if (!this.baseUri) {
            throw new Error('JUPITER_API_BASE_URI environment variable is not set.');
        }
        this.retryAttempts = retryAttempts;
        this.retryDelay = retryDelay;
    }

    public getConnection(): Connection {
        return this.connection;
    }

    public getUserKeypair(): Keypair {
        return this.userKeypair;
    }

    /**
     * Retrieves a swap quote from the Jupiter API with rate limit handling.
     * @param inputMint The address of the input token mint.
     * @param outputMint The address of the output token mint.
     * @param amount The amount of input tokens to swap.
     * @param slippageBps The maximum slippage allowed, in basis points.
     * @returns A promise that resolves to the swap quote.
     */
    async getQuote(inputMint: string, outputMint: string, amount: string, slippageBps: number): Promise<QuoteResponse> {
        this.validateAddress(inputMint);
        this.validateAddress(outputMint);
        this.validateAmount(amount);
        this.validateSlippage(slippageBps);

        console.log(`Getting quote for ${amount} ${inputMint} -> ${outputMint}`);

        let attempts = 0;
        let currentDelay = this.retryDelay;

        while (attempts < this.retryAttempts) {
            try {
                const response = await fetch(
                    `${this.baseUri}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
                );
                const quoteResponse = await response.json();

                if (!response.ok) {
                    if (response.status === 429) { // Rate limit exceeded
                        throw new RateLimitError('Rate limit exceeded');
                    }
                    console.error('Failed to get quote:', quoteResponse.error);
                    throw new TransactionError(`Failed to get quote: ${quoteResponse.error}`);
                }

                return quoteResponse;
            } catch (error) {
                if (attempts >= this.retryAttempts || !(error instanceof RateLimitError)) {
                    console.error('Error fetching quote:', error);
                    throw error;
                }

                attempts++;
                console.warn(`Retrying (${attempts}/${this.retryAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay = Math.min(currentDelay * 2, 16000); // Exponential backoff, cap at 16 seconds
            }
        }

        throw new Error('Exceeded maximum retry attempts');
    }

    /**
     * Retrieves a swap transaction from the Jupiter API with rate limit handling.
     * @param quoteResponse The response from the getQuote method.
     * @param wrapAndUnwrapSol Whether to wrap and unwrap SOL if necessary.
     * @param feeAccount An optional fee account address.
     * @returns A promise that resolves to the swap transaction.
     */
    async getSwapTransaction(quoteResponse: QuoteResponse, wrapAndUnwrapSol: boolean = true, feeAccount?: string): Promise<SwapTransactionResponse> {
        const body = {
            quoteResponse,
            userPublicKey: this.userKeypair.publicKey.toString(),
            wrapAndUnwrapSol,
            ...(feeAccount && { feeAccount })
        };

        let attempts = 0;
        let currentDelay = this.retryDelay;

        while (attempts < this.retryAttempts) {
            try {
                const response = await fetch(`${this.baseUri}/swap`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    if (response.status === 429) { // Rate limit exceeded
                        throw new RateLimitError('Rate limit exceeded');
                    }
                    const errorText = await response.text();
                    console.error('Failed to get swap transaction:', errorText);
                    throw new TransactionError(`Failed to get swap transaction: ${errorText}`);
                }

                return await response.json();
            } catch (error) {
                if (attempts >= this.retryAttempts || !(error instanceof RateLimitError)) {
                    console.error('Error fetching swap transaction:', error);
                    throw error;
                }

                attempts++;
                console.warn(`Retrying (${attempts}/${this.retryAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay = Math.min(currentDelay * 2, 16000); // Exponential backoff, cap at 16 seconds
            }
        }

        throw new Error('Exceeded maximum retry attempts');
    }

    /**
     * Executes a swap transaction on the Solana blockchain.
     * @param swapTransaction The swap transaction obtained from getSwapTransaction, encoded in base64.
     * @returns A promise that resolves to a boolean indicating whether the transaction was successfully confirmed.
     */
    async executeSwap(swapTransaction: string): Promise<boolean> {
        try {
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            transaction.sign([this.userKeypair]);

            const txId = await this.connection.sendRawTransaction(transaction.serialize(), {
                skipPreflight: true,
                preflightCommitment: 'singleGossip',
            });
            console.log('Swap transaction sent:', txId);

            const confirmation = await this.waitForTransactionConfirmation(txId);

            if (!confirmation) {
                console.error('Swap transaction confirmation timed out');
                return false;
            }

            console.log('Swap transaction confirmed');
            return true;
        } catch (error) {
            console.error('Failed to send swap transaction:', error);
            return false;
        }
    }

    /**
     * Waits for a transaction to be confirmed on the Solana blockchain.
     * @param txId The ID of the transaction to wait for.
     * @param timeout The maximum time to wait for confirmation, in milliseconds. Defaults to 60000 ms.
     * @returns A promise that resolves to a boolean indicating whether the transaction was confirmed within the timeout period.
     */
    async waitForTransactionConfirmation(txId: string, timeout = 60000): Promise<boolean> {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const status = await this.connection.getSignatureStatus(txId);
            if (status && status.value && status.value.confirmationStatus === 'finalized') {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return false;
    }

    // Input validation functions
    private validateAddress(address: string): void {
        if (!/^([A-Za-z0-9]{44})$/.test(address)) {
            throw new Error(`Invalid address format: ${address}`);
        }
    }

    private validateAmount(amount: string): void {
        if (!/^\d+(\.\d+)?$/.test(amount)) {
            throw new Error(`Invalid amount format: ${amount}`);
        }
    }

    private validateSlippage(slippageBps: number): void {
        if (slippageBps < 0 || slippageBps > 10000) {
            throw new Error(`Slippage basis points must be between 0 and 10000: ${slippageBps}`);
        }
    }
}
