import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend
} from 'recharts';
import { RefreshCw, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur p-3 text-xs shadow-xl min-w-[160px]">
      <p className="text-muted-foreground font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-bold" style={{ color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ThreatHistoryChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [configured, setConfigured] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getCloudflareThreatHistory', {});
      if (res.data?.configured === false) {
        setConfigured(false);
      } else {
        const daily = (res.data?.daily || []).map(d => ({
          ...d,
          label: d.date ? format(parseISO(d.date), 'MMM d') : '—',
        }));
        setData(daily);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Summary stats
  const totalThreats = data.reduce((a, d) => a + (d.threats || 0), 0);
  const peakDay = data.reduce((max, d) => d.threats > (max?.threats || 0) ? d : max, null);
  const recentAvg = data.length >= 7
    ? Math.round(data.slice(-7).reduce((a, d) => a + d.threats, 0) / 7)
    : 0;
  const prevAvg = data.length >= 14
    ? Math.round(data.slice(-14, -7).reduce((a, d) => a + d.threats, 0) / 7)
    : 0;
  const trending = recentAvg > prevAvg ? 'up' : 'down';

  if (!configured) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Cloudflare credentials not configured.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-foreground">Blocked Malicious Traffic — Last 30 Days</span>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground ml-1">· {lastUpdated.toLocaleTimeString()}</span>
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

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-muted-foreground">30-Day Total</span>
          <span className="text-sm font-black text-red-400">{fmt(totalThreats)}</span>
        </div>
        {peakDay && (
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/8 px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Peak Day</span>
            <span className="text-sm font-black text-orange-400">{peakDay.label} ({fmt(peakDay.threats)})</span>
          </div>
        )}
        <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${
          trending === 'up'
            ? 'border-red-500/20 bg-red-500/8'
            : 'border-green-500/20 bg-green-500/8'
        }`}>
          {trending === 'up'
            ? <TrendingUp className="w-3.5 h-3.5 text-red-400" />
            : <TrendingDown className="w-3.5 h-3.5 text-green-400" />}
          <span className="text-xs text-muted-foreground">7-Day Avg</span>
          <span className={`text-sm font-black ${trending === 'up' ? 'text-red-400' : 'text-green-400'}`}>
            {recentAvg} / day
          </span>
        </div>
      </div>

      {/* Chart */}
      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading 30-day threat history…
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          No historical data available yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 bg-card/40 p-4">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmt}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
              />
              {recentAvg > 0 && (
                <ReferenceLine
                  y={recentAvg}
                  stroke="#fb923c"
                  strokeDasharray="4 2"
                  label={{ value: `7d avg: ${recentAvg}`, fill: '#fb923c', fontSize: 9, position: 'insideTopRight' }}
                />
              )}
              <Area
                type="monotone"
                dataKey="requests"
                name="Total Requests"
                stroke="#38bdf8"
                strokeWidth={1.5}
                fill="url(#reqGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#38bdf8' }}
              />
              <Area
                type="monotone"
                dataKey="threats"
                name="Threats Blocked"
                stroke="#f87171"
                strokeWidth={2.5}
                fill="url(#threatGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#f87171' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}