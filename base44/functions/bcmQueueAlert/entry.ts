import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const item = body.data || body;
    const { title, description, priority, client_name, assigned_to, due_date, category } = item;

    const needsExecAlert = ['medium','high','critical'].includes(priority);

    if (needsExecAlert) {
      const alertHtml = `
<h2>📋 BCM Queue Item Requires Approval — Priority: ${priority?.toUpperCase()}</h2>
<table style="border-collapse:collapse;width:100%">
  <tr><td style="padding:6px;color:#64748b;width:140px">Task</td><td style="padding:6px;font-weight:700">${title}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Priority</td><td style="padding:6px;font-weight:700;color:${priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f97316' : '#eab308'}">${priority?.toUpperCase()}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Category</td><td style="padding:6px">${category || '—'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Client</td><td style="padding:6px">${client_name || '—'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Assigned To</td><td style="padding:6px">${assigned_to || 'BCA Agent'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Due Date</td><td style="padding:6px">${due_date || '—'}</td></tr>
  <tr><td style="padding:6px;color:#64748b">Description</td><td style="padding:6px">${description || '—'}</td></tr>
</table>
<p><strong>This item requires executive approval before execution.</strong> Reply to authorize or defer.</p>
<p><a href="https://cyber.eds-360.com/conmon">View BCM Queue in ASME →</a></p>
      `.trim();

      await Promise.all([
        base44.asServiceRole.integrations.Core.SendEmail({
          to: 'asaad@emergingdefensesolutions.com',
          subject: `📋 BCM Approval Required [${priority?.toUpperCase()}]: ${title}`,
          body: alertHtml,
        }),
        base44.asServiceRole.integrations.Core.SendEmail({
          to: 'shauntze@emergingdefensesolutions.com',
          subject: `📋 BCM Approval Required [${priority?.toUpperCase()}]: ${title}`,
          body: alertHtml,
        }),
      ]);
    }

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'BCA Agent',
      action_type: 'task_updated',
      summary: `BCM queue item created: "${title}" — priority: ${priority} — ${needsExecAlert ? 'executives notified, awaiting approval' : 'auto-executing (low priority)'}`,
      status: needsExecAlert ? 'pending' : 'in_progress',
      severity: priority || 'low',
    });

    return Response.json({ success: true, exec_notified: needsExecAlert });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});