import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function severityMeta(severity) {
  const map = {
    critical: { cls: 'bg-red-500/15 text-red-400 border-red-500/30', icon: ShieldAlert },
    high:     { cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: AlertTriangle },
    medium:   { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
    low:      { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Info },
  };
  return map[severity] || { cls: 'bg-muted text-muted-foreground border-border', icon: Info };
}

function AlertRow({ item }) {
  const meta = severityMeta(item.severity);
  const Icon = meta.icon;

  let metadata = {};
  try { metadata = JSON.parse(item.metadata || '{}'); } catch {}

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${meta.cls}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{item.summary}</p>
        {metadata.threats !== undefined && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Threats blocked: <span className="text-red-400 font-semibold">{metadata.threats?.toLocaleString()}</span>
            {metadata.firewall_events !== undefined && (
              <> · Firewall events: <span className="text-orange-400 font-semibold">{metadata.firewall_events?.toLocaleString()}</span></>
            )}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">
          {item.created_date
            ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true })
            : '—'}
        </p>
      </div>
      <span className={`shrink-0 text-xs font-semibold uppercase px-2 py-0.5 rounded-md border ${meta.cls}`}>
        {item.severity}
      </span>
    </div>
  );
}

export default function CloudflareAlertHistory() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['cf-alert-history'],
    queryFn: () => base44.entities.AgentAction.filter(
      { action_type: 'alert_triggered', agent_name: 'overnight_watch' },
      '-created_date',
      50
    ),
    initialData: [],
  });

  // Also catch any cloudflare-tagged alerts
  const { data: cfAlerts = [] } = useQuery({
    queryKey: ['cf-alert-history-2'],
    queryFn: () => base44.entities.AgentAction.filter(
      { action_type: 'alert_triggered', related_entity: 'cloudflare' },
      '-created_date',
      50
    ),
    initialData: [],
  });

  // Merge + deduplicate by id, sort by date desc
  const combined = [...alerts, ...cfAlerts];
  const seen = new Set();
  const allAlerts = combined
    .filter(a => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    })
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 20);

  return (
    <div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading alert history…</p>
      ) : allAlerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
          <p className="text-sm text-muted-foreground">No Cloudflare alerts on record.</p>
        </div>
      ) : (
        <div>
          {allAlerts.map((a, i) => <AlertRow key={a.id || i} item={a} />)}
        </div>
      )}
    </div>
  );
}