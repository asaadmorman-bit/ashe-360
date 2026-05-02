const express = require('express');
const nexus = require('./nexus');
const app = express();

app.use(express.json());

// Using the nexus object to ensure the function is mapped
app.post('/api/task', (req, res) => nexus.handleAikidoAlert(req, res));

app.get('/', (req, res) => {
    res.send('Amani Vision Nexus: 100% Operational');
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Nexus Server live on port ${PORT}`);
    setInterval(() => nexus.checkServiceNow(), 60000);
});
