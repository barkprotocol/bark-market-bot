import { Router, Request, Response, NextFunction } from 'express';
import { getTradingHistory } from '../../src/services/trading';

const router = Router();

/**
 * Route to fetch trading history for a user.
 * @param req - The request object containing query parameters for user ID or other filters.
 * @param res - The response object to send back the trading history.
 * @param next - The next middleware function to call in case of errors.
 */
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract query parameters, e.g., userId, dateRange, etc.
        const userId = req.query.userId as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        // Validate query parameters if necessary
        if (!userId) {
            return res.status(400).json({ status: 400, message: 'User ID is required' });
        }

        // Fetch trading history from the service
        const history = await getTradingHistory(userId, startDate, endDate);

        // Send the trading history as a JSON response
        res.status(200).json({
            status: 200,
            data: history
        });
    } catch (error) {
        // Pass errors to the error handling middleware
        next(error);
    }
});

export default router;
