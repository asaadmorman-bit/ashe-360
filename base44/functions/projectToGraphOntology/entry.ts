/**
 * Graph Projection Handler
 * 
 * Takes fired alerts from streamDetectionEngine and projects them into a graph ontology.
 * Creates:
 * - Alert nodes (AgentAction entity)
 * - Edges: Principal User -> Alert -> Target Asset
 * - Calculates composite risk score
 * - Updates impact metrics
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function calculateRiskScore(alert) {
  // Risk score calculation based on severity and matched events
  const severity_weights = {
    CRITICAL: 100,
    HIGH: 70,
    MEDIUM: 40,
    LOW: 20,
    INFO: 5,
  };

  const base_score = severity_weights[alert.severity] || 50;
  const event_count = Object.values(alert.matched_events || {}).reduce(
    (sum, events) => sum + (Array.isArray(events) ? events.length : 0),
    0
  );
  const time_factor = 1 + (event_count * 0.1); // Multi-event escalation

  return Math.min(Math.round(base_score * time_factor), 100);
}

function buildGraphNodes(alert, udm_event) {
  const principal_userid =
    udm_event.principal?.user?.userid || 'unknown_principal';
  const target_hostname = udm_event.target?.asset?.hostname || 'unknown_asset';
  const risk_score = calculateRiskScore(alert);

  return {
    alert_node: {
      type: 'Alert',
      id: `alert-${alert.rule_id}-${Date.now()}`,
      rule_id: alert.rule_id,
      rule_name: alert.rule_name,
      description: alert.description,
      severity: alert.severity,
      risk_score,
      status: 'open',
      fired_at: alert.fired_at,
    },
    principal_node: {
      type: 'User',
      identifier: principal_userid,
    },
    target_node: {
      type: 'Asset',
      identifier: target_hostname,
    },
    edges: [
      {
        source: 'User',
        source_id: principal_userid,
        target: 'Alert',
        target_id: `alert-${alert.rule_id}-${Date.now()}`,
        relationship: 'triggered',
      },
      {
        source: 'Alert',
        source_id: `alert-${alert.rule_id}-${Date.now()}`,
        target: 'Asset',
        target_id: target_hostname,
        relationship: 'affected',
      },
    ],
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'soc_manager') {
      return Response.json(
        { error: 'Forbidden: SOC admin required' },
        { status: 403 }
      );
    }

    const { alerts, udm_event } = await req.json();

    if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
      return Response.json({
        projected: 0,
        message: 'No alerts to project',
      });
    }

    const projected_alerts = [];
    const errors = [];

    for (const alert of alerts) {
      try {
        const graph = buildGraphNodes(alert, udm_event);

        // Create AgentAction record (alert node)
        const agent_action = await base44.entities.AgentAction.create({
          agent_name: 'graph_projection_engine',
          action_type: 'alert_triggered',
          summary: `${alert.rule_name}: ${graph.principal_node.identifier} → ${graph.target_node.identifier}`,
          status: 'completed',
          severity: alert.severity,
          metadata: JSON.stringify({
            rule_id: alert.rule_id,
            risk_score: graph.alert_node.risk_score,
            matched_events: alert.matched_events,
            edges: graph.edges,
          }),
          related_entity: 'Incident',
        });

        // If this is a critical alert, auto-create an Incident
        if (alert.severity === 'CRITICAL') {
          const incident = await base44.entities.Incident.create({
            title: `[${alert.rule_id}] ${alert.rule_name}`,
            description: alert.description,
            severity: 'critical',
            status: 'open',
            category: 'other',
            affected_client: user.managed_client || 'unknown',
            affected_systems: [graph.target_node.identifier],
            assigned_to: user.email,
            detected_at: new Date().toISOString(),
            ioc_indicators: [],
          });

          projected_alerts.push({
            alert_node: graph.alert_node,
            incident_id: incident.id,
            agent_action_id: agent_action.id,
            edges: graph.edges,
          });
        } else {
          projected_alerts.push({
            alert_node: graph.alert_node,
            agent_action_id: agent_action.id,
            edges: graph.edges,
          });
        }
      } catch (error) {
        errors.push({
          alert_id: alert.rule_id,
          error: error.message,
        });
      }
    }

    return Response.json({
      projected: projected_alerts.length,
      alerts: projected_alerts,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Graph projection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});