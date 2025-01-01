/** @format */

import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Referral Chat Schema
const ReferrerListSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true, // Ensures chatId is always provided
      default: "",
      match: /^[0-9a-zA-Z_]+$/, // Optional: validates chatId format (alphanumeric and underscores)
    },
    messageId: {
      type: String,
      required: true, // Ensures messageId is always provided
      default: "",
      match: /^[0-9a-zA-Z_]+$/, // Optional: validates messageId format (alphanumeric and underscores)
    },
    referrer: {
      type: String,
      required: true, // Ensures referrer is always provided
      default: "",
    },
    channelName: {
      type: String,
      required: true, // Ensures channelName is always provided
      default: "",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Indexing chatId and messageId for faster lookups if frequently queried
ReferrerListSchema.index({ chatId: 1, messageId: 1 }); // Add index for these fields

export default mongoose.model("referrerList", ReferrerListSchema);
