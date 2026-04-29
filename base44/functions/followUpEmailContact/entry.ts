import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contact_id, contact_email, contact_name, company, lead_score, last_contacted } = await req.json();

    if (!contact_email) {
      return Response.json({ error: 'Contact email required' }, { status: 400 });
    }

    // Determine email content based on contact status
    let subject = '';
    let body = '';

    const now = new Date();
    const daysSinceContact = last_contacted 
      ? Math.floor((now - new Date(last_contacted)) / (1000 * 60 * 60 * 24))
      : 999;

    if (lead_score >= 80) {
      subject = `${contact_name}, let's discuss your next steps`;
      body = `Hi ${contact_name || 'there'},<br><br>We've identified significant opportunity potential with ${company || 'your organization'}. Your engagement level indicates strong fit with our platform.<br><br>Let's schedule a brief call to explore how we can drive your security and compliance goals.<br><br>Best regards,<br>Emerging Defense Solutions Team`;
    } else if (lead_score >= 60) {
      subject = `Quick follow-up: ${company || 'Your'} Security Posture`;
      body = `Hi ${contact_name || 'there'},<br><br>Following up on our previous conversations. We'd love to show you how ${company || 'organizations like yours'} are improving their security posture with our SOCaaS platform.<br><br>Available for a brief chat this week?<br><br>Best regards,<br>Emerging Defense Solutions Team`;
    } else if (daysSinceContact > 7) {
      subject = `Check-in: How can we help with your cybersecurity goals?`;
      body = `Hi ${contact_name || 'there'},<br><br>It's been a while since we last connected. We wanted to reach out and see how ${company || 'your organization'} is progressing with your security initiatives.<br><br>Would love to reconnect and discuss any upcoming priorities.<br><br>Best regards,<br>Emerging Defense Solutions Team`;
    } else {
      // Don't send if conditions aren't met
      return Response.json({ skipped: true, reason: 'Contact does not meet follow-up criteria' });
    }

    // Send email via Core integration
    await base44.integrations.Core.SendEmail({
      to: contact_email,
      subject,
      body,
      from_name: 'Emerging Defense Solutions',
    });

    // Log the action
    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'crm_follow_up',
      action_type: 'email_sent',
      summary: `Follow-up email sent to ${contact_name} (${contact_email}) - Score: ${lead_score}`,
      status: 'completed',
      severity: 'low',
      related_entity: 'CRMContact',
      related_entity_id: contact_id,
    });

    return Response.json({ sent: true, to: contact_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});