/** @format */

import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Referral Chat Schema
const ReferralChannelSchema = new Schema(
  {
    // chat id (e.g., from a messaging bot or platform)
    chat_id: {
      type: String,
      default: "",
      required: true,
    },
    // Name of the referral channel, could be a group or channel
    channel_name: {
      type: String,
      default: "",
    },
    // Creator of the referral channel (could be the admin or user who created the channel)
    creator: {
      type: String,
      default: "",
      required: true,
    },
    // Unique referral code associated with this channel
    referral_code: {
      type: String,
      default: "",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Export the model
export default mongoose.model("referralchannel", ReferralChannelSchema);
