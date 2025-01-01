require("dotenv").config();
import startTradeBot from "./src/main";
import connectMongodb from "./src/services/mongodb";
import redisClient from "./src/services/redis";

// Function to start the BarkBOT
const startApp = async () => {
  try {
    // Connect to MongoDB
    await connectMongodb();
    console.log('MongoDB connected');

    // Connect to Redis
    await connectRedis();
    console.log('Redis connected');

    // Start the BarkBOT
    startTradeBot();
  } catch (error) {
    console.error("Connection failed", error);
    process.exit(1); // Exit process if connection fails
  }
};

// Function to connect to Redis
const connectRedis = async () => {
  return new Promise<void>((resolve, reject) => {
    redisClient.on('connect', () => {
      console.log('Redis database connected');
      resolve();
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting');
    });

    redisClient.on('ready', () => {
      console.log('Redis client is ready');
    });

    redisClient.on('error', (err) => {
      console.log('Redis client error:', err);
      reject(err); // Reject if an error occurs
    });

    redisClient.on('end', () => {
      console.log('\nRedis client disconnected');
      console.log('Server is going down now...');
      process.exit();
    });

    redisClient.connect().catch(reject); // Ensure to catch any connection errors
  });
};

// Start the application
startApp();
