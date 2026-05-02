const express = require('express');
const ashe = require('./src/adapters/asheAdapter');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Sanctioned Telemetry Endpoint
app.get('/execute/asset-health/:id', async (req, res) => {
    try {
        // The adapter handles whether this is "Real" or "Mock" 
        // based on your environment variables.
        const data = await ashe.fetch(req.params.id, {
            base: process.env.ASHE_API_BASE,
            token: "INTERNAL_AUTH_ONLY" 
        });

        res.status(200).json({
            status: "SUCCESS",
            source: process.env.USE_REAL_API === 'true' ? "ASHE_EDR_PROD" : "SIMULATION_ENGINE",
            payload: data
        });
    } catch (err) {
        res.status(500).json({ status: "ERROR", message: err.message });
    }
});

app.listen(PORT, () => console.log(`[PROD_READY] Sentinel Framework live on ${PORT}`));
