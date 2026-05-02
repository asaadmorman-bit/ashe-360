const express = require('express');
const orchestrator = require('./src/EDS_Orchestrator');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

/**
 * THE GLOBAL CONVERGENCE ENDPOINT
 * This is the "Master Switch" for the EDS Flagship.
 * It ingests data from iZulu and Ashe to return a single verdict.
 */
app.post('/api/v1/convergence/evaluate', async (req, res) => {
    try {
        const { assetId, sensorPayload } = req.body;
        
        // Ensure we have the minimum data for iZulu's predictive logic
        const payload = sensorPayload || { crowdDensity: 0.1, thermalRisk: 0.1 };
        
        // Execute the "God's Eye" Intelligence
        const decision = await orchestrator.evaluateGlobalSecurity(assetId, payload);

        res.status(200).json({
            status: "SUCCESS",
            timestamp: new Date().toISOString(),
            verdict: decision.verdict,
            intelligence: decision.reason || "System Nominal",
            telemetry: decision.telemetry || null
        });
    } catch (err) {
        console.error(`[ERROR] Flagship Engine Failure: ${err.message}`);
        res.status(500).json({ status: "ERROR", message: "Convergence Engine Offline" });
    }
});

app.listen(PORT, () => {
    console.log(`[EDS-FLAGSHIP] God's Eye Orchestrator active on port ${PORT}`);
});
