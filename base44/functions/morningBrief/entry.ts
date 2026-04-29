import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [emails, incidents, contacts, actions] = await Promise.all([
      base44.asServiceRole.entities.EmailThread.filter({ is_read: false }, '-received_at', 10),
      base44.asServiceRole.entities.Incident.filter({}, '-created_date', 20),
      base44.asServiceRole.entities.CRMContact.list('-created_date', 10),
      base44.asServiceRole.entities.AgentAction.list('-created_date', 10),
    ]);

    const openIncidents = incidents.filter(i => ['open','investigating','mitigating'].includes(i.status));
    const criticalIncidents = openIncidents.filter(i => i.severity === 'critical' || i.severity === 'high');
    const newLeads = contacts.filter(c => c.lifecycle_stage === 'lead').length;
    const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    const briefHtml = `
<h2>🌅 ASME Morning Brief — ${today}</h2>

<h3>📧 Email Queue (${emails.length} unread)</h3>
${emails.slice(0,5).map(e => `<p>• <strong>${e.from_name || e.from_email}</strong>: ${e.subject}</p>`).join('') || '<p>No unread emails.</p>'}

<h3>🚨 Open Incidents (${openIncidents.length} total, ${criticalIncidents.length} critical/high)</h3>
${criticalIncidents.slice(0,5).map(i => `<p>• [${i.severity?.toUpperCase()}] <strong>${i.title}</strong> — ${i.affected_client || 'Internal'}</p>`).join('') || '<p>No critical/high incidents.</p>'}

<h3>📈 CRM Highlights</h3>
<p>• New leads in pipeline: <strong>${newLeads}</strong></p>
${contacts.slice(0,3).map(c => `<p>• ${c.first_name} ${c.last_name || ''} — ${c.company || 'No org'} — ${c.lifecycle_stage}</p>`).join('')}

<h3>🤖 Recent Agent Activity</h3>
${actions.slice(0,5).map(a => `<p>• [${a.agent_name}] ${a.summary}</p>`).join('') || '<p>No recent actions.</p>'}

<hr/>
<p style="color:#64748b;font-size:12px">ASME-360 · Emerging Defense Solutions · Spotsylvania, VA</p>
    `.trim();

    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'asaad@emergingdefensesolutions.com',
        subject: `☀️ Morning Brief — ${today}`,
        body: briefHtml,
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'shauntze@emergingdefensesolutions.com',
        subject: `☀️ Morning Brief — ${today}`,
        body: briefHtml,
      }),
    ]);

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'Morning Brief',
      action_type: 'report_generated',
      summary: `Morning brief sent to both executives. ${openIncidents.length} open incidents, ${emails.length} unread emails, ${newLeads} new leads.`,
      status: 'completed',
      severity: 'low',
    });

    return Response.json({ success: true, emails: emails.length, incidents: openIncidents.length, leads: newLeads });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});