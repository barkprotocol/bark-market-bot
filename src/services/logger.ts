import winston from 'winston';

// Define custom log levels and colors (optional)
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey',
  },
};

// Create a logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: 'debug', // Set the minimum log level to 'debug'
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
  exitOnError: false, // Prevent the logger from exiting the application on error
});

// Add colors to the console output for better readability
winston.addColors(logLevels.colors);

// Define the Logger class
class Logger {
  static error(message: string, ...args: any[]) {
    logger.error(message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    logger.warn(message, ...args);
  }

  static info(message: string, ...args: any[]) {
    logger.info(message, ...args);
  }

  static http(message: string, ...args: any[]) {
    logger.http(message, ...args);
  }

  static verbose(message: string, ...args: any[]) {
    logger.verbose(message, ...args);
  }

  static debug(message: string, ...args: any[]) {
    logger.debug(message, ...args);
  }

  static silly(message: string, ...args: any[]) {
    logger.silly(message, ...args);
  }
}

export { Logger };
