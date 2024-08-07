import fs from 'fs';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import * as bip39 from 'bip39';
import * as nacl from 'tweetnacl';
import { homedir } from 'os';
import * as path from 'path';

const USER_HOME = homedir();
const USER_KEYPAIR_PATH = path.join(USER_HOME, '.config/solana/id.json');

/**
 * Load keypair from a JSON file.
 * @param {string} filePath - Path to the keypair JSON file.
 * @returns {Keypair} - Loaded Keypair.
 * @throws {Error} - Throws an error if the file content is invalid.
 */
function loadKeypairFromFile(filePath: string): Keypair {
    try {
        const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
        const secretKeyArray = JSON.parse(fileContent);

        // Validate the secret key array
        if (!Array.isArray(secretKeyArray) || secretKeyArray.length !== 64) {
            throw new Error('Invalid secret key array length. Expected 64 bytes.');
        }

        return Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    } catch (error) {
        console.error(`Error loading keypair from ${filePath}: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Derive keypair from a seed and derivation path.
 * @param {Buffer} seed - Seed buffer.
 * @param {string} derivationPath - Derivation path.
 * @returns {Keypair} - Derived Keypair.
 * @throws {Error} - Throws an error if derivation fails.
 */
function deriveKeypairFromSeed(seed: Buffer, derivationPath: string): Keypair {
    try {
        const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
        const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);
        return Keypair.fromSecretKey(new Uint8Array(keypair.secretKey));
    } catch (error) {
        console.error(`Error deriving keypair from seed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Load keypair from a mnemonic phrase.
 * @param {string} mnemonic - Mnemonic phrase.
 * @param {string} [derivationPath] - Derivation path (default: "m/44'/501'/0'/0'").
 * @returns {Keypair} - Loaded Keypair.
 * @throws {Error} - Throws an error if the mnemonic is invalid.
 */
function loadKeypairFromMnemonic(mnemonic: string, derivationPath: string = "m/44'/501'/0'/0'"): Keypair {
    try {
        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic phrase.');
        }
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        return deriveKeypairFromSeed(seed, derivationPath);
    } catch (error) {
        console.error(`Error loading keypair from mnemonic: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Get user keypair, optionally using a derivation path.
 * @param {string} [derivationPath] - Derivation path.
 * @returns {Keypair} - User Keypair.
 */
export function getUserKeypair(derivationPath?: string): Keypair {
    const keypair = loadKeypairFromFile(USER_KEYPAIR_PATH);
    if (derivationPath) {
        const seed = keypair.secretKey.slice(0, 32); // Assume the seed is the first 32 bytes of the secret key
        return deriveKeypairFromSeed(Buffer.from(seed), derivationPath);
    }
    return keypair;
}

/**
 * Main function to load keypair based on environment variables and file existence.
 * @returns {Keypair} - Loaded Keypair.
 * @throws {Error} - Throws an error if neither method is available.
 */
export function loadKeypair(): Keypair {
    if (process.env.SOLANA_MNEMONIC) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug('Mnemonic loaded from environment variable.');
        }
        return loadKeypairFromMnemonic(process.env.SOLANA_MNEMONIC);
    } else if (fs.existsSync(USER_KEYPAIR_PATH)) {
        return getUserKeypair();
    } else {
        console.error('Error: Private key file or mnemonic not found.');
        console.error(`Please set SOLANA_MNEMONIC environment variable or create a private key file at ${USER_KEYPAIR_PATH}`);
        process.exit(1);
    }
}
