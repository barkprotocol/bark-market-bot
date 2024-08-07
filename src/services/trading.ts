import { Database } from '../../app-sample/database';

/**
 * Retrieves trading history from the database.
 * @param userId - The ID of the user whose trading history is being fetched.
 * @param startDate - Optional start date for the history range.
 * @param endDate - Optional end date for the history range.
 * @returns A promise that resolves to the trading history.
 */
export async function getTradingHistory(userId: string, startDate?: string, endDate?: string) {
    try {
        // Construct query parameters
        const query: any = { userId };
        if (startDate) query.date = { $gte: new Date(startDate) };
        if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

        // Fetch data from the database
        const history = await Database.getTradingHistory(query);
        return history;
    } catch (error) {
        console.error('Failed to fetch trading history:', error);
        throw new Error('Unable to fetch trading history');
    }
}
