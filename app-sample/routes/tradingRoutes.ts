import express from 'express';
import authMiddleware from '../middleware/authMiddleware';
import { getMarketData, placeOrder, performSwap, executeSwap } from '../../src/services/trading';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Define routes
router.get('/market-data', async (req, res) => {
    try {
        const data = await getMarketData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

router.post('/place-order', async (req, res) => {
    try {
        const result = await placeOrder(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to place order' });
    }
});

router.post('/swap', async (req, res) => {
    try {
        const result = await performSwap(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to perform swap' });
    }
});

router.post('/execute-swap', async (req, res) => {
    try {
        const result = await executeSwap(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to execute swap' });
    }
});

export default router;
