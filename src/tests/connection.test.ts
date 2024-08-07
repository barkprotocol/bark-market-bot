import { Connection, PublicKey } from '@solana/web3.js';

describe('Connection', () => {
    let connection: Connection;

    beforeAll(() => {
        connection = new Connection('https://api.mainnet-beta.solana.com');
    });

    test('getAccountInfo() should return account info for a valid public key', async () => {
        const publicKey = new PublicKey('BPFLoader1111111111111111111111111111111111');
        const accountInfo = await connection.getAccountInfo(publicKey);
        expect(accountInfo).toBeDefined();
        expect(accountInfo.data).toBeDefined();
        expect(accountInfo.lamports).toBeDefined();
        expect(accountInfo.owner).toBeDefined();
    });

    test('getAccountInfo() should return null for a non-existent account', async () => {
        const publicKey = new PublicKey('1111111111111111111111111111111111111111'); // Non-existent or dummy key
        const accountInfo = await connection.getAccountInfo(publicKey);
        expect(accountInfo).toBeNull();
    });

    test('getAccountInfo() should handle an invalid public key', async () => {
        // Using an invalid public key format should throw an error
        const invalidPublicKey = 'invalidPublicKey';
        await expect(async () => {
            await connection.getAccountInfo(new PublicKey(invalidPublicKey));
        }).rejects.toThrow('Invalid public key');
    });

    // Optionally, test other methods if needed
    // test('should get balance correctly', async () => {
    //     const publicKey = new PublicKey('BPFLoader1111111111111111111111111111111111');
    //     const balance = await connection.getBalance(publicKey);
    //     expect(balance).toBeGreaterThan(0);
    // });
});
