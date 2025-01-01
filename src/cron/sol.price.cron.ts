import { NATIVE_MINT } from "@solana/spl-token";
import cron from "node-cron";
import redisClient from "../services/redis";

// Cron expression for running every 5 minutes
const EVERY_5_MIN = "*/5 * * * *";

// Run the SOL price update every 5 minutes
export const runSOLPriceUpdateSchedule = () => {
  try {
    cron
      .schedule(EVERY_5_MIN, () => {
        updateSolPrice();
      })
      .start();
  } catch (error) {
    console.error(
      `Error running the schedule job for fetching the SOL price: ${error}`
    );
  }
};

// Retrieve the API key from the environment
const BIRDEYE_API_KEY = process.env.BIRD_EYE_API || "";
const REQUEST_HEADER = {
  accept: "application/json",
  "x-chain": "solana",
  "X-API-KEY": BIRDEYE_API_KEY,
};

// Function to fetch the SOL price from the BirdEye API
const updateSolPrice = async () => {
  try {
    const solmint = NATIVE_MINT.toString();
    const key = `${solmint}_price`;

    // Fetch the SOL price from the API
    const options = { method: "GET", headers: REQUEST_HEADER };
    const response = await fetch(
      `https://public-api.birdeye.so/defi/price?address=${solmint}`,
      options
    );

    // Check for a successful response
    if (!response.ok) {
      throw new Error(`Failed to fetch SOL price: ${response.statusText}`);
    }

    // Parse the response
    const res = await response.json();

    // Handle the response and update the price in Redis
    if (res.data && res.data.value) {
      const price = res.data.value;
      await redisClient.set(key, price);
      console.log(`SOL price updated in Redis: ${price}`);
    } else {
      throw new Error("Invalid response format for SOL price");
    }
  } catch (error) {
    console.log("🚀 ~ SOL price cron job ~ Failed:", error);
  }
};
