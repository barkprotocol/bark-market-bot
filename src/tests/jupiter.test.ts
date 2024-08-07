import { JupiterClient } from '../api/jupiter';
import { Connection, PublicKey } from '@solana/web3.js';
import { MOCK_USER_KEYPAIR, MOCK_SOLANA_RPC_ENDPOINT } from '../constants/constants';

jest.mock('../api/jupiter');

describe('JupiterClient', () => {
    let jupiterClient: JupiterClient;
    let mockConnection: jest.Mocked<Connection>;

    beforeEach(() => {
        mockConnection = {
            // Mocking some of the Connection methods if they are used
            getSignatureStatus: jest.fn(),
            // Add other methods if required
        } as any;

        jupiterClient = new JupiterClient(mockConnection, MOCK_USER_KEYPAIR);
    });

    test('should initialize correctly', () => {
        expect(jupiterClient).toBeInstanceOf(JupiterClient);
        expect(jupiterClient.getConnection()).toBe(mockConnection);
        expect(jupiterClient.getUserKeypair()).toBe(MOCK_USER_KEYPAIR);
    });

    test('should get quote correctly', async () => {
        const mockQuote = { inAmount: '1000', outAmount: '950' };
        (jupiterClient.getQuote as jest.Mock).mockResolvedValue(mockQuote);

        const quote = await jupiterClient.getQuote(
            'mockToken0',
            'mockToken1',
            '1000',
            50
        );
        expect(quote).toEqual(mockQuote);
        expect(jupiterClient.getQuote).toHaveBeenCalledWith('mockToken0', 'mockToken1', '1000', 50);
    });

    test('should handle error in getQuote', async () => {
        (jupiterClient.getQuote as jest.Mock).mockRejectedValue(new Error('Failed to fetch quote'));

        await expect(
            jupiterClient.getQuote('mockToken0', 'mockToken1', '1000', 50)
        ).rejects.toThrow('Failed to fetch quote');
    });

    test('should get swap transaction correctly', async () => {
        const mockQuote = { inAmount: '1000', outAmount: '950' };
        const mockSwapTransaction = { swapTransaction: 'mockTransaction' };
        (jupiterClient.getQuote as jest.Mock).mockResolvedValue(mockQuote);
        (jupiterClient.getSwapTransaction as jest.Mock).mockResolvedValue(mockSwapTransaction);

        const swapTransaction = await jupiterClient.getSwapTransaction(mockQuote, true);
        expect(swapTransaction).toEqual(mockSwapTransaction);
        expect(jupiterClient.getSwapTransaction).toHaveBeenCalledWith(mockQuote, true);
    });

    test('should handle error in getSwapTransaction', async () => {
        const mockQuote = { inAmount: '1000', outAmount: '950' };
        (jupiterClient.getSwapTransaction as jest.Mock).mockRejectedValue(new Error('Failed to fetch swap transaction'));

        await expect(
            jupiterClient.getSwapTransaction(mockQuote, true)
        ).rejects.toThrow('Failed to fetch swap transaction');
    });

    test('should execute swap correctly', async () => {
        const mockSwapTransaction = 'mockTransaction';
        (jupiterClient.executeSwap as jest.Mock).mockResolvedValue(true);

        const result = await jupiterClient.executeSwap(mockSwapTransaction);
        expect(result).toBe(true);
        expect(jupiterClient.executeSwap).toHaveBeenCalledWith(mockSwapTransaction);
    });

    test('should handle error in executeSwap', async () => {
        const mockSwapTransaction = 'mockTransaction';
        (jupiterClient.executeSwap as jest.Mock).mockRejectedValue(new Error('Failed to execute swap'));

        await expect(
            jupiterClient.executeSwap(mockSwapTransaction)
        ).rejects.toThrow('Failed to execute swap');
    });
});
