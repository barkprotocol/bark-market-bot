import { Keypair } from '@solana/web3.js';

describe('Keypair', () => {
    test('generate() should create a new Keypair with valid publicKey and secretKey', () => {
        const keypair = Keypair.generate();
        expect(keypair).toBeDefined();
        expect(keypair.publicKey).toBeDefined();
        expect(keypair.secretKey).toBeDefined();
        expect(keypair.secretKey.length).toBe(64); // Ensure secretKey length is correct
        expect(keypair.publicKey.toBase58()).toMatch(/^[A-Za-z0-9+/=]+$/); // Basic validation for base58 encoding
    });

    test('Keypair serialization and deserialization should match', () => {
        const keypair = Keypair.generate();
        const serialized = keypair.secretKey;
        const deserialized = Keypair.fromSecretKey(serialized);

        expect(deserialized.publicKey.toBase58()).toBe(keypair.publicKey.toBase58());
        expect(deserialized.secretKey).toEqual(keypair.secretKey);
    });

    test('Keypair should have unique publicKeys for multiple instances', () => {
        const keypair1 = Keypair.generate();
        const keypair2 = Keypair.generate();

        expect(keypair1.publicKey.toBase58()).not.toBe(keypair2.publicKey.toBase58());
    });

    test('Keypair should not have the same secretKey for multiple instances', () => {
        const keypair1 = Keypair.generate();
        const keypair2 = Keypair.generate();

        expect(keypair1.secretKey).not.toEqual(keypair2.secretKey);
    });

    test('Invalid secretKey should throw error on deserialization', () => {
        const invalidSecretKey = new Uint8Array(63); // Invalid length
        expect(() => Keypair.fromSecretKey(invalidSecretKey)).toThrow();
    });
});
