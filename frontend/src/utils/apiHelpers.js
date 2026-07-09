/**
 * Utility functions for API responses
 */

/**
 * Helper: DRF paginated endpoints return { count, results }.
 * This extracts the array from paginated or plain responses.
 * @param {Object|Array} data - The response data from the API
 * @returns {Array} The extracted array of results
 */
export const extractResults = (data) => {
    if (data && Array.isArray(data.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
};
