import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Cloud, Shield, Zap, Globe, AlertOctagon, RefreshCw } from 'lucide-react';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n?.toString() || '0';
}

function fmtBytes(b) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB';
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB';
  if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB';
  return b + ' B';
}

export default function CloudflarePanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('getCloudflareMetrics', {});
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return (
    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 flex items-center gap-3">
      <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />
      <span className="text-muted-foreground text-sm">Loading Cloudflare data…</span>
    </div>
  );

  if (error || !data?.configured) return (
    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
      <div className="flex items-center gap-2 mb-2">
        <Cloud className="w-5 h-5 text-orange-400" />
        <span className="font-semibold text-orange-300">Cloudflare Network</span>
        <span className="ml-auto text-xs text-orange-400/60 bg-orange-500/10 px-2 py-0.5 rounded-full">Not Configured</span>
      </div>
      <p className="text-muted-foreground text-sm">Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID in secrets to enable live metrics.</p>
    </div>
  );

  const { analytics, firewall_events, zone_name, zone_status } = data;

  return (
    <div className="rounded-2xl border border-orange-500/25 bg-gradient-to-br from-orange-500/8 to-transparent p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Cloudflare Network</p>
            <p className="text-xs text-muted-foreground">{zone_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${zone_status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-muted-foreground capitalize">{zone_status}</span>
          <button onClick={fetch} className="ml-2 p-1.5 rounded-lg hover:bg-orange-500/10 transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Requests (24h)', value: fmt(analytics.requests_all), icon: Globe, color: 'text-blue-400' },
          { label: 'Cached', value: fmt(analytics.requests_cached), icon: Zap, color: 'text-green-400' },
          { label: 'Bandwidth', value: fmtBytes(analytics.bandwidth_all), icon: Cloud, color: 'text-orange-400' },
          { label: 'Threats Blocked', value: fmt(analytics.threats), icon: Shield, color: 'text-red-400' },
          { label: 'Page Views', value: fmt(analytics.pageviews), icon: Globe, color: 'text-cyan-400' },
          { label: 'Unique Visitors', value: fmt(analytics.uniques), icon: Globe, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card/60 border border-border/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent firewall events */}
      {firewall_events?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <p className="text-sm font-semibold text-foreground">Recent Firewall Events</p>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {firewall_events.map((e, i) => (
              <div key={i} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-red-300 font-mono uppercase">{e.action}</span>
                <span className="text-muted-foreground">{e.country}</span>
                <span className="text-muted-foreground/60">{e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}