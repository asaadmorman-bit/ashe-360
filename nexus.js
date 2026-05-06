const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

exports.getDashboardData = async (req, res) => {
    // Enable CORS so your website can talk to this API
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    const query = `
        SELECT timestamp, summary, severity, status 
        FROM \`b44-soc-automation.amani_vision_logs.agent_actions\` 
        ORDER BY timestamp DESC 
        LIMIT 10`;

    try {
        const [rows] = await bigquery.query(query);
        console.log(`Successfully retrieved ${rows.length} records from the Vault.`);
        res.status(200).send(rows);
    } catch (error) {
        console.error("❌ Vault Read Error:", error);
        res.status(500).send({ error: "Failed to retrieve intelligence data." });
    }
};
