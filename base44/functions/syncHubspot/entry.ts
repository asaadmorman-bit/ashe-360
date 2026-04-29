import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const HUBSPOT_API_KEY = Deno.env.get('HUBSpot_Private_App');
const HUBSPOT_BASE = 'https://api.hubapi.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled/service calls without user auth
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!HUBSPOT_API_KEY) {
      return Response.json({ error: 'HUBSpot_Private_App secret not set' }, { status: 500 });
    }

    // Fetch contacts from HubSpot
    const hsRes = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,company,phone,lifecyclestage,hs_lead_status,notes_last_contacted&archived=false`, {
      headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}`, 'Content-Type': 'application/json' },
    });

    if (!hsRes.ok) {
      const err = await hsRes.text();
      return Response.json({ error: `HubSpot API error: ${err}` }, { status: 500 });
    }

    const hsData = await hsRes.json();
    const contacts = hsData.results || [];

    // Fetch deals from HubSpot
    const dealsRes = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,hubspot_owner_id&archived=false`, {
      headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}`, 'Content-Type': 'application/json' },
    });

    let deals = [];
    if (dealsRes.ok) {
      const dealsData = await dealsRes.json();
      deals = dealsData.results || [];
    }

    let created = 0, updated = 0, errors = 0;

    for (const hs of contacts) {
      const p = hs.properties;
      const email = p.email;
      if (!email) continue;

      const contactData = {
        hubspot_id: hs.id,
        first_name: p.firstname || '',
        last_name: p.lastname || '',
        email,
        company: p.company || '',
        phone: p.phone || '',
        lifecycle_stage: mapLifecycleStage(p.lifecyclestage),
        source: 'HubSpot Sync',
        last_contacted: p.notes_last_contacted ? new Date(parseInt(p.notes_last_contacted)).toISOString() : undefined,
      };

      try {
        // Check if exists
        const existing = await base44.asServiceRole.entities.CRMContact.filter({ hubspot_id: hs.id });
        if (existing && existing.length > 0) {
          await base44.asServiceRole.entities.CRMContact.update(existing[0].id, contactData);
          updated++;
        } else {
          await base44.asServiceRole.entities.CRMContact.create(contactData);
          created++;
        }
      } catch (_) {
        errors++;
      }
    }

    // Log sync
    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'HubSpot Sync',
      action_type: 'sync_completed',
      summary: `HubSpot sync: ${created} created, ${updated} updated, ${errors} errors. ${deals.length} deals fetched.`,
      status: errors > 0 ? 'completed' : 'completed',
      severity: 'low',
    });

    return Response.json({ success: true, contacts_synced: created + updated, contacts_created: created, contacts_updated: updated, deals_count: deals.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mapLifecycleStage(hs) {
  const map = {
    subscriber: 'subscriber', lead: 'lead', marketingqualifiedlead: 'mql',
    salesqualifiedlead: 'sql', opportunity: 'opportunity', customer: 'customer', evangelist: 'evangelist',
  };
  return map[(hs || '').toLowerCase()] || 'lead';
}