const ashe = require('./adapters/asheAdapter');
const izulu = require('./adapters/izuluAdapter');
const asosint = require('./adapters/osint/asosintAdapter');
const outpost = require('./adapters/outpost/outpostAdapter');

const evaluateGlobalSecurity = async (assetId, sensorPayload) => {
    console.log("[GODS_EYE] Initiating multi-domain correlation...");

    const [intel, perimeter, virtual, predictive] = await Promise.all([
        asosint.checkExternalThreats(assetId),
        outpost.getVenueTelemetry("METLIFE_STADIUM"),
        ashe.fetch(assetId, { token: process.env.ASHE_TOKEN }),
        izulu.processPredictiveSignals(sensorPayload)
    ]);

    // FLAGSHIP LOGIC: Weapons + Predictive + Virtual Risk
    let riskFactor = virtual.risk_score || 0;
    if (intel.threat_level === "HIGH") riskFactor += 20;
    if (predictive.status === "CRITICAL_PHYSICAL_BREACH_PREDICTION") riskFactor += 40;

    const verdict = (riskFactor > 75) ? "IMMEDIATE_LOCKDOWN" : "CONTINUE_OBSERVATION";

    return {
        verdict,
        summary: `EDS_CONVERGENCE_SCORE: ${riskFactor}`,
        domains: { intel, perimeter, virtual, predictive }
    };
};

module.exports = { evaluateGlobalSecurity };
