import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [incidents, tickets, stigs, vulns, assets, actions] = await Promise.all([
      base44.asServiceRole.entities.Incident.list('-created_date', 100),
      base44.asServiceRole.entities.ServiceTicket.list('-created_date', 100),
      base44.asServiceRole.entities.STIGFinding.filter({ status: 'open' }, '-created_date', 100),
      base44.asServiceRole.entities.VulnerabilityFinding.filter({ status: 'open' }, '-created_date', 100),
      base44.asServiceRole.entities.ScannedAsset.list('-created_date', 100),
      base44.asServiceRole.entities.AgentAction.list('-created_date', 50),
    ]);

    const week = new Date(); week.setDate(week.getDate() - 7);
    const newIncidents = incidents.filter(i => i.created_date && new Date(i.created_date) > week);
    const criticalVulns = vulns.filter(v => v.severity === 'critical');
    const kevVulns = vulns.filter(v => v.is_kev);
    const avgCompliance = assets.length ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length) : 0;
    const openTickets = tickets.filter(t => !['resolved','closed'].includes(t.status));

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const reportHtml = `
<h2>📊 Weekly Security Posture Report — ${today}</h2>

<h3>🚨 Incident Summary</h3>
<p>Total open incidents: <strong>${incidents.filter(i => !['resolved','closed'].includes(i.status)).length}</strong></p>
<p>New this week: <strong>${newIncidents.length}</strong></p>
<p>Critical/High open: <strong>${incidents.filter(i => ['critical','high'].includes(i.severity) && !['resolved','closed'].includes(i.status)).length}</strong></p>

<h3>🔒 Vulnerability & STIG Status</h3>
<p>Open vulnerabilities: <strong>${vulns.length}</strong> (${criticalVulns.length} critical, ${kevVulns.length} in KEV catalog)</p>
<p>Open STIG findings: <strong>${stigs.length}</strong> (CAT I: ${stigs.filter(s => s.severity === 'CAT_I').length}, CAT II: ${stigs.filter(s => s.severity === 'CAT_II').length})</p>

<h3>📋 Ticket Queue</h3>
<p>Open tickets: <strong>${openTickets.length}</strong></p>
<p>Urgent/High: <strong>${openTickets.filter(t => ['urgent','high'].includes(t.priority)).length}</strong></p>

<h3>🖥️ Asset Compliance</h3>
<p>Total monitored assets: <strong>${assets.length}</strong></p>
<p>Average compliance score: <strong>${avgCompliance}%</strong></p>
<p>Assets below 70%: <strong>${assets.filter(a => (a.compliance_score || 0) < 70).length}</strong></p>

<h3>🤖 Agent Activity (past 7 days)</h3>
${actions.filter(a => a.created_date && new Date(a.created_date) > week).slice(0,10).map(a => `<p>• [${a.agent_name}] ${a.summary}</p>`).join('') || '<p>No actions logged.</p>'}

<hr/>
<p style="color:#64748b;font-size:12px">ASME-360 Weekly Report · Emerging Defense Solutions · Spotsylvania, VA · <a href="https://cyber.eds-360.com/dashboard">View Dashboard →</a></p>
    `.trim();

    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'asaad@emergingdefensesolutions.com',
        subject: `📊 Weekly Security Posture Report — ${today}`,
        body: reportHtml,
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'shauntze@emergingdefensesolutions.com',
        subject: `📊 Weekly Security Posture Report — ${today}`,
        body: reportHtml,
      }),
    ]);

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'Weekly Report',
      action_type: 'report_generated',
      summary: `Weekly security posture report delivered. ${vulns.length} open vulns, ${stigs.length} open STIGs, avg compliance ${avgCompliance}%.`,
      status: 'completed',
      severity: 'low',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});