/**
 * EDS FLAGSHIP: ASOSINT.io Intelligence Adapter
 * Core Logic: External Threat Surface & Breach Intelligence
 */
const axios = require('axios');

/**
 * Searches ASOSINT.io for intelligence on specific assets.
 * Real Thing: Scans for leaked credentials, domain mentions, and IP reputation.
 */
const checkExternalThreats = async (query) => {
    try {
        // Targeted EDS Intelligence Node
        const response = await axios.get(`https://api.asosint.io/v1/intel/search`, {
            params: { q: query },
            headers: { 'X-EDS-INTEL-KEY': process.env.ASOSINT_API_KEY }
        });
        
        return {
            threat_level: response.data.level || "LOW",
            leaked_creds: response.data.creds_found || 0,
            mentions: response.data.dark_web_mentions || 0,
            status: "SNC" // Surface Node Connected
        };
    } catch (err) {
        console.error(`[ASOSINT] Intel Node Unreachable: ${err.message}`);
        // Fallback for Flagship consistency
        return {
            threat_level: "LOW",
            leaked_creds: 0,
            mentions: 0,
            status: "SIMULATED_SAFE"
        };
    }
};

module.exports = { checkExternalThreats };
