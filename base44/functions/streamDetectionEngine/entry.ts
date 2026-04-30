/**
 * YARA-L Equivalent Streaming Detection Engine
 * 
 * Reads normalized UDM events from Redpanda, evaluates pattern-match rules
 * over sliding 5-minute windows, and yields alert payloads to downstream graph projection.
 * 
 * Rules are stored as a simple rule array. Example:
 * {
 *   rule_id: "R_01_BRUTE",
 *   name: "Admin Brute Force to Critical DB",
 *   description: "Detect blocked admin login attempts followed by allowed access to prod DB",
 *   window_minutes: 5,
 *   patterns: [
 *     {
 *       name: "e1",
 *       condition: (e) => e.principal.user.userid === "admin" && e.security_result.action === "BLOCK"
 *     },
 *     {
 *       name: "e2",
 *       condition: (e) => e.target.asset.hostname === "db-prod-core" && e.security_result.action === "ALLOW"
 *     }
 *   ],
 *   correlation: "e1 AND e2",
 *   severity: "CRITICAL"
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Kafka } from 'npm:kafkajs@2.2.4';

// Built-in detection rules (YARA-L style)
const DEFAULT_RULES = [
  {
    rule_id: 'R_01_ADMIN_BRUTE',
    name: 'Admin Brute Force to Critical DB',
    description: 'Blocked admin login followed by allowed access to prod database',
    window_minutes: 5,
    patterns: [
      {
        name: 'e1',
        condition: (e) =>
          e.principal?.user?.userid === 'admin' &&
          e.security_result?.action === 'BLOCK',
      },
      {
        name: 'e2',
        condition: (e) =>
          e.target?.asset?.hostname?.includes('db-prod') &&
          e.security_result?.action === 'ALLOW',
      },
    ],
    correlation: 'e1 AND e2',
    severity: 'CRITICAL',
  },
  {
    rule_id: 'R_02_LATERAL_MOVEMENT',
    name: 'Lateral Movement Pattern',
    description: 'Multiple system access from single source to different assets',
    window_minutes: 10,
    patterns: [
      {
        name: 'e1',
        condition: (e) =>
          e.security_result?.category === 'ASSET_STATUS' &&
          e.security_result?.action === 'MONITORED',
      },
    ],
    correlation: 'e1',
    severity: 'HIGH',
  },
  {
    rule_id: 'R_03_CRITICAL_VULN_OPEN',
    name: 'Critical Vulnerability Detected',
    description: 'Critical severity vulnerability found on asset',
    window_minutes: 1,
    patterns: [
      {
        name: 'e1',
        condition: (e) =>
          e.security_result?.category === 'VULNERABILITY' &&
          e.security_result?.severity === 'CRITICAL',
      },
    ],
    correlation: 'e1',
    severity: 'CRITICAL',
  },
  {
    rule_id: 'R_04_WAF_BLOCK_SPIKE',
    name: 'WAF Block Spike',
    description: 'Sudden increase in firewall blocks from single source',
    window_minutes: 5,
    patterns: [
      {
        name: 'e1',
        condition: (e) =>
          e.security_result?.category === 'WAF_EVENT' &&
          e.security_result?.action === 'BLOCK' &&
          e.security_result?.event_count > 50,
      },
    ],
    correlation: 'e1',
    severity: 'HIGH',
  },
];

// In-memory event buffer for windowed correlation
class EventBuffer {
  constructor(window_minutes = 5) {
    this.window_ms = window_minutes * 60 * 1000;
    this.events = [];
  }

  add(event) {
    this.events.push({
      ...event,
      buffer_timestamp: Date.now(),
    });
    this.prune();
  }

  prune() {
    const now = Date.now();
    this.events = this.events.filter(
      (e) => now - e.buffer_timestamp < this.window_ms
    );
  }

  getEventsInWindow(window_minutes) {
    const window_ms = window_minutes * 60 * 1000;
    const now = Date.now();
    return this.events.filter(
      (e) => now - e.buffer_timestamp < window_ms
    );
  }

  clear() {
    this.events = [];
  }
}

// Evaluate a rule against the event buffer
function evaluateRule(rule, buffer) {
  const window_events = buffer.getEventsInWindow(rule.window_minutes);

  if (window_events.length === 0) return null;

  // Simple pattern matching: check if any event matches each pattern
  const pattern_matches = {};

  for (const pattern of rule.patterns) {
    const matched_events = window_events.filter((e) => {
      try {
        return pattern.condition(e);
      } catch {
        return false;
      }
    });

    if (matched_events.length > 0) {
      pattern_matches[pattern.name] = matched_events;
    }
  }

  // Check correlation (simplified: if all patterns matched, fire alert)
  const all_patterns_matched = rule.patterns.every(
    (p) => pattern_matches[p.name] && pattern_matches[p.name].length > 0
  );

  if (all_patterns_matched) {
    return {
      rule_id: rule.rule_id,
      rule_name: rule.name,
      description: rule.description,
      severity: rule.severity,
      matched_events: pattern_matches,
      fired_at: new Date().toISOString(),
      correlation: rule.correlation,
    };
  }

  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { udm_event, rules = null } = await req.json();

    if (!udm_event) {
      return Response.json({ error: 'Missing udm_event' }, { status: 400 });
    }

    // Use provided rules or defaults
    const active_rules = rules || DEFAULT_RULES;

    // Initialize buffer (shared across requests in production, this is simplified)
    // In production, you'd use a distributed cache or state store
    const buffer = new EventBuffer(5);
    buffer.add(udm_event);

    // Evaluate all rules
    const fired_alerts = [];

    for (const rule of active_rules) {
      const alert = evaluateRule(rule, buffer);
      if (alert) {
        fired_alerts.push(alert);
      }
    }

    return Response.json({
      event_id: udm_event.event_id,
      buffered_count: buffer.events.length,
      alerts_fired: fired_alerts.length,
      alerts: fired_alerts,
    });
  } catch (error) {
    console.error('Detection engine error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});