const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

// Configuration for the GCP Citadel Vault
const datasetId = 'amani_vision_logs';
const tableId = 'agent_actions';

const handleAikidoAlert = async (req, res) => {
    const payload = req.body;
    console.log("🚀 BATTLE CARD INBOUND:", payload.issue_title || "Manual Test");

    // Construct the row for the GCP Vault
    const rows = [{
        agent_name: "GCP-Sentinel",
        action_type: "sync_completed",
        summary: payload.issue_title || "Manual Sync",
        severity: (payload.severity || "critical").toLowerCase(),
        status: "completed",
        metadata: JSON.stringify(payload),
        timestamp: bigquery.timestamp(new Date())
    }];

    try {
        // Insert directly into the Citadel Vault (BigQuery)
        await bigquery.dataset(datasetId).table(tableId).insert(rows);
        console.log("✅ Nexus Data Vaulted in BigQuery");
        res.status(200).send({ status: "Success", message: "Battle Card Vaulted" });
    } catch (error) {
        console.error("❌ Vault Failure:", error);
        res.status(500).send({ status: "Error", message: "Vault Breach" });
    }
};

const checkServiceNow = async () => {
    console.log("Amani Nexus: Heartbeat Pulse Sent...");
    // Future: Add logic here to query ServiceNow API natively
};

module.exports = { checkServiceNow, handleAikidoAlert };
