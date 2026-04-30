import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Cloud, Shield, Zap, Globe, AlertOctagon, RefreshCw, Wifi, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function fmtBytes(b) {
  if (!b) return '0 B';
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB';
  if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB';
  return b + ' B';
}

const STAT_CONFIGS = [
  { key: 'requests_all',     label: 'Total Requests',    icon: Globe,       color: '#38bdf8' },
  { key: 'requests_cached',  label: 'Cached Requests',   icon: Zap,         color: '#4ade80' },
  { key: 'threats',          label: 'Threats Blocked',   icon: Shield,      color: '#f87171' },
  { key: 'pageviews',        label: 'Page Views',        icon: TrendingUp,  color: '#00e5c8' },
  { key: 'uniques',          label: 'Unique Visitors',   icon: Wifi,        color: '#a78bfa' },
  { key: 'bandwidth_all',    label: 'Bandwidth (24h)',   icon: Cloud,       color: '#fb923c', fmt: fmtBytes },
];

export default function CloudflareEyePanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getCloudflareMetrics', {});
      setData(res.data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const firewallChartData = data?.firewall_events?.map(e => ({
    name: e.country?.length > 12 ? e.country.slice(0, 12) + '…' : e.country,
    count: e.count,
    action: e.action,
  })) || [];

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Cloud className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">
              Cloudflare — {data?.zone_name || 'eds-360.com'}
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">Last updated {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data?.zone_status && (
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${data.zone_status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-muted-foreground capitalize">{data.zone_status}</span>
            </div>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Fetching live Cloudflare data…
        </div>
      ) : !data?.configured ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Cloudflare credentials not configured. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID in secrets.
        </div>
      ) : (
        <>
          {/* Threat highlight */}
          {data.analytics.threats > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3">
              <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300 font-medium">
                <span className="text-red-400 font-black text-lg">{fmt(data.analytics.threats)}</span> threats blocked in the last 24 hours
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STAT_CONFIGS.map(({ key, label, icon: Icon, color, fmt: fmtFn }) => (
              <div key={key} className="rounded-xl border border-border/40 bg-card/40 p-3 hover:bg-card/60 transition-colors">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className="text-xl font-black tabular-nums" style={{ color }}>
                  {(fmtFn || fmt)(data.analytics[key])}
                </p>
              </div>
            ))}
          </div>

          {/* Firewall events chart */}
          {firewallChartData.length > 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-foreground">Firewall Events by Country (24h)</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={firewallChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ background: '#0f1e2e', border: '1px solid #1e3a4a', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {firewallChartData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#f87171' : i === 1 ? '#fb923c' : '#facc15'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <p className="text-sm text-green-400 font-medium">No firewall events detected in the last 24 hours</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}