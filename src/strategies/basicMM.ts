import { JupiterClient } from '../api/jupiter';
import { SOL_MINT_ADDRESS, BARK_MINT_ADDRESS, USDC_MINT_ADDRESS } from '../constants/constants';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import Decimal from 'decimal.js';
import { fromNumberToLamports } from '../utils/convert';
import { Connection, PublicKey } from '@solana/web3.js';
import { sleep } from '../utils/sleep';
import logger from '../utils/logger';

/**
 * Class for implementing a basic market-making strategy.
 */
export class MarketMaker {
    private barkToken = { address: BARK_MINT_ADDRESS, symbol: 'BARK', decimals: 9 };
    private solToken = { address: SOL_MINT_ADDRESS, symbol: 'SOL', decimals: 9 };
    private usdcToken = { address: USDC_MINT_ADDRESS, symbol: 'USDC', decimals: 6 };
    private waitTime: number;
    private slippageBps: number;
    private priceTolerance: number;
    private rebalancePercentage: number;

    constructor(
        waitTime: number = 60000, // 1 minute
        slippageBps: number = 50, // 0.5%
        priceTolerance: number = 0.02, // 2%
        rebalancePercentage: number = 0.5 // 50%
    ) {
        this.waitTime = waitTime;
        this.slippageBps = slippageBps;
        this.priceTolerance = priceTolerance;
        this.rebalancePercentage = rebalancePercentage;
    }

    /**
     * Executes the market-making strategy.
     * @param {JupiterClient} jupiterClient - Instance of JupiterClient.
     * @param {boolean} enableTrading - Flag to enable or disable trading.
     */
    async runMM(jupiterClient: JupiterClient, enableTrading: boolean = false): Promise<void> {
        const tradePairs = [{ token0: this.solToken, token1: this.barkToken }];

        while (true) {
            for (const pair of tradePairs) {
                try {
                    await this.evaluateAndExecuteTrade(jupiterClient, pair, enableTrading);
                } catch (error) {
                    logger.error(`Error evaluating and executing trade for pair ${pair.token0.symbol}/${pair.token1.symbol}: ${error.message}`);
                }
            }

            logger.info(`Waiting for ${this.waitTime / 1000} seconds...`);
            await sleep(this.waitTime);
        }
    }

    /**
     * Evaluates if a trade is needed and performs it if necessary.
     * @param {JupiterClient} jupiterClient - Instance of JupiterClient.
     * @param {TradePair} pair - Trading pair containing token0 and token1.
     * @param {boolean} enableTrading - Flag to enable or disable trading.
     */
    private async evaluateAndExecuteTrade(
        jupiterClient: JupiterClient,
        pair: TradePair,
        enableTrading: boolean
    ): Promise<void> {
        try {
            const [token0Balance, token1Balance] = await Promise.all([
                this.fetchTokenBalance(jupiterClient, pair.token0),
                this.fetchTokenBalance(jupiterClient, pair.token1),
            ]);

            logger.info(`Token0 balance (${pair.token0.symbol}): ${token0Balance.toString()}`);
            logger.info(`Token1 balance (${pair.token1.symbol}): ${token1Balance.toString()}`);

            const { tradeNeeded, solAmountToTrade, BARKAmountToTrade } = await this.determineTradeNecessity(
                jupiterClient,
                pair,
                token0Balance,
                token1Balance
            );

            if (tradeNeeded) {
                await this.performTrade(jupiterClient, pair, solAmountToTrade, BARKAmountToTrade, enableTrading);
            } else {
                logger.info('No trade needed.');
            }
        } catch (error) {
            logger.error(`Error during trade evaluation or execution: ${error.message}`);
        }
    }

    /**
     * Executes the trade based on the amounts determined.
     * @param {JupiterClient} jupiterClient - Instance of JupiterClient.
     * @param {TradePair} pair - Trading pair containing token0 and token1.
     * @param {Decimal} solAmountToTrade - Amount of SOL to trade.
     * @param {Decimal} BARKAmountToTrade - Amount of BARK to trade.
     * @param {boolean} enableTrading - Flag to enable or disable trading.
     */
    private async performTrade(
        jupiterClient: JupiterClient,
        pair: TradePair,
        solAmountToTrade: Decimal,
        BARKAmountToTrade: Decimal,
        enableTrading: boolean
    ): Promise<void> {
        try {
            if (solAmountToTrade.gt(0)) {
                logger.info(`Trading ${solAmountToTrade.toString()} SOL for BARK...`);
                const lamportsAsString = fromNumberToLamports(solAmountToTrade.toNumber(), pair.token0.decimals).toString();
                const quote = await jupiterClient.getQuote(pair.token0.address, pair.token1.address, lamportsAsString, this.slippageBps);
                const swapTransaction = await jupiterClient.getSwapTransaction(quote);

                if (enableTrading) {
                    await jupiterClient.executeSwap(swapTransaction);
                    logger.info('Trade executed.');
                } else {
                    logger.info('Trading is disabled.');
                }
            } else if (BARKAmountToTrade.gt(0)) {
                logger.info(`Trading ${BARKAmountToTrade.toString()} BARK for SOL...`);
                const lamportsAsString = fromNumberToLamports(BARKAmountToTrade.toNumber(), pair.token1.decimals).toString();
                const quote = await jupiterClient.getQuote(pair.token1.address, pair.token0.address, lamportsAsString, this.slippageBps);
                const swapTransaction = await jupiterClient.getSwapTransaction(quote);

                if (enableTrading) {
                    await jupiterClient.executeSwap(swapTransaction);
                    logger.info('Trade executed.');
                } else {
                    logger.info('Trading is disabled.');
                }
            }
        } catch (error) {
            logger.error(`Error performing trade: ${error.message}`);
        }
    }

    /**
     * Determines whether a trade is needed based on the current balances and prices.
     * @param {JupiterClient} jupiterClient - Instance of JupiterClient.
     * @param {TradePair} pair - Trading pair containing token0 and token1.
     * @param {Decimal} token0Balance - Balance of token0.
     * @param {Decimal} token1Balance - Balance of token1.
     * @returns {Promise<{ tradeNeeded: boolean, solAmountToTrade: Decimal, BARKAmountToTrade: Decimal }>} - Trade necessity details.
     */
    private async determineTradeNecessity(
        jupiterClient: JupiterClient,
        pair: TradePair,
        token0Balance: Decimal,
        token1Balance: Decimal
    ): Promise<{ tradeNeeded: boolean, solAmountToTrade: Decimal, BARKAmountToTrade: Decimal }> {
        try {
            const [token0Price, token1Price] = await Promise.all([
                this.getUSDValue(jupiterClient, pair.token0),
                this.getUSDValue(jupiterClient, pair.token1),
            ]);

            const token0Value = token0Balance.mul(token0Price);
            const token1Value = token1Balance.mul(token1Price);

            const totalPortfolioValue = token0Value.add(token1Value);
            const targetValuePerToken = totalPortfolioValue.div(new Decimal(2));

            let solAmountToTrade = new Decimal(0);
            let BARKAmountToTrade = new Decimal(0);
            let tradeNeeded = false;

            logger.info(`${pair.token0.symbol} value: ${token0Value.toString()}`);
            logger.info(`${pair.token1.symbol} value: ${token1Value.toString()}`);

            if (token0Value.gt(targetValuePerToken)) {
                const valueDiff = token0Value.sub(targetValuePerToken);
                solAmountToTrade = valueDiff.div(token0Price);
                tradeNeeded = true;
            } else if (token1Value.gt(targetValuePerToken)) {
                const valueDiff = token1Value.sub(targetValuePerToken);
                BARKAmountToTrade = valueDiff.div(token1Price);
                tradeNeeded = true;
            }

            const minimumTradeAmount = new Decimal(0.01); // Minimum trade amount
            if (solAmountToTrade.lt(minimumTradeAmount) && BARKAmountToTrade.lt(minimumTradeAmount)) {
                tradeNeeded = false;
            }

            return { tradeNeeded, solAmountToTrade, BARKAmountToTrade };
        } catch (error) {
            logger.error(`Error determining trade necessity: ${error.message}`);
            return { tradeNeeded: false, solAmountToTrade: new Decimal(0), BARKAmountToTrade: new Decimal(0) };
        }
    }

    /**
     * Fetches the balance of a token.
     * @param {JupiterClient} jupiterClient - Instance of JupiterClient.
     * @param {Token} token - Token object containing address and symbol.
     * @returns {Promise<Decimal>} - Token balance.
     */
    private async fetchTokenBalance(
        jupiterClient: JupiterClient,
        token: Token
    ): Promise<Decimal> {
        try {
            const connection = jupiterClient.getConnection();
            const publicKey = jupiterClient.getUserKeypair().publicKey;

            const balance = token.address === SOL_MINT_ADDRESS
                ? await connection.getBalance(publicKey)
                : await this.getSPLTokenBalance(connection, publicKey, new PublicKey(token.address));

            return new Decimal(balance).div(new Decimal(10).pow(token.decimals));
        } catch (error) {
            logger.error(`Error fetching balance for token ${token.symbol}: ${error.message}`);
            return new Decimal(0);
        }
    }

    /**
     * Retrieves the SPL token balance from the Solana blockchain.
     * @param {Connection} connection - Solana connection object.
     * @param {PublicKey} walletAddress - Public key of the wallet.
     * @param {PublicKey} tokenMintAddress - Token mint address.
     * @returns {Promise<Decimal>} - Token balance.
     */
    private async getSPLTokenBalance(
        connection: Connection,
        walletAddress: PublicKey,
        tokenMintAddress: PublicKey
    ): Promise<Decimal> {
        try {
            const accounts = await connection.getParsedTokenAccountsByOwner(walletAddress, { programId: TOKEN_PROGRAM_ID });
            const accountInfo = accounts.value.find((account: any) => account.account.data.parsed.info.mint === tokenMintAddress.toBase58());
            return accountInfo ? new Decimal(account.account.data.parsed.info.tokenAmount.amount) : new Decimal(0);
        } catch (error) {
            logger.error('Error fetching SPL token balance:', error.message);
            return new Decimal(0);
        }
    }

    /**
     * Gets the USD value of a token.
     * @param {JupiterClient} jupiterClient - Instance of JupiterClient.
     * @param {Token} token - Token object containing address and symbol.
     * @returns {Promise<Decimal>} - USD value of the token.
     */
    private async getUSDValue(
        jupiterClient: JupiterClient,
        token: Token
    ): Promise<Decimal> {
        try {
            const quote = await jupiterClient.getQuote(token.address, this.usdcToken.address, fromNumberToLamports(1, token.decimals).toString(), this.slippageBps);
            return new Decimal(quote.outAmount).div(new Decimal(10).pow(this.usdcToken.decimals));
        } catch (error) {
            logger.error(`Error fetching USD value for token ${token.symbol}: ${error.message}`);
            return new Decimal(0);
        }
    }
}

/**
 * Interface representing a trading pair.
 */
interface TradePair {
    token0: Token;
    token1: Token;
}

/**
 * Interface representing token details.
 */
interface Token {
    address: string;
    symbol: string;
    decimals: number;
}
