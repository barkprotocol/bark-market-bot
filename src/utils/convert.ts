import Decimal from 'decimal.js';

/**
 * Converts a readable number of tokens to the smallest unit (e.g., lamports for SOL).
 * This function can be used for any token by specifying its number of decimal places.
 * @param {number} value - The amount in readable units.
 * @param {number} decimals - The number of decimals the token uses. Must be a non-negative integer.
 * @returns {Decimal} - The amount in the smallest unit.
 * @throws {Error} - Throws an error if decimals is not a non-negative integer or value is invalid.
 */
export function fromNumberToSmallestUnit(value: number, decimals: number): Decimal {
    validateDecimals(decimals);
    
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Invalid value provided. Must be a valid number. Received: ${value}`);
    }

    if (value < 0) {
        throw new Error(`Value cannot be negative. Received: ${value}`);
    }

    return new Decimal(value).mul(new Decimal(10).pow(decimals));
}

/**
 * Converts the smallest unit of tokens (e.g., lamports for SOL) to a readable number.
 * This function can be used for any token by specifying its number of decimal places.
 * @param {Decimal | number} value - The amount in the smallest unit. Can be a Decimal or number.
 * @param {number} decimals - The number of decimals the token uses. Must be a non-negative integer.
 * @returns {Decimal} - The readable amount.
 * @throws {Error} - Throws an error if decimals is not a non-negative integer or value cannot be converted to Decimal.
 */
export function fromSmallestUnitToNumber(value: Decimal | number, decimals: number): Decimal {
    validateDecimals(decimals);

    const decimalValue = value instanceof Decimal ? value : new Decimal(value);

    if (!Decimal.isDecimal(decimalValue)) {
        throw new Error(`Value cannot be converted to Decimal. Received: ${value}`);
    }

    if (decimalValue.lessThan(0)) {
        throw new Error(`Value cannot be negative. Received: ${decimalValue.toString()}`);
    }

    return decimalValue.div(new Decimal(10).pow(decimals));
}

/**
 * Validates that the number of decimals is a non-negative integer.
 * @param {number} decimals - The number of decimals to validate.
 * @throws {Error} - Throws an error if decimals is not a non-negative integer.
 */
function validateDecimals(decimals: number): void {
    if (!Number.isInteger(decimals) || decimals < 0) {
        throw new Error(`Decimals must be a non-negative integer. Received: ${decimals}`);
    }
}

// Example Usage
if (require.main === module) {
    try {
        const readableAmount = 1.2345;
        const decimals = 9;
        const smallestUnit = fromNumberToSmallestUnit(readableAmount, decimals);
        console.log(`Readable amount ${readableAmount} converted to smallest unit: ${smallestUnit.toString()}`);
        
        const convertedBack = fromSmallestUnitToNumber(smallestUnit, decimals);
        console.log(`Smallest unit ${smallestUnit.toString()} converted back to readable amount: ${convertedBack.toString()}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}
