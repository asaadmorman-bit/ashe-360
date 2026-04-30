import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Cloud, Activity } from 'lucide-react';

const THRESHOLDS = { threats_warn: 10, threats_critical: 50, firewall_warn: 20, firewall_critical: 100 };

function getThreatLevel(threats, firewallTotal) {
  if (threats >= THRESHOLDS.threats_critical || firewallTotal >= THRESHOLDS.firewall_critical) {
    return { level: 'CRITICAL', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.35)', Icon: ShieldAlert, pulse: true };
  }
  if (threats >= THRESHOLDS.threats_warn || firewallTotal >= THRESHOLDS.firewall_warn) {
    return { level: 'ELEVATED', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.35)', Icon: AlertTriangle, pulse: true };
  }
  return { level: 'NOMINAL', color: '#4ade80', bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.2)', Icon: ShieldCheck, pulse: false };
}

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export default function CloudflareThreatStatusCard() {
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

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // auto-refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const threats = data?.analytics?.threats || 0;
  const firewallTotal = data?.firewall_events?.reduce((a, e) => a + (e.count || 0), 0) || 0;
  const topEvent = data?.firewall_events?.[0] || null;
  const { level, color, bg, border, Icon, pulse } = getThreatLevel(threats, firewallTotal);

  const activeAlerts = [];
  if (threats >= THRESHOLDS.threats_warn) activeAlerts.push(`${fmt(threats)} threats blocked (24h)`);
  if (firewallTotal >= THRESHOLDS.firewall_warn) activeAlerts.push(`${fmt(firewallTotal)} firewall events (24h)`);
  if (topEvent && topEvent.count >= 10) activeAlerts.push(`Top origin: ${topEvent.country} — ${topEvent.count} events`);

  return (
    <div
      className="rounded-2xl p-5 border transition-all"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Left — threat level badge */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}18`, border: `1.5px solid ${color}40` }}
          >
            <Icon className="w-7 h-7" style={{ color }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: color + 'bb' }}>
                Cloudflare — eds-360.com
              </span>
              {data?.zone_status === 'active' && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className={`w-1.5 h-1.5 rounded-full bg-green-400 ${pulse ? '' : 'animate-pulse'}`} />
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black" style={{ color }}>
                {loading && !data ? '—' : level}
              </p>
              {pulse && !loading && (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ background: color, opacity: 0.7 }}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current threat traffic level
              {lastUpdated && ` · ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        {/* Right — stat pills */}
        {!loading && data?.configured && (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <StatPill label="Threats (24h)" value={fmt(threats)} color={threats >= THRESHOLDS.threats_warn ? '#f87171' : '#4ade80'} />
            <StatPill label="Firewall Events" value={fmt(firewallTotal)} color={firewallTotal >= THRESHOLDS.firewall_warn ? '#fb923c' : '#4ade80'} />
            <StatPill label="Requests" value={fmt(data.analytics.requests_all)} color="#38bdf8" />
            <StatPill label="Zone" value={data.zone_name || 'eds-360.com'} color="#94a3b8" />
          </div>
        )}

        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors self-start sm:self-center"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Active alerts row */}
      {!loading && activeAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2" style={{ borderColor: border }}>
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Activity className="w-3 h-3" /> Active Alerts:
          </span>
          {activeAlerts.map((a, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {/* All clear */}
      {!loading && data?.configured && activeAlerts.length === 0 && (
        <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: border }}>
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-green-400 font-medium">All clear — no active threat alerts</span>
        </div>
      )}

      {loading && !data && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Cloud className="w-3.5 h-3.5 animate-pulse" />
          Connecting to Cloudflare…
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-lg px-3 py-2 text-center" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
      <p className="text-sm font-black tabular-nums" style={{ color }}>{value}</p>
    </div>
  );
}