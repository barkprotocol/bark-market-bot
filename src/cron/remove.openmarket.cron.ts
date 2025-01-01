import { NATIVE_MINT } from "@solana/spl-token";
import cron from "node-cron";
import redisClient from "../services/redis";
import { OpenMarketSchema } from "../models";

// Cron expression for every minute
const EVERY_1_MIN = "*/1 * * * *";

// Start the cron job to remove old data every minute
export const runOpenmarketCronSchedule = () => {
  try {
    cron
      .schedule(EVERY_1_MIN, () => {
        removeOldDatas();
      })
      .start();
  } catch (error) {
    console.error(
      `Error running the Schedule Job for removing old data: ${error}`
    );
  }
};

// Function to remove old data from the OpenMarket collection
const removeOldDatas = async () => {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    const result = await OpenMarketSchema.deleteMany({
      createdAt: { $lt: threeHoursAgo },
    });

    // Log the number of documents deleted
    console.log(`Deleted ${result.deletedCount} old documents from OpenMarket.`);
  } catch (error) {
    console.error("Error deleting old documents from OpenMarket:", error);
  }
};
