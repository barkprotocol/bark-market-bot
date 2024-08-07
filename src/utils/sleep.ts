/**
 * Pauses execution for a given number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} - A promise that resolves after the specified time has elapsed.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
