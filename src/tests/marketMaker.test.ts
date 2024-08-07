import { MarketMaker } from '../strategies/advancedMM';
import { JupiterClient } from '../api/jupiter';
import { Decimal } from 'decimal.js';
import { PublicKey } from '@solana/web3.js';

// Mock constants for testing
const MOCK_SOL_TOKEN = { address: '', symbol: 'SOL Test', decimals: 9 };
const MOCK_BARK_TOKEN = { address: '', symbol: 'BARK Test Token', decimals: 9 };
const MOCK_USDC_TOKEN = { address: '', symbol: 'USDC Test', decimals: 6 };

const MOCK_TRADE_PAIR = { token0: MOCK_SOL_TOKEN, token1: MOCK_BARK_TOKEN };

jest.mock('../api/jupiter');

describe('MarketMaker', () => {
    let marketMaker: MarketMaker;
    let jupiterClient: jest.Mocked<JupiterClient>;

    beforeEach(() => {
        jupiterClient = {
            getQuote: jest.fn(),
            getSwapTransaction: jest.fn(),
            executeSwap: jest.fn(),
            getConnection: jest.fn(),
            getUserKeypair: jest.fn(),
        } as any;
        marketMaker = new MarketMaker();
    });

    test('should create an instance correctly', () => {
        expect(marketMaker).toBeInstanceOf(MarketMaker);
    });

    test('should evaluate trade necessity correctly', async () => {
        jest.spyOn(marketMaker, 'getUSDValue').mockResolvedValue(new Decimal(1));
        jest.spyOn(marketMaker, 'fetchTokenBalance').mockResolvedValue(new Decimal(10));

        const result = await marketMaker.determineTradeNecessity(
            jupiterClient,
            MOCK_TRADE_PAIR,
            new Decimal(10),
            new Decimal(5)
        );

        expect(result.tradeNeeded).toBe(true);
        expect(result.solAmountToTrade).toBeInstanceOf(Decimal);
        expect(result.BARKAmountToTrade).toBeInstanceOf(Decimal);
        expect(result.solAmountToTrade.toString()).toBe('10'); // Adjust based on expected logic
        expect(result.BARKAmountToTrade.toString()).toBe('9.5'); // Adjust based on expected logic
    });

    test('should perform trade correctly if trading is enabled', async () => {
        jest.spyOn(marketMaker, 'getUSDValue').mockResolvedValue(new Decimal(1));
        jest.spyOn(marketMaker, 'fetchTokenBalance').mockResolvedValue(new Decimal(10));

        const mockQuote = { inAmount: '1000', outAmount: '950' };
        (jupiterClient.getQuote as jest.Mock).mockResolvedValue(mockQuote);
        (jupiterClient.getSwapTransaction as jest.Mock).mockResolvedValue('mockTransaction');
        (jupiterClient.executeSwap as jest.Mock).mockResolvedValue(true);

        await marketMaker.performTrade(
            jupiterClient,
            MOCK_TRADE_PAIR,
            new Decimal(1),
            new Decimal(0),
            true // enableTrading
        );

        expect(jupiterClient.getQuote).toHaveBeenCalledWith(
            MOCK_SOL_TOKEN.address, 
            MOCK_BARK_TOKEN.address, 
            '1000000000', // Assuming 1 SOL = 10^9 in base units
            expect.any(Number) // For slippage basis points, adjust based on your logic
        );
        expect(jupiterClient.getSwapTransaction).toHaveBeenCalled();
        expect(jupiterClient.executeSwap).toHaveBeenCalledWith('mockTransaction');
    });

    test('should not perform trade if trading is disabled', async () => {
        jest.spyOn(marketMaker, 'getUSDValue').mockResolvedValue(new Decimal(1));
        jest.spyOn(marketMaker, 'fetchTokenBalance').mockResolvedValue(new Decimal(10));

        const mockQuote = { inAmount: '1000', outAmount: '950' };
        (jupiterClient.getQuote as jest.Mock).mockResolvedValue(mockQuote);
        (jupiterClient.getSwapTransaction as jest.Mock).mockResolvedValue('mockTransaction');

        await marketMaker.performTrade(
            jupiterClient,
            MOCK_TRADE_PAIR,
            new Decimal(1),
            new Decimal(0),
            false // disableTrading
        );

        expect(jupiterClient.getQuote).toHaveBeenCalled();
        expect(jupiterClient.getSwapTransaction).toHaveBeenCalled();
        expect(jupiterClient.executeSwap).not.toHaveBeenCalled();
    });

    test('should handle errors during trade evaluation and execution', async () => {
        jest.spyOn(marketMaker, 'getUSDValue').mockRejectedValue(new Error('Failed to get USD value'));
        jest.spyOn(marketMaker, 'fetchTokenBalance').mockResolvedValue(new Decimal(10));

        await expect(
            marketMaker.evaluateAndExecuteTrade(
                jupiterClient,
                MOCK_TRADE_PAIR,
                true
            )
        ).rejects.toThrow('Error during trade evaluation or execution: Failed to get USD value');

        jest.spyOn(marketMaker, 'getUSDValue').mockResolvedValue(new Decimal(1));
        jest.spyOn(marketMaker, 'fetchTokenBalance').mockResolvedValue(new Decimal(10));
        (jupiterClient.getQuote as jest.Mock).mockResolvedValue({ inAmount: '1000', outAmount: '950' });
        (jupiterClient.getSwapTransaction as jest.Mock).mockResolvedValue('mockTransaction');
        (jupiterClient.executeSwap as jest.Mock).mockRejectedValue(new Error('Failed to execute swap'));

        await expect(
            marketMaker.performTrade(
                jupiterClient,
                MOCK_TRADE_PAIR,
                new Decimal(1),
                new Decimal(0),
                true
            )
        ).rejects.toThrow('Error performing trade: Failed to execute swap');
    });
});
