/** @format */

import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Define the AmmPoolKeys schema
const AmmPoolKeysSchema = new Schema(
  {
    id: { type: String, default: "" },
    baseMint: { type: String, default: "" },
    quoteMint: { type: String, default: "" },
    lpMint: { type: String, default: "" },
    baseDecimals: { type: Number, default: 0 },
    quoteDecimals: { type: Number, default: 0 },
    lpDecimals: { type: Number, default: 0 },
    version: { type: Number, default: 0 },
    programId: { type: String, default: "" },
    authority: { type: String, default: "" },
    openOrders: { type: String, default: "" },
    targetOrders: { type: String, default: "" },
    baseVault: { type: String, default: "" },
    quoteVault: { type: String, default: "" },
    withdrawQueue: { type: String, default: "" },
    lpVault: { type: String, default: "" },
    marketVersion: { type: Number, default: 0 },
    marketProgramId: { type: String, default: "" },
    marketId: { type: String, default: "" },
    marketAuthority: { type: String, default: "" },
    marketBaseVault: { type: String, default: "" },
    marketQuoteVault: { type: String, default: "" },
    marketBids: { type: String, default: "" },
    marketAsks: { type: String, default: "" },
    marketEventQueue: { type: String, default: "" },
    lookupTableAccount: { type: String, default: "" },
  },
  { _id: false } // No _id for this subdocument
);

// Define the ApiClmmConfigItem schema
const ApiClmmConfigItemSchema = new Schema(
  {
    id: { type: String, default: "" },
    index: { type: Number, default: 0 },
    protocolFeeRate: { type: Number, default: 0 },
    tradeFeeRate: { type: Number, default: 0 },
    tickSpacing: { type: Number, default: 0 },
    fundFeeRate: { type: Number, default: 0 },
    fundOwner: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// Define the ApiClmmPoolsItemStatistic schema
const ApiClmmPoolsItemStatisticSchema = new Schema(
  {
    volume: { type: Number, default: 0 },
    volumeFee: { type: Number, default: 0 },
    feeA: { type: Number, default: 0 },
    feeB: { type: Number, default: 0 },
    feeApr: { type: Number, default: 0 },
    rewardApr: {
      A: { type: Number, default: 0 },
      B: { type: Number, default: 0 },
      C: { type: Number, default: 0 },
    },
    apr: { type: Number, default: 0 },
    priceMin: { type: Number, default: 0 },
    priceMax: { type: Number, default: 0 },
  },
  { _id: false }
);

// Define the RewardInfo schema
const RewardInfoSchema = new Schema(
  {
    mint: { type: String, default: "" },
    programId: { type: String, default: "" },
  },
  { _id: false }
);

// Define the CLMM Pool Keys schema
const clmmPoolKeys = new Schema(
  {
    id: { type: String, default: "" },
    mintProgramIdA: { type: String, default: "" },
    mintProgramIdB: { type: String, default: "" },
    mintA: { type: String, default: "" },
    mintB: { type: String, default: "" },
    vaultA: { type: String, default: "" },
    vaultB: { type: String, default: "" },
    mintDecimalsA: { type: Number, default: 0 },
    mintDecimalsB: { type: Number, default: 0 },
    ammConfig: { type: ApiClmmConfigItemSchema },
    rewardInfos: { type: [RewardInfoSchema], default: [] },
    tvl: { type: Number, default: 0 },
    day: { type: ApiClmmPoolsItemStatisticSchema },
    week: { type: ApiClmmPoolsItemStatisticSchema },
    month: { type: ApiClmmPoolsItemStatisticSchema },
    lookupTableAccount: { type: String, default: "" },
  },
  { _id: false } // No _id for this subdocument
);

// Define the Token schema
const Token = new Schema(
  {
    name: { type: String, default: "" },
    symbol: { type: String, default: "" },
    mint: { type: String, required: true },
    isAmm: { type: Boolean, default: false, required: true },
    poolId: { type: String, required: true, unique: true },
    creation_ts: { type: Number, required: true },
    ammKeys: { type: AmmPoolKeysSchema },
    clmmKeys: { type: clmmPoolKeys },
  },
  {
    timestamps: true, // Created and updated timestamps
  }
);

// Indexing common fields for performance
Token.index({ mint: 1 });
Token.index({ poolId: 1 });

// Create and export the model
export default mongoose.model("Token", Token);
