import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, ShieldCheck, Bug, MonitorSmartphone, AlertOctagon, Award, Sparkles } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import DataTable, { SeverityBadge, StatusBadge } from '../components/shared/DataTable';
import SectionPanel from '../components/shared/SectionPanel';
import IncidentTrendsChart from '../components/eye/IncidentTrendsChart';
import IncidentSummaryModal from '../components/eye/IncidentSummaryModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function ComplianceGauge({ label, score, maxScore = 100 }) {
  const pct = Math.round((score / maxScore) * 100);
  const color = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="glass-panel rounded-xl p-5 space-y-3">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{pct}%</p>
      <Progress value={pct} className="h-2 bg-secondary/50" />
    </div>
  );
}

export default function EyeOfEDS() {
  const [summaryIncident, setSummaryIncident] = useState(null);

  const { data: stigs = [] } = useQuery({
    queryKey: ['stigs'],
    queryFn: () => base44.entities.STIGFinding.list('-created_date', 100),
    initialData: [],
  });

  const { data: vulns = [] } = useQuery({
    queryKey: ['vulns'],
    queryFn: () => base44.entities.VulnerabilityFinding.list('-created_date', 100),
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['scanned-assets'],
    queryFn: () => base44.entities.ScannedAsset.list('-created_date', 100),
    initialData: [],
  });

  const { data: agentActions = [] } = useQuery({
    queryKey: ['agent-actions'],
    queryFn: () => base44.entities.AgentAction.list('-created_date', 500),
    initialData: [],
  });

  const openStigs = stigs.filter(s => s.status === 'open');
  const openVulns = vulns.filter(v => v.status === 'open');
  const critVulns = vulns.filter(v => v.severity === 'critical' && v.status === 'open');
  const kevCount = vulns.filter(v => v.is_kev).length;

  const avgCompliance = assets.length > 0
    ? Math.round(assets.reduce((acc, a) => acc + (a.compliance_score || 0), 0) / assets.length)
    : 0;

  const stigCols = [
    { key: 'stig_id', label: 'STIG ID', render: v => <span className="font-mono text-primary text-sm">{v}</span> },
    { key: 'title', label: 'Title' },
    { key: 'severity', label: 'Severity', render: v => <SeverityBadge severity={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'asset_hostname', label: 'Asset', render: v => v || '—' },
  ];

  const vulnCols = [
    { key: 'cve_id', label: 'CVE', render: v => <span className="font-mono text-primary text-sm">{v || '—'}</span> },
    { key: 'title', label: 'Title' },
    { key: 'severity', label: 'Severity', render: v => <SeverityBadge severity={v} /> },
    { key: 'cvss_score', label: 'CVSS', render: v => <span className="font-mono">{v || '—'}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'is_kev', label: 'KEV', render: v => v ? <span className="text-red-400 font-semibold text-xs">KEV</span> : '—' },
  ];

  const assetCols = [
    { key: 'hostname', label: 'Hostname', render: v => <span className="font-mono">{v}</span> },
    { key: 'ip_address', label: 'IP', render: v => <span className="font-mono text-sm">{v || '—'}</span> },
    { key: 'os', label: 'OS', render: v => v || '—' },
    { key: 'vulnerability_count', label: 'Vulns', render: v => v || 0 },
    { key: 'critical_count', label: 'Critical', render: (v) => v > 0 ? <span className="text-red-400 font-semibold">{v}</span> : '0' },
    { key: 'compliance_score', label: 'Compliance', render: v => <span className="font-mono">{v || 0}%</span> },
  ];

  const stigColsWithSummary = [
    ...stigCols,
    { key: 'actions', label: '', render: (_, row) => (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setSummaryIncident(row)}
        className="gap-1"
      >
        <Sparkles className="w-3 h-3" />
        <span className="text-xs">Summary</span>
      </Button>
    )},
  ];

  const vulnColsWithSummary = [
    ...vulnCols,
    { key: 'actions', label: '', render: (_, row) => (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setSummaryIncident(row)}
        className="gap-1"
      >
        <Sparkles className="w-3 h-3" />
        <span className="text-xs">Summary</span>
      </Button>
    )},
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="Eye of EDS" subtitle="Threat Intelligence & Compliance Operations" icon={Eye} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Open STIGs" value={openStigs.length} icon={ShieldCheck} />
        <KPICard label="Open Vulns" value={openVulns.length} icon={Bug} />
        <KPICard label="Critical Vulns" value={critVulns.length} icon={AlertOctagon} />
        <KPICard label="Scanned Assets" value={assets.length} icon={MonitorSmartphone} />
        <KPICard label="CISA KEV Hits" value={kevCount} icon={AlertOctagon} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <ComplianceGauge label="Average Compliance Score" score={avgCompliance} />
        <ComplianceGauge label="NIST 800-171 (Est.)" score={avgCompliance > 0 ? Math.min(avgCompliance + 5, 100) : 0} />
        <ComplianceGauge label="CMMC L2 (Est.)" score={avgCompliance > 0 ? Math.max(avgCompliance - 8, 0) : 0} />
      </div>

      <IncidentTrendsChart agentActions={agentActions} />

      <Tabs defaultValue="stigs" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="stigs">STIG Findings ({stigs.length})</TabsTrigger>
          <TabsTrigger value="vulns">Vulnerabilities ({vulns.length})</TabsTrigger>
          <TabsTrigger value="assets">Scanned Assets ({assets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="stigs">
          <DataTable columns={stigColsWithSummary} data={stigs} emptyMessage="No STIG findings" />
        </TabsContent>
        <TabsContent value="vulns">
          <DataTable columns={vulnColsWithSummary} data={vulns} emptyMessage="No vulnerability findings" />
        </TabsContent>
        <TabsContent value="assets">
          <DataTable columns={assetCols} data={assets} emptyMessage="No scanned assets" />
        </TabsContent>
      </Tabs>

      <IncidentSummaryModal
        open={!!summaryIncident}
        onOpenChange={(open) => !open && setSummaryIncident(null)}
        incident={summaryIncident}
      />
    </div>
  );
}