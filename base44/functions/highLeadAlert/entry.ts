import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const contact = body.data || body;
    const { first_name, last_name, email, company, lead_score, deal_value, source, lifecycle_stage } = contact;

    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    const alertHtml = `
<h2>🎯 High-Value Lead — Score ${lead_score}</h2>
<table style="border-collapse:collapse;width:100%">
  <tr><td style="padding:6px;color:#64748b;width:140px">Name</td><td style="padding:6px;font-weight:700">${fullName}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Email</td><td style="padding:6px">${email}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Company</td><td style="padding:6px">${company || '—'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Lead Score</td><td style="padding:6px;color:#22c55e;font-weight:700">${lead_score}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Deal Value</td><td style="padding:6px">${deal_value ? `$${deal_value.toLocaleString()}` : '—'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Source</td><td style="padding:6px">${source || '—'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Stage</td><td style="padding:6px">${lifecycle_stage || '—'}</td></tr>
</table>
<p><a href="https://cyber.eds-360.com/growth">View in ASME Growth →</a></p>
    `.trim();

    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'asaad@emergingdefensesolutions.com',
        subject: `🎯 High-Value Lead: ${fullName} — Score ${lead_score}`,
        body: alertHtml,
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'shauntze@emergingdefensesolutions.com',
        subject: `🎯 High-Value Lead: ${fullName} — Score ${lead_score}`,
        body: alertHtml,
      }),
    ]);

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'Growth CRM Agent',
      action_type: 'lead_scored',
      summary: `High-value lead alert: ${fullName} (${email}) — score: ${lead_score} — company: ${company || 'N/A'}`,
      status: 'completed',
      severity: lead_score >= 90 ? 'high' : 'medium',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});