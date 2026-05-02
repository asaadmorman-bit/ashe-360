const fs = require('fs');
const ashe = require('./adapters/asheAdapter');
const izulu = require('./adapters/izuluAdapter');
const asosint = require('./adapters/osint/asosintAdapter');
const conflict = require('./adapters/osint/global/conflictAdapter');
const outpost = require('./adapters/outpost/outpostAdapter');

const logDecision = (data) => {
    const logEntry = `[${new Date().toISOString()}] 460_VERDICT: ${data.verdict} | ACTIVE_DEFENSE: ${!!data.remediationStatus}\n`;
    fs.appendFileSync('eds_460.log', logEntry);
};

const evaluateGlobalSecurity = async (assetId, sensorPayload, clientIp = "10.0.0.99") => {
    try {
        const [predictive, perimeter, virtual, intel, globalRisks] = await Promise.all([
            izulu.processPredictiveSignals(sensorPayload),
            outpost.getVenueTelemetry("METLIFE_STADIUM"),
            ashe.fetch(assetId),
            asosint.checkExternalThreats(assetId),
            conflict.getGlobalFlashpoints()
        ]);

        let riskScore = virtual.risk_score || 0;
        
        // GEO-SENSITIVITY: If a global conflict is CRITICAL, increase local vigilance
        if (globalRisks.some(r => r.risk === "CRITICAL")) riskScore += 25;

        // PHYSICAL OVERRIDE: Physical breach + Global unrest = MANDATORY LOCKDOWN
        const isCriticalPhysical = predictive.status === "CRITICAL_PHYSICAL_BREACH_PREDICTION";
        const verdict = (riskScore >= 75 || isCriticalPhysical) ? "IMMEDIATE_LOCKDOWN" : "CONTINUE_OBSERVATION";

        // ACTIVE NEUTRALIZATION
        let remediationStatus = null;
        if (verdict === "IMMEDIATE_LOCKDOWN") {
            remediationStatus = await ashe.updateNodePolicy(clientIp);
        }

        const response = {
            verdict,
            remediationStatus,
            globalContext: globalRisks,
            summary: `EDS_460_SCORE: ${riskScore}`,
            telemetry: { predictive, perimeter, virtual, intel }
        };

        logDecision(response);
        return response;
    } catch (err) {
        console.error(`[460_ORCHESTRATOR_FAIL]: ${err.message}`);
        throw err;
    }
};

module.exports = { evaluateGlobalSecurity };
