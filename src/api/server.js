import express from 'express';
import { config } from './config/index';
import tradingRoutes from './routes/tradingRoutes';
import authRoutes from './routes/authRoutes'; // If you have auth routes
import { errorHandlingMiddleware } from './middlewares/errorHandling';

const app = express();

app.use(express.json());
app.use('/trading', tradingRoutes);
app.use('/auth', authRoutes); // If you have auth routes

// Error handling middleware should be the last middleware used
app.use(errorHandlingMiddleware);

app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});
