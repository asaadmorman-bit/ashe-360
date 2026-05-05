const nexus = require('./nexus');

/**
 * GCP Entry Point: nexusOrchestrator
 * This replaces your app.post('/api/task')
 */
exports.nexusOrchestrator = async (req, res) => {
  // Handle Health Checks (Replacing app.get('/'))
  if (req.method === 'GET') {
    return res.status(200).send('Amani Vision Nexus: 100% Operational (GCP Native)');
  }

  // Handle Logic (Replacing app.post('/api/task'))
  try {
    // We pass the raw data from Application Integration directly to nexus
    await nexus.handleAikidoAlert(req, res);
  } catch (error) {
    console.error('Nexus Citadel Breach:', error);
    res.status(500).send('Internal Nexus Failure');
  }
};
