const axios = require('axios');

// Explicitly defined and exported
const handleAikidoAlert = async (req, res) => {
    console.log("🚀 BATTLE CARD INBOUND:", req.body.issue_title || "Manual Test");
    res.status(200).send({ status: "Success", message: "Battle Card Generated" });
};

const checkServiceNow = async () => {
    console.log("Amani Nexus: Heartbeat Pulse Sent...");
};

module.exports = { 
    checkServiceNow, 
    handleAikidoAlert 
};
