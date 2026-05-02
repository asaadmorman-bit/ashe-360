#!/bin/bash

echo "🛠️  [EDS-AUTOMATION] STARTING SYSTEM UPDATE..."
echo "------------------------------------------------"

# 1. PRE-FLIGHT CHECK: Verify Directory Structure
if [ ! -d "src/adapters/osint" ] || [ ! -d "src/adapters/outpost" ]; then
    echo "❌ ERROR: EDS Directory structure is invalid. Creating missing paths..."
    mkdir -p src/adapters/osint src/adapters/outpost
fi

# 2. UPDATE ORCHESTRATOR (The Brain)
echo "🧠 Updating Orchestrator Logic..."
cat << 'INNER_EOF' > src/EDS_Orchestrator.js
const fs = require('fs');
const ashe = require('./adapters/asheAdapter');
const izulu = require('./adapters/izuluAdapter');
const asosint = require('./adapters/osint/asosintAdapter');
const outpost = require('./adapters/outpost/outpostAdapter');

const logDecision = (data) => {
    const logEntry = `[${new Date().toISOString()}] VERDICT: ${data.verdict} | SCORE: ${data.summary}\n`;
    fs.appendFileSync('eds_audit.log', logEntry);
};

const evaluateGlobalSecurity = async (assetId, sensorPayload) => {
    try {
        const sensors = sensorPayload || { crowdDensity: 0, thermalRisk: 0 };
        const predictive = izulu.processPredictiveSignals(sensors);
        const perimeter = await outpost.getVenueTelemetry("METLIFE_STADIUM");
        const virtual = await ashe.fetch(assetId, { token: process.env.ASHE_TOKEN || 'fake_token' });
        const intel = await asosint.checkExternalThreats(assetId);

        let riskScore = virtual.risk_score || 0;
        if (predictive.status === "CRITICAL_PHYSICAL_BREACH_PREDICTION") riskScore += 40;
        if (intel.threat_level === "HIGH") riskScore += 25;

        // BEST PRACTICE: Physical Overrides Digital for Rapid Response
        const verdict = (riskScore >= 75 || predictive.status === "CRITICAL_PHYSICAL_BREACH_PREDICTION") 
            ? "IMMEDIATE_LOCKDOWN" 
            : "CONTINUE_OBSERVATION";

        const response = {
            verdict,
            summary: `EDS_CONVERGENCE_SCORE: ${riskScore}`,
            telemetry: { predictive, perimeter, virtual, intel }
        };

        logDecision(response);
        return response;
    } catch (innerError) {
        console.error(`[ORCHESTRATOR_INTERNAL_FAIL]: ${innerError.message}`);
        throw innerError;
    }
};

module.exports = { evaluateGlobalSecurity };
INNER_EOF

# 3. PERMISSION SYNC
chmod +x update-eds.sh test-lockdown.sh

echo "------------------------------------------------"
echo "✅ [EDS-AUTOMATION] UPDATE COMPLETE."
echo "🚀 Run 'node server.js' to launch the updated Flagship."
