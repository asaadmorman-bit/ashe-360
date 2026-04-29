import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, email, company, size, service, message, source } = body;

    if (!name || !email) {
      return Response.json({ error: 'name and email are required' }, { status: 400 });
    }

    // Create CRMContact record
    const contact = await base44.asServiceRole.entities.CRMContact.create({
      first_name: name.split(' ')[0] || name,
      last_name: name.split(' ').slice(1).join(' ') || '',
      email,
      company: company || '',
      lifecycle_stage: 'lead',
      lead_score: 50,
      source: source || 'EDS Website Assessment Form',
      notes: [
        service ? `Service interest: ${service}` : '',
        size ? `Org size: ${size}` : '',
        message ? `Message: ${message}` : '',
      ].filter(Boolean).join('\n'),
      last_contacted: new Date().toISOString(),
    });

    // Email both executives
    const emailBody = `
<h2>New Assessment Request — EDS Website</h2>
<table style="border-collapse:collapse;width:100%">
  <tr><td style="padding:8px;color:#64748b;width:140px">Name</td><td style="padding:8px;font-weight:600">${name}</td></tr>
  <tr><td style="padding:8px;color:#64748b">Email</td><td style="padding:8px">${email}</td></tr>
  <tr><td style="padding:8px;color:#64748b">Organization</td><td style="padding:8px">${company || '—'}</td></tr>
  <tr><td style="padding:8px;color:#64748b">Org Size</td><td style="padding:8px">${size || '—'}</td></tr>
  <tr><td style="padding:8px;color:#64748b">Service Interest</td><td style="padding:8px">${service || '—'}</td></tr>
  <tr><td style="padding:8px;color:#64748b">Message</td><td style="padding:8px">${message || '—'}</td></tr>
</table>
<p>CRM Contact created. <a href="https://cyber.eds-360.com/growth">View in ASME-360 →</a></p>
    `.trim();

    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'asaad@emergingdefensesolutions.com',
        subject: `🎯 New Assessment Request: ${name} — ${company || 'Unknown Org'}`,
        body: emailBody,
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'shauntze@emergingdefensesolutions.com',
        subject: `🎯 New Assessment Request: ${name} — ${company || 'Unknown Org'}`,
        body: emailBody,
      }),
    ]);

    // Log agent action
    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'Assessment Capture',
      action_type: 'lead_scored',
      summary: `New assessment request from ${name} (${email}) — ${company || 'no org'} — service: ${service || 'not specified'}`,
      status: 'completed',
      severity: 'low',
      related_entity: 'CRMContact',
      related_entity_id: contact.id,
    });

    return Response.json({ success: true, contact_id: contact.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});