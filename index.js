const nexus = require('./nexus');

/**
 * GCP Cloud Function Entry Point
 * This bridges the GCP Integration signal to your Nexus logic.
 */
exports.nexusOrchestrator = async (req, res) => {
  // 1. Citadel Health Check (Triggered via GET)
  if (req.method === 'GET') {
    return res.status(200).send('Amani Vision Nexus: 100% Operational (GCP Native)');
  }

<<<<<<< HEAD
  // Handle Logic (Replacing app.post('/api/task'))
  try {
    // We pass the raw data from Application Integration directly to nexus
    await nexus.handleAikidoAlert(req, res);
  } catch (error) {
    console.error('Nexus Citadel Breach:', error);
    res.status(500).send('Internal Nexus Failure');
  }
};
=======
  // 2. Process Battle Card (Triggered via POST from Task 7)
  try {
    // Pass the payload directly to the nexus.handleAikidoAlert logic
    await nexus.handleAikidoAlert(req, res);
  } catch (error) {
    console.error('Nexus Citadel Breach Error:', error);
    // Ensure we send a response so the Integration doesn't hang
    res.status(500).send({ status: "Error", message: "Internal Nexus Failure" });
  }
};
>>>>>>> 09400fc (ASME SOC: Updated side-menu and nexus logic)
