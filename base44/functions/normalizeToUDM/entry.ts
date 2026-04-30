/**
 * Normalizes Base44 entities (Incidents, Vulnerabilities, Assets, Cloudflare events)
 * into Google SecOps Unified Data Model (UDM) schema.
 * 
 * UDM Structure:
 * {
 *   timestamp: ISO-8601,
 *   principal: { user: { userid, email }, host: { hostname } },
 *   target: { asset: { hostname, ip }, user: { userid } },
 *   network: { ip: string, port: number, protocol: string },
 *   security_result: { action: string, severity: string, category: string }
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function normalizeIncident(incident) {
  return {
    timestamp: incident.detected_at || new Date().toISOString(),
    event_id: `incident-${incident.id}`,
    principal: {
      user: {
        userid: incident.assigned_to || 'unknown',
        email: null,
      },
    },
    target: {
      asset: {
        hostname: incident.affected_systems?.[0] || 'unknown',
        ip: null,
      },
    },
    network: {
      ip: null,
      port: null,
      protocol: null,
    },
    security_result: {
      action: incident.status === 'open' ? 'ALERT' : incident.status === 'resolved' ? 'MITIGATED' : 'INVESTIGATING',
      severity: incident.severity?.toUpperCase() || 'MEDIUM',
      category: incident.category?.toUpperCase() || 'OTHER',
      description: incident.description,
    },
  };
}

function normalizeVulnerability(vuln) {
  return {
    timestamp: vuln.discovered_at || new Date().toISOString(),
    event_id: `vuln-${vuln.id}`,
    principal: {
      user: { userid: 'scanner', email: null },
    },
    target: {
      asset: {
        hostname: vuln.asset_hostname || 'unknown',
        ip: null,
      },
    },
    network: {
      ip: null,
      port: null,
      protocol: null,
    },
    security_result: {
      action: vuln.status === 'open' ? 'OPEN' : vuln.status === 'patched' ? 'REMEDIATED' : 'IN_PROGRESS',
      severity: vuln.severity?.toUpperCase() || 'MEDIUM',
      category: 'VULNERABILITY',
      cve_id: vuln.cve_id,
      cvss_score: vuln.cvss_score,
      description: vuln.description,
    },
  };
}

function normalizeAsset(asset) {
  return {
    timestamp: asset.last_scan_date || new Date().toISOString(),
    event_id: `asset-${asset.id}`,
    principal: {
      user: { userid: 'system', email: null },
    },
    target: {
      asset: {
        hostname: asset.hostname,
        ip: asset.ip_address,
      },
    },
    network: {
      ip: asset.ip_address,
      port: null,
      protocol: null,
    },
    security_result: {
      action: asset.agent_status === 'active' ? 'MONITORED' : 'UNMANAGED',
      severity: asset.critical_count > 0 ? 'CRITICAL' : asset.vulnerability_count > 0 ? 'HIGH' : 'LOW',
      category: 'ASSET_STATUS',
      asset_type: asset.asset_type,
      compliance_score: asset.compliance_score,
    },
  };
}

function normalizeCloudflareEvent(event) {
  return {
    timestamp: event.timestamp || new Date().toISOString(),
    event_id: `cf-${event.id || Math.random()}`,
    principal: {
      user: { userid: 'cloudflare-waf', email: null },
    },
    target: {
      asset: {
        hostname: event.domain || 'unknown',
        ip: null,
      },
    },
    network: {
      ip: event.country || null,
      port: null,
      protocol: 'HTTP',
    },
    security_result: {
      action: event.action?.toUpperCase() || 'LOG',
      severity: event.action === 'block' ? 'CRITICAL' : event.action === 'challenge' ? 'HIGH' : 'MEDIUM',
      category: 'WAF_EVENT',
      rule_id: event.rule_id,
      country: event.country,
      event_count: event.count,
    },
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type, entity_data } = await req.json();

    let udm_event = null;

    switch (entity_type) {
      case 'incident':
        udm_event = normalizeIncident(entity_data);
        break;
      case 'vulnerability':
        udm_event = normalizeVulnerability(entity_data);
        break;
      case 'asset':
        udm_event = normalizeAsset(entity_data);
        break;
      case 'cloudflare':
        udm_event = normalizeCloudflareEvent(entity_data);
        break;
      default:
        return Response.json({ error: 'Unknown entity type' }, { status: 400 });
    }

    // Strip nulls
    const stripNulls = (obj) => {
      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== null && v !== undefined) {
          if (typeof v === 'object' && !Array.isArray(v)) {
            result[k] = stripNulls(v);
          } else {
            result[k] = v;
          }
        }
      }
      return result;
    };

    const cleaned = stripNulls(udm_event);

    return Response.json({ udm_event: cleaned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});