// Define a type for Solana token details
export interface Token {
    address: string;     // Token's mint address
    symbol: string;      // Token's symbol (e.g., "SOL", "USDC")
    decimals: number;    // Number of decimal places for the token
}

// Define a type for a trade pair
export interface TradePair {
    token0: Token;       // First token in the trade pair
    token1: Token;       // Second token in the trade pair
}

// Define a type for the quote returned by the Jupiter client
export interface Quote {
    inAmount: string;    // Amount of the input token (in smallest unit) for the swap
    outAmount: string;   // Amount of the output token (in smallest unit) received from the swap
    route?: string;      // Route details for the swap (optional)
    slippage?: string;   // The slippage used for the quote (optional)
    fee?: string;        // The fee associated with the quote (optional)
}
