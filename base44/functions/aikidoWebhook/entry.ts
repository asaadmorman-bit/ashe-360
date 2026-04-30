import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Parse webhook payload
    const payload = await req.json();
    
    // Aikido webhook structure: event type, vulnerability/risk data
    if (!payload.event_type) {
      return Response.json({ error: 'Missing event_type' }, { status: 400 });
    }

    // Map Aikido events to internal processing
    const { event_type, data } = payload;

    // Log the webhook event as AgentAction for audit trail
    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'aikido_webhook',
      action_type: event_type.includes('vulnerability') ? 'scan_completed' : 'alert_triggered',
      summary: `Aikido ${event_type}: ${data?.title || data?.name || 'Security event'}`,
      status: 'completed',
      severity: data?.severity || 'medium',
      metadata: JSON.stringify(data || {}),
      related_entity: data?.resource_type || 'security_finding',
    });

    // Handle vulnerability findings
    if (event_type === 'vulnerability_discovered' && data?.cve_id) {
      await base44.asServiceRole.entities.VulnerabilityFinding.create({
        cve_id: data.cve_id,
        title: data.title || 'Aikido Vulnerability',
        severity: data.severity || 'medium',
        cvss_score: data.cvss_score || 0,
        asset_hostname: data.asset || 'Unknown',
        client_name: data.client || 'Default',
        status: 'open',
        description: data.description || '',
        discovered_at: new Date().toISOString(),
      });
    }

    // Handle risk findings
    if (event_type === 'risk_detected' && data?.risk_id) {
      await base44.asServiceRole.entities.AgentAction.create({
        agent_name: 'aikido_risk_monitor',
        action_type: 'alert_triggered',
        summary: `Aikido Risk: ${data.risk_type} - ${data.description}`,
        status: 'completed',
        severity: data.risk_level || 'medium',
        metadata: JSON.stringify({ risk_id: data.risk_id, ...data }),
        related_entity: 'security_risk',
      });
    }

    // Handle attack surface findings
    if (event_type === 'attack_surface_change' && data?.change_type) {
      await base44.asServiceRole.entities.AgentAction.create({
        agent_name: 'aikido_surface_monitor',
        action_type: 'scan_completed',
        summary: `Attack Surface Change: ${data.change_type} - ${data.asset}`,
        status: 'completed',
        severity: data.risk_level || 'low',
        metadata: JSON.stringify(data),
        related_entity: 'attack_surface',
      });
    }

    return Response.json({
      success: true,
      event: event_type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});