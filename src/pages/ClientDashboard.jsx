import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, CheckCircle2, Bug } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import DataTable from '../components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';

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

  const incidentCols = [
    { key: 'title', label: 'Title' },
    { key: 'severity', label: 'Severity', render: v => <Badge variant="outline" className={`text-xs ${v === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>{v}</Badge> },
    { key: 'status', label: 'Status', render: v => <Badge variant="outline">{v}</Badge> },
    { key: 'detected_at', label: 'Detected', render: v => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  const ticketCols = [
    { key: 'ticket_number', label: 'Ticket #' },
    { key: 'subject', label: 'Subject' },
    { key: 'priority', label: 'Priority', render: v => <Badge variant="outline">{v}</Badge> },
    { key: 'status', label: 'Status', render: v => <Badge variant="outline">{v}</Badge> },
  ];

  const assetCols = [
    { key: 'hostname', label: 'Hostname' },
    { key: 'asset_type', label: 'Type', render: v => <span className="text-sm">{v?.replace(/_/g, ' ')}</span> },
    { key: 'vulnerability_count', label: 'Vulns' },
    { key: 'critical_count', label: 'Critical', render: v => <span className={`font-bold ${v > 0 ? 'text-red-400' : 'text-green-400'}`}>{v}</span> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader
        title="SOC Dashboard"
        subtitle={`Security posture for ${user?.managed_client || 'Your Organization'}`}
        icon={Shield}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Critical Incidents" value={criticalIncidents} icon={AlertTriangle} />
        <KPICard label="Open Tickets" value={openTickets} icon={CheckCircle2} />
        <KPICard label="Assets" value={assets.length} icon={Shield} />
        <KPICard label="Critical Vulns" value={criticalVulns} icon={Bug} />
      </div>

      <div className="space-y-6">
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Incidents</h2>
          <DataTable columns={incidentCols} data={incidents.slice(0, 10)} emptyMessage="No incidents" />
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Open Service Tickets</h2>
          <DataTable columns={ticketCols} data={tickets.slice(0, 10)} emptyMessage="No open tickets" />
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Scanned Assets</h2>
          <DataTable columns={assetCols} data={assets.slice(0, 10)} emptyMessage="No assets scanned" />
        </div>
      </div>
    </div>
  );
}