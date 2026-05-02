const express = require('express');
const bodyParser = require('body-parser');
const nexus = require('./nexus'); // This pulls in your Nexus logic
const { evaluateGlobalSecurity } = require('./src/EDS_Orchestrator');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

// 1. THE NEXUS ROUTE (Multi-Division Orchestration)
// This handles NPS, Defense, and MowDojo cross-talk
app.post('/api/nexus', nexus.eds360Nexus);

// 2. THE CONVERGENCE ROUTE (Cyber Intelligence)
// This handles the original Flagship/Ashe Sentinel logic
app.post('/api/v1/convergence/evaluate', async (req, res) => {
    try {
        const { assetId, sensorPayload } = req.body;
        const result = await evaluateGlobalSecurity(assetId, sensorPayload);
        res.status(200).json({ status: "SUCCESS", ...result });
    } catch (error) {
        res.status(500).json({ status: "ERROR", message: "Convergence Engine Offline" });
    }
});

app.get('/', (req, res) => {
    res.send('EDS-360 Corporate Command Active.');
});

app.listen(PORT, () => {
    console.log(`[EDS-360] Master Command active on port ${PORT}`);
});
