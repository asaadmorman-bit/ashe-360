import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, ExternalLink, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const SEV_COLORS = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-400 border-green-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const SEV_DOT = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  info: 'bg-blue-500',
};

export default function ThreatIntelWidget() {
  const { data: feeds = [] } = useQuery({
    queryKey: ['threat-intel-feeds-widget'],
    queryFn: () => base44.entities.ThreatIntelFeed.list('-published_at', 50),
    initialData: [],
    refetchInterval: 10 * 60 * 1000,
  });

  const topAlerts = feeds
    .filter(f => !f.is_read)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
    })
    .slice(0, 6);

  const critical = feeds.filter(f => f.severity === 'critical').length;
  const high = feeds.filter(f => f.severity === 'high').length;
  const unread = feeds.filter(f => !f.is_read).length;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Threat Intel Feed</h3>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">{unread} new</span>
          )}
        </div>
        <Link to="/threat-intel" className="text-xs text-primary hover:underline">View All →</Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border/30 border-b border-border/50">
        <div className="px-4 py-3 text-center">
          <p className="text-xl font-bold text-red-400">{critical}</p>
          <p className="text-xs text-muted-foreground">Critical</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-xl font-bold text-orange-400">{high}</p>
          <p className="text-xs text-muted-foreground">High</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-xl font-bold text-foreground">{feeds.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {topAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No new alerts — sync feeds to refresh
          </div>
        ) : (
          topAlerts.map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SEV_DOT[f.severity] || 'bg-gray-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{f.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{f.source}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {f.published_at ? formatDistanceToNow(new Date(f.published_at), { addSuffix: true }) : '—'}
                  </span>
                </div>
              </div>
              {f.url && (
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary flex-shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {unread > 6 && (
        <div className="px-5 pb-4 text-center">
          <Link to="/threat-intel" className="text-xs text-primary hover:underline">+{unread - 6} more unread alerts</Link>
        </div>
      )}
    </div>
  );
}