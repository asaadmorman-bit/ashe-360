exports.eds360Nexus = async (req, res) => {
    const { division, payload } = req.body;
    try {
        console.log(`[NEXUS_INGEST] Routing ${division} data...`);
        if (division === 'MOWDOJO') {
            await logToMasterSheet(payload);
            await createClickUpTask(division, payload);
        } else if (division === 'CYBER' || division === 'NPS') {
            await createClickUpTask(division, payload);
        }
        res.status(200).send({ status: "SUCCESS", message: "EDS-360 Orchestration Complete" });
    } catch (error) {
        console.error(`[NEXUS_ERR]`, error.message);
        res.status(500).send({ status: "ERROR", error: error.message });
    }
};
