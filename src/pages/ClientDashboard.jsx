import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, CheckCircle2, Bug, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import CloudflarePanel from '../components/dashboard/CloudflarePanel';
import CloudflareAlertHistory from '../components/dashboard/CloudflareAlertHistory';
import ThreatIntelWidget from '../components/dashboard/ThreatIntelWidget';
import { ShieldAlert } from 'lucide-react';


function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <p className="text-2xl font-mono font-bold text-primary tabular-nums">{time.toLocaleTimeString('en-US', { hour12: false })}</p>
      <p className="text-xs text-muted-foreground">{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'primary', pulse }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };
  const iconColor = {
    primary: 'text-primary', red: 'text-red-400', yellow: 'text-yellow-400', green: 'text-green-400', blue: 'text-blue-400',
  };
  return (
    <div className={`relative rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${colorMap[color]}`}>
      {pulse && value > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className={`w-5 h-5 ${iconColor[color]}`} />
      </div>
      <p className={`text-3xl font-black tabular-nums ${iconColor[color]}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
}

function SeverityBadge({ v }) {
  const cls = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }[v] || 'bg-muted text-muted-foreground border-border';
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${cls} uppercase`}>{v}</span>;
}

function StatusBadge({ v }) {
  const cls = {
    resolved: 'bg-green-500/15 text-green-400 border-green-500/30',
    closed: 'bg-green-500/15 text-green-400 border-green-500/30',
    open: 'bg-red-500/15 text-red-400 border-red-500/30',
    new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    in_progress: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    investigating: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  }[v] || 'bg-muted text-muted-foreground border-border';
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>{v?.replace(/_/g, ' ')}</span>;
}

function Panel({ title, icon: Icon, children, accent = 'primary' }) {
  const accents = { primary: 'border-primary/20', red: 'border-red-500/20', blue: 'border-blue-500/20' };
  return (
    <div className={`rounded-2xl border bg-card/60 backdrop-blur-xl overflow-hidden ${accents[accent]}`}>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <h3 className="font-bold text-sm text-foreground">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function IncidentRow({ item }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.detected_at ? new Date(item.detected_at).toLocaleDateString() : '—'}</p>
      </div>
      <SeverityBadge v={item.severity} />
      <StatusBadge v={item.status} />
    </div>
  );
}

function TicketRow({ item }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{item.ticket_number || '—'}</span>
      <p className="text-sm font-medium text-foreground flex-1 truncate">{item.subject}</p>
      <SeverityBadge v={item.priority} />
      <StatusBadge v={item.status} />
    </div>
  );
}

function AssetRow({ item }) {
  const compliance = item.compliance_score || 0;
  const bar = compliance >= 80 ? 'bg-green-400' : compliance >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{item.hostname}</p>
        <p className="text-xs text-muted-foreground capitalize">{item.asset_type?.replace(/_/g, ' ')}</p>
      </div>
      <div className="w-24">
        <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Compliance</span><span>{compliance}%</span></div>
        <div className="h-1.5 rounded-full bg-border/40"><div className={`h-full rounded-full ${bar}`} style={{ width: `${compliance}%` }} /></div>
      </div>
      <span className={`text-sm font-bold tabular-nums ${item.critical_count > 0 ? 'text-red-400' : 'text-green-400'}`}>{item.critical_count} crit</span>
    </div>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-user'],
    queryFn: () => base44.entities.Incident.filter({ affected_client: user?.managed_client }, '-created_date', 50),
    initialData: [],
    enabled: !!user?.managed_client,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets-user'],
    queryFn: () => base44.entities.ServiceTicket.filter({ client_name: user?.managed_client }, '-created_date', 50),
    initialData: [],
    enabled: !!user?.managed_client,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets-user'],
    queryFn: () => base44.entities.ScannedAsset.filter({ client_name: user?.managed_client }, '-last_scan_date', 50),
    initialData: [],
    enabled: !!user?.managed_client,
  });

  const { data: vulnerabilities = [] } = useQuery({
    queryKey: ['vulns-user'],
    queryFn: () => base44.entities.VulnerabilityFinding.filter({ client_name: user?.managed_client, severity: 'critical' }, '-discovered_at', 20),
    initialData: [],
    enabled: !!user?.managed_client,
  });

  const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
  const openTickets = tickets.filter(t => ['new', 'open', 'in_progress'].includes(t.status)).length;
  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
  const avgCompliance = assets.length ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length) : 0;

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-blue-500/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(172,100%,45%) 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">SOC Dashboard</h1>
            <p className="text-muted-foreground text-sm">{user?.managed_client || 'Your Organization'} · Security Operations Center</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">All Systems Monitored</span>
            </div>
          </div>
        </div>
        <div className="relative"><LiveClock /></div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Critical Incidents" value={criticalIncidents} icon={AlertTriangle} color="red" pulse />
        <StatCard label="Open Tickets" value={openTickets} icon={Activity} color={openTickets > 5 ? 'yellow' : 'green'} />
        <StatCard label="Scanned Assets" value={assets.length} icon={Shield} color="blue" />
        <StatCard label="Critical Vulns" value={criticalVulns} icon={Bug} color="red" pulse />
      </div>

      {/* Compliance Bar */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Avg. Compliance Score</span>
        </div>
        <div className="flex-1 h-3 rounded-full bg-border/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${avgCompliance >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : avgCompliance >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
            style={{ width: `${avgCompliance}%` }}
          />
        </div>
        <span className={`text-2xl font-black tabular-nums shrink-0 ${avgCompliance >= 80 ? 'text-green-400' : avgCompliance >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{avgCompliance}%</span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: Incidents + Tickets */}
        <div className="xl:col-span-2 space-y-6">
          <Panel title="Recent Incidents" icon={AlertTriangle} accent="red">
            {incidents.length === 0
              ? <p className="text-muted-foreground text-sm text-center py-6">No incidents recorded</p>
              : incidents.slice(0, 8).map(i => <IncidentRow key={i.id} item={i} />)
            }
          </Panel>

          <Panel title="Open Service Tickets" icon={Activity}>
            {tickets.length === 0
              ? <p className="text-muted-foreground text-sm text-center py-6">No open tickets</p>
              : tickets.slice(0, 8).map(i => <TicketRow key={i.id} item={i} />)
            }
          </Panel>
        </div>

        {/* Right: Assets + Cloudflare */}
        <div className="space-y-6">
          <Panel title="Scanned Assets" icon={Shield} accent="blue">
            {assets.length === 0
              ? <p className="text-muted-foreground text-sm text-center py-6">No assets scanned</p>
              : assets.slice(0, 6).map(i => <AssetRow key={i.id} item={i} />)
            }
          </Panel>

          <CloudflarePanel />
        </div>
      </div>

      {/* Threat Intel + Cloudflare Alert History */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ThreatIntelWidget />
        <Panel title="Cloudflare Alert History" icon={ShieldAlert} accent="red">
          <CloudflareAlertHistory />
        </Panel>
      </div>

    </div>
  );
}