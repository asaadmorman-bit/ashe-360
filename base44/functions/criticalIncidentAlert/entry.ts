import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Triggered by entity automation — payload has event + data
    const incident = body.data || body;
    const { title, severity, description, affected_client, affected_systems, category } = incident;

    const systemsList = Array.isArray(affected_systems) ? affected_systems.join(', ') : (affected_systems || '—');

    const alertHtml = `
<div style="border-left:4px solid #ef4444;padding-left:16px">
<h2 style="color:#ef4444">🚨 ${severity?.toUpperCase()} INCIDENT ALERT</h2>
<table style="border-collapse:collapse;width:100%">
  <tr><td style="padding:6px;color:#64748b;width:160px">Title</td><td style="padding:6px;font-weight:700">${title}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Severity</td><td style="padding:6px;color:#ef4444;font-weight:700">${severity?.toUpperCase()}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Category</td><td style="padding:6px">${category || '—'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Affected Client</td><td style="padding:6px">${affected_client || 'Internal'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Affected Systems</td><td style="padding:6px">${systemsList}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Description</td><td style="padding:6px">${description || '—'}</td></tr>
</table>
<p><strong>Immediate action may be required.</strong> <a href="https://cyber.eds-360.com/conmon">View in ASME ConMon →</a></p>
</div>
    `.trim();

    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'asaad@emergingdefensesolutions.com',
        subject: `🚨 [${severity?.toUpperCase()}] Incident: ${title}`,
        body: alertHtml,
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'shauntze@emergingdefensesolutions.com',
        subject: `🚨 [${severity?.toUpperCase()}] Incident: ${title}`,
        body: alertHtml,
      }),
    ]);

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'ASME SOC Agent',
      action_type: 'alert_triggered',
      summary: `Critical/High incident alert sent: "${title}" — severity: ${severity} — client: ${affected_client || 'Internal'}`,
      status: 'completed',
      severity: severity || 'high',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});