require('dotenv').config();
const axios = require('axios');
const { google } = require('googleapis');

/**
 * AMANI VISION OPERATIONAL CONFIGURATION
 * Optimized for 99.9% SLA & 2-Person Command (Guru + Commander)
 */
const LIST_MAP = {
    'CYBER': '901415862428',
    'NPS': '901415862429',
    'MOWDOJO': '901415862431',
    'AIKIDO': '901415862428',
    'WIFE_HUB': '901415862675' // The Amani Vision Command Center
};

/**
 * DOCUMENTATION LOOP: Requirement 1 & 7
 * Automatically archives "Lessons Learned" to Google Drive for record consistency.
 */
async function syncToAmaniDrive(client, content) {
    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/drive.file']
        });
        const drive = google.drive({ version: 'v3', auth: await auth.getClient() });
        
        await drive.files.create({
            requestBody: { 
                name: `Amani_Audit_${client}_${new Date().toISOString().split('T')[0]}.txt`, 
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] 
            },
            media: { mimeType: 'text/plain', body: content }
        });
        console.log(`[DRIVE] Documentation archived for ${client}.`);
    } catch (e) { console.error('[DRIVE_ERR]', e.message); }
}

/**
 * AGENTIC ESCALATION: Requirement 3
 * Deploys Battle Cards to the Wife Hub with "Amani Vision" talking points.
 */
async function sendUrgentEscalation(division, data) {
    console.log(`[AMANI_VISION] ESCALATION: High-Priority detection for ${division}.`);
    try {
        const talkingPoints = `
        1. GEOGRAPHIC TRUTH: We see the node on the Amani Map (Gall-Peters verified).
        2. COMPLIANCE: CMMC/RMF framework SOP ${data.sop_reference || 'AMANI-01'} is active.
        3. CLOUD HYBRID: We are monitoring across ${data.provider || 'Multi-Cloud'} nodes.
        4. GURU STATUS: Asaad is performing technical remediation now.`;

        await axios.post(`https://api.clickup.com/api/v2/list/${LIST_MAP.WIFE_HUB}/task`, {
            name: `🔴 AMANI VISION CALL PREP: ${data.client}`,
            description: `Alert Detail: ${data.detail}\n\n${talkingPoints}`,
            priority: 1
        }, { headers: { 'Authorization': process.env.CLICKUP_API_KEY, 'Content-Type': 'application/json' } });
        
        console.log('[WIFE_HUB] Battle Card Deployed.');
    } catch (e) { console.error('Wife Hub Sync Failed', e.message); }
}

/**
 * COMPLIANCE ENGINE: Requirement 6
 * Formal ServiceNow records for CMMC/RMF Audit Trails.
 */
async function triggerServiceNowRecord(type, data) {
    try {
        const auth = Buffer.from(`${process.env.SERVICENOW_USER}:${process.env.SERVICENOW_PASS}`).toString('base64');
        const table = type === 'PROBLEM' ? 'problem' : 'incident';
        await axios.post(`${process.env.SERVICENOW_URL}/api/now/table/${table}`, {
            short_description: `[AMANI-VISION] ${data.client}: ${data.detail}`,
            assignment_group: 'EDS_Operations_Center',
            priority: '1',
            work_notes: `CMMC-VALIDATED. OSINT/RMF SOP: ${data.sop_reference || 'N/A'}. Projection: Gall-Peters.`
        }, { headers: { 'Authorization': `Basic