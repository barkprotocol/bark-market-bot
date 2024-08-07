import { setupSolanaConnection } from '../api/solana';
import { Connection } from '@solana/web3.js';

// Mock the Connection class to ensure isolation from the actual Solana API
jest.mock('@solana/web3.js', () => ({
    Connection: jest.fn().mockImplementation((endpoint: string) => ({
        rpcEndpoint: endpoint
    }))
}));

describe('Solana Utilities', () => {
    test('should setup Solana connection correctly', () => {
        const endpoint = 'https://api.mainnet-beta.solana.com';
        const connection = setupSolanaConnection(endpoint);
        expect(connection).toBeInstanceOf(Connection);
        expect(connection.rpcEndpoint).toBe(endpoint);
    });

    test('should handle invalid endpoint gracefully', () => {
        const invalidEndpoint = 'invalid-endpoint';
        try {
            setupSolanaConnection(invalidEndpoint);
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.message).toMatch(/Invalid endpoint/); // Assuming your function throws an error for invalid endpoints
        }
    });

    test('should setup connection with different valid endpoints', () => {
        const endpoints = [
            'https://api.mainnet-beta.solana.com',
            'https://api.testnet.solana.com',
            'https://api.devnet.solana.com'
        ];

        endpoints.forEach(endpoint => {
            const connection = setupSolanaConnection(endpoint);
            expect(connection).toBeInstanceOf(Connection);
            expect(connection.rpcEndpoint).toBe(endpoint);
        });
    });

    // Additional tests for other utilities
    test('should get signature status correctly', async () => {
        // Assuming you have a function getSignatureStatus that uses the Connection object
        // Mock or provide a valid implementation for this test
    });
});
