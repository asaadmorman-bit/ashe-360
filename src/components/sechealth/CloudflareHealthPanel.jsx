import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Cloud, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function CloudflareHealthPanel() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, hRes] = await Promise.all([
        base44.functions.invoke('getCloudflareMetrics', {}),
        base44.functions.invoke('getCloudflareThreatHistory', {}),
      ]);
      setMetrics(mRes.data);
      setHistory((hRes.data?.history || []).slice(-14));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const analytics = metrics?.analytics || {};
  const firewall = metrics?.firewall_events || [];
  const totalFW = firewall.reduce((a, e) => a + (e.count || 0), 0);
  const threats = analytics.threats || 0;
  const threatLevel = threats >= 50 || totalFW >= 100 ? 'CRITICAL' : threats >= 10 || totalFW >= 20 ? 'ELEVATED' : 'NOMINAL';
  const levelColor = threatLevel === 'CRITICAL' ? 'text-red-400' : threatLevel === 'ELEVATED' ? 'text-orange-400' : 'text-green-400';
  const levelBg = threatLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20' : threatLevel === 'ELEVATED' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-green-500/10 border-green-500/20';

  if (!metrics?.configured) {
    return (
      <div className="glass-panel rounded-xl p-5 flex items-center justify-center h-48">
        <p className="text-muted-foreground text-sm">Cloudflare not configured</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <Cloud className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Cloudflare Network Health</h3>
        <button onClick={load} disabled={loading} className="ml-auto text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Threat level badge */}
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${levelBg}`}>
          <div>
            <p className="text-xs text-muted-foreground">Threat Level</p>
            <p className={`text-lg font-black ${levelColor}`}>{threatLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Zone</p>
            <p className="text-sm font-mono text-foreground">{metrics?.zone_name || '—'}</p>
          </div>
        </div>

        {/* Metric pills */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Threats Blocked', value: fmt(threats), color: 'text-red-400' },
            { label: 'Firewall Events', value: fmt(totalFW), color: 'text-orange-400' },
            { label: 'Total Requests', value: fmt(analytics.requests_all), color: 'text-blue-400' },
            { label: 'Unique Visitors', value: fmt(analytics.uniques), color: 'text-primary' },
          ].map(m => (
            <div key={m.label} className="bg-secondary/30 rounded-lg px-3 py-2">
              <p className={`text-lg font-bold font-mono ${m.color}`}>{loading ? '—' : m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* 14-day threat trend sparkline */}
        {history.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">14-Day Threat Trend</p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#0f1e2e', border: '1px solid #1e3a4a', borderRadius: 8, fontSize: 11 }}
                  formatter={v => [fmt(v), 'Threats']}
                  labelFormatter={l => l}
                />
                <Area type="monotone" dataKey="threats" stroke="#f87171" strokeWidth={2} fill="url(#tgrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top firewall origins */}
        {firewall.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Top Threat Origins</p>
            <div className="space-y-1.5">
              {firewall.slice(0, 4).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground flex-1">{e.country || '—'}</span>
                  <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${Math.min(100, (e.count / (firewall[0]?.count || 1)) * 100)}%` }} />
                  </div>
                  <span className="font-mono text-red-400 font-bold w-8 text-right">{e.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}