/** @format */

import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Referral Chat Schema
const ReferralHistorySchema = new Schema(
  {
    username: {
      type: String,
      required: true, // Make it required if it's crucial for the data
      default: "",
    },
    uniquecode: {
      type: String,
      required: true, // Ensure unique codes are provided
      default: "",
    },
    referrer_address: {
      type: String,
      required: true, // Validate that referrer address is always provided
      default: "",
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Amount must be positive'], // Ensures that amount is a positive number
    },
  },
  {
    timestamps: true, // This option adds createdAt and updatedAt fields
  }
);

// Add Indexes for frequently queried fields
ReferralHistorySchema.index({ username: 1, uniquecode: 1 }); // Add index on username and uniquecode if necessary

export default mongoose.model("referralhistory", ReferralHistorySchema);
