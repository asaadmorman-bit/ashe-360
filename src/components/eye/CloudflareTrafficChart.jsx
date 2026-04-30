import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, RadialBarChart, RadialBar, PieChart, Pie
} from 'recharts';
import { RefreshCw, Shield, Globe, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const THREAT_COLORS = ['#f87171', '#fb923c', '#facc15', '#f472b6', '#c084fc', '#60a5fa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur p-3 text-xs shadow-xl">
      <p className="text-muted-foreground font-semibold mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function CloudflareTrafficChart() {
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading live Cloudflare traffic data…
      </div>
    );
  }

  if (!data?.configured) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Cloudflare credentials not configured.
      </div>
    );
  }

  const analytics = data.analytics || {};
  const firewall = data.firewall_events || [];

  // Traffic breakdown for composed bar chart
  const trafficBreakdown = [
    { name: 'Total Requests', value: analytics.requests_all || 0, fill: '#38bdf8' },
    { name: 'Cached',         value: analytics.requests_cached || 0, fill: '#4ade80' },
    { name: 'Page Views',     value: analytics.pageviews || 0, fill: '#00e5c8' },
    { name: 'Unique Visitors',value: analytics.uniques || 0, fill: '#a78bfa' },
    { name: 'Threats',        value: analytics.threats || 0, fill: '#f87171' },
  ];

  // Cache ratio for radial
  const totalReqs = analytics.requests_all || 1;
  const cacheRatio = Math.round(((analytics.requests_cached || 0) / totalReqs) * 100);
  const threatRatio = Math.round(((analytics.threats || 0) / totalReqs) * 100);
  const radialData = [
    { name: 'Cache Hit Rate', value: cacheRatio, fill: '#4ade80' },
    { name: 'Threat Rate',    value: Math.max(threatRatio, 0.5), fill: '#f87171' },
    { name: 'Clean Traffic',  value: Math.max(100 - cacheRatio - threatRatio, 0), fill: '#38bdf8' },
  ];

  // Firewall pie data
  const firewallTop = firewall.slice(0, 6);
  const firewallTotal = firewall.reduce((a, e) => a + (e.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Live Traffic & Threat Visualization</span>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground ml-1">· updated {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main: Traffic Volume Bars */}
      <div className="rounded-xl border border-border/40 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">24h Traffic Volume Breakdown</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={trafficBreakdown} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmt}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {trafficBreakdown.map((entry, i) => (
                <Cell key={i} fill={entry.fill} opacity={0.85} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00e5c8"
              strokeWidth={2}
              dot={{ fill: '#00e5c8', r: 4 }}
              strokeDasharray="5 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Radial health + Firewall pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Radial: Traffic Health */}
        <div className="rounded-xl border border-border/40 bg-card/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold text-foreground">Traffic Health Ratios</p>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={65}
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#0f1e2e' }} />
                <Tooltip
                  contentStyle={{ background: '#0f1e2e', border: '1px solid #1e3a4a', borderRadius: 8, fontSize: 11 }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-xs">
              {radialData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-bold ml-auto" style={{ color: d.fill }}>{d.value}%</span>
                </div>
              ))}
              <div className="pt-1 border-t border-border/30 text-muted-foreground">
                Total: <span className="text-foreground font-bold">{fmt(analytics.requests_all)}</span> reqs
              </div>
            </div>
          </div>
        </div>

        {/* Firewall threats by country pie */}
        <div className="rounded-xl border border-border/40 bg-card/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-semibold text-foreground">
              Threat Origins
              {firewallTotal > 0 && <span className="ml-1 text-muted-foreground text-xs">({fmt(firewallTotal)} events)</span>}
            </p>
          </div>
          {firewallTop.length === 0 ? (
            <div className="flex items-center justify-center h-28 gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400 font-medium">No threats detected (24h)</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={firewallTop}
                    dataKey="count"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={55}
                    innerRadius={28}
                    paddingAngle={2}
                  >
                    {firewallTop.map((_, i) => (
                      <Cell key={i} fill={THREAT_COLORS[i % THREAT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f1e2e', border: '1px solid #1e3a4a', borderRadius: 8, fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 text-xs flex-1 min-w-0">
                {firewallTop.map((e, i) => (
                  <div key={i} className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: THREAT_COLORS[i % THREAT_COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{e.country || '—'}</span>
                    <span className="font-bold ml-auto shrink-0" style={{ color: THREAT_COLORS[i % THREAT_COLORS.length] }}>{fmt(e.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}