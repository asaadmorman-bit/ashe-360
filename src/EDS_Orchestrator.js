const ashe = require('./adapters/asheAdapter');
const izulu = require('./adapters/izuluAdapter');

const evaluateGlobalSecurity = async (assetId, sensorPayload) => {
    console.log("--- STARTING GLOBAL CONVERGENCE EVALUATION ---");
    
    // 1. Get Predictive Physical Signal
    const physicalSignal = izulu.processPredictiveSignals(sensorPayload);
    
    // 2. Cross-reference with Virtual Asset Health
    const virtualHealth = await ashe.fetch(assetId, { token: process.env.ASHE_TOKEN });

    // 3. THE FLAGSHIP DECISION MATRIX
    if (physicalSignal.status === "CRITICAL_PHYSICAL_BREACH_PREDICTION" && virtualHealth.risk_score > 50) {
        return {
            verdict: "IMMEDIATE_LOCKDOWN",
            reason: "Predictive physical breach correlated with high-risk virtual telemetry.",
            trigger: "EDS_CONVERGENCE_ENGINE"
        };
    }

    return { verdict: "CONTINUE_OBSERVATION", telemetry: { physicalSignal, virtualHealth } };
};

module.exports = { evaluateGlobalSecurity };
