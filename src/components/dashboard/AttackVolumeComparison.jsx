import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, RefreshCw } from 'lucide-react';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n?.toString() || '0';
}

export default function AttackVolumeComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await base44.functions.invoke('getCloudflareAttackComparison', {});
      setData(res.data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl p-6 flex items-center gap-3">
      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
      <span className="text-sm text-muted-foreground">Loading attack data…</span>
    </div>
  );

  if (!data?.configured) return (
    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
      <p className="text-sm text-muted-foreground">Cloudflare not configured</p>
    </div>
  );

  const zones = Object.keys(data.comparison);
  const [zone1, zone2] = zones;
  const comp1 = data.comparison[zone1];
  const comp2 = data.comparison[zone2];

  // Prepare hourly chart data (side-by-side)
  const hourlyData = [];
  if (comp1.hourly && comp2.hourly) {
    const len = Math.max(comp1.hourly.length, comp2.hourly.length);
    for (let i = 0; i < len; i++) {
      const h1 = comp1.hourly[i];
      const h2 = comp2.hourly[i];
      const hour = h1?.hour || h2?.hour || '';
      hourlyData.push({
        hour: hour.split('T')[1]?.slice(0, 5) || '',
        [zone1]: h1?.count || 0,
        [zone2]: h2?.count || 0,
      });
    }
  }

  const color1 = '#ef4444';
  const color2 = '#3b82f6';

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Attack Traffic Comparison (24h)</h3>
        </div>
        <button onClick={() => fetch(true)} disabled={refreshing} className="p-1.5 rounded-lg border border-border/40 hover:bg-secondary/20">
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Total volume comparison */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: zone1, total: comp1.total, color: color1 },
            { name: zone2, total: comp2.total, color: color2 },
          ].map(z => (
            <div key={z.name} className="rounded-xl border border-border/40 bg-secondary/20 p-4">
              <p className="text-xs text-muted-foreground mb-2 truncate">{z.name}</p>
              <p className="text-3xl font-black tabular-nums" style={{ color: z.color }}>{fmt(z.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">blocked attacks</p>
            </div>
          ))}
        </div>

        {/* Action breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { zone: zone1, actions: comp1.byAction, color: color1 },
            { zone: zone2, actions: comp2.byAction, color: color2 },
          ].map(item => (
            <div key={item.zone} className="rounded-xl border border-border/40 bg-secondary/20 p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">{item.zone}</p>
              {Object.entries(item.actions).map(([action, count]) => (
                <div key={action} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{action}</span>
                  <span className="font-bold" style={{ color: item.color }}>{fmt(count)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Hourly trend chart */}
        {hourlyData.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-secondary/10 p-4">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-4">Hourly Attack Volume</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(val) => fmt(val)}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Bar dataKey={zone1} fill={color1} radius={[4, 4, 0, 0]} />
                <Bar dataKey={zone2} fill={color2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}