import winston from 'winston';
import { format } from 'logform';

// Define log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Get environment variables or set defaults
const logLevel = process.env.LOG_LEVEL || 'info';
const logFilePath = process.env.LOG_FILE_PATH || 'application.log';
const exceptionFilePath = process.env.EXCEPTION_FILE_PATH || 'exceptions.log';
const rejectionFilePath = process.env.REJECTION_FILE_PATH || 'rejections.log';

// Validate log level
if (!Object.keys(levels).includes(logLevel)) {
    console.warn(`Invalid LOG_LEVEL: ${logLevel}. Defaulting to 'info'.`);
}

// Create the logger
const logger = winston.createLogger({
    levels,
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
        // Console transport for development
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'development' ? 'debug' : logLevel,
        }),
        // File transport for production
        new winston.transports.File({
            filename: logFilePath,
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true,
        }),
        // Optional: HTTP transport
        // Uncomment and configure if needed
        // new winston.transports.Http({
        //     level: 'error',
        //     format: format.json(),
        //     host: 'logging-service.com',
        //     port: 80,
        //     // Optional: authentication headers
        //     // auth: {
        //     //     username: 'your-username',
        //     //     password: 'your-password',
        //     // },
        // }),
    ],
    exceptionHandlers: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: exceptionFilePath }),
    ],
    rejectionHandlers: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: rejectionFilePath }),
    ],
});

export default logger;
