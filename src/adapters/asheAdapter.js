const axios = require('axios');

/**
 * THE HYBRID ADAPTER
 * Switches between 'Simulation' for Base44 and 'Production' for Private Cloud.
 */
const getAsheTelemetry = async (assetId, credentials) => {
    // PRODUCTION PATH: Only active when USE_REAL_API is true
    const response = await axios.get(`${credentials.base}/assets/${assetId}`, {
        headers: { 'Authorization': `Bearer ${credentials.token}` }
    });
    return response.data;
};

const mockAsheTelemetry = async (assetId) => {
    // COMPLIANCE PATH: Active by default in restricted environments
    return {
        hostname: `SENTINEL-NODE-${assetId.substring(0,4)}`,
        status: "SECURE_OBSERVATION",
        risk_score: Math.floor(Math.random() * 30) + 10,
        last_seen: new Date().toISOString(),
        environment: "B44_COMPLIANCE_MODE"
    };
};

module.exports = { 
    fetch: process.env.USE_REAL_API === 'true' ? getAsheTelemetry : mockAsheTelemetry 
};
