import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, ShieldCheck, Bug, MonitorSmartphone, AlertOctagon, Award, Sparkles, Cloud, FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import CloudflareEyePanel from '../components/eye/CloudflareEyePanel';
import CloudflareThreatStatusCard from '../components/eye/CloudflareThreatStatusCard';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import DataTable, { SeverityBadge, StatusBadge } from '../components/shared/DataTable';
import SectionPanel from '../components/shared/SectionPanel';
import IncidentTrendsChart from '../components/eye/IncidentTrendsChart';
import IncidentSummaryModal from '../components/eye/IncidentSummaryModal';
import CloudflareTrafficChart from '../components/eye/CloudflareTrafficChart';
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

function fmtN(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
function fmtBytes(b) {
  if (!b) return '0 B';
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB';
  if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB';
  return b + ' B';
}

export default function EyeOfEDS() {
  const [summaryIncident, setSummaryIncident] = useState(null);
  const [exporting, setExporting] = useState(false);

  const exportThreatReport = async () => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke('getCloudflareMetrics', {});
      const cf = res.data;
      const analytics = cf?.analytics || {};
      const firewall = cf?.firewall_events || [];
      const firewallTotal = firewall.reduce((a, e) => a + (e.count || 0), 0);
      const threats = analytics.threats || 0;
      const threatLevel = threats >= 50 || firewallTotal >= 100 ? 'CRITICAL'
        : threats >= 10 || firewallTotal >= 20 ? 'ELEVATED' : 'NOMINAL';

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const now = new Date();

      // ── Header band ──────────────────────────────────────────────
      doc.setFillColor(7, 21, 32);
      doc.rect(0, 0, W, 38, 'F');

      doc.setTextColor(0, 229, 200);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EDS-360 — Eye of EDS', 14, 16);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Cloudflare Threat Intelligence Report — Executive Review', 14, 23);
      doc.text(`Generated: ${now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}`, 14, 29);
      doc.text(`Zone: ${cf?.zone_name || 'eds-360.com'}  ·  Status: ${cf?.zone_status || '—'}`, 14, 35);

      // ── Threat level badge ───────────────────────────────────────
      let badgeColor = [74, 222, 128];
      if (threatLevel === 'CRITICAL') badgeColor = [248, 113, 113];
      else if (threatLevel === 'ELEVATED') badgeColor = [251, 146, 60];

      doc.setFillColor(...badgeColor);
      doc.roundedRect(W - 52, 10, 38, 14, 3, 3, 'F');
      doc.setTextColor(7, 21, 32);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(threatLevel, W - 33, 19, { align: 'center' });

      let y = 50;

      // ── Section: 24h Metrics ─────────────────────────────────────
      doc.setTextColor(0, 229, 200);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('24-Hour Traffic Metrics', 14, y);
      y += 6;

      const metrics = [
        ['Total Requests', fmtN(analytics.requests_all)],
        ['Cached Requests', fmtN(analytics.requests_cached)],
        ['Threats Blocked', fmtN(threats)],
        ['Page Views', fmtN(analytics.pageviews)],
        ['Unique Visitors', fmtN(analytics.uniques)],
        ['Bandwidth', fmtBytes(analytics.bandwidth_all)],
        ['Total Firewall Events', fmtN(firewallTotal)],
      ];

      metrics.forEach(([label, value], i) => {
        const rowY = y + i * 9;
        doc.setFillColor(i % 2 === 0 ? 15 : 12, i % 2 === 0 ? 30 : 25, i % 2 === 0 ? 46 : 38);
        doc.rect(14, rowY - 5, W - 28, 9, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(label, 18, rowY);
        doc.setTextColor(226, 232, 240);
        doc.setFont('helvetica', 'bold');
        doc.text(value, W - 18, rowY, { align: 'right' });
      });

      y += metrics.length * 9 + 10;

      // ── Section: Firewall Events ─────────────────────────────────
      doc.setTextColor(0, 229, 200);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Firewall Events by Origin (Top 10)', 14, y);
      y += 6;

      if (firewall.length === 0) {
        doc.setTextColor(74, 222, 128);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('✓ No firewall events detected in the last 24 hours.', 18, y + 4);
        y += 14;
      } else {
        // Table header
        doc.setFillColor(0, 50, 60);
        doc.rect(14, y - 4, W - 28, 8, 'F');
        doc.setTextColor(0, 229, 200);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Country', 18, y);
        doc.text('Events', 90, y);
        doc.text('Action', 120, y);
        doc.text('Source / Rule', 155, y);
        y += 6;

        firewall.slice(0, 10).forEach((e, i) => {
          const rowY = y + i * 8;
          doc.setFillColor(i % 2 === 0 ? 12 : 9, i % 2 === 0 ? 25 : 20, i % 2 === 0 ? 38 : 30);
          doc.rect(14, rowY - 4, W - 28, 8, 'F');
          doc.setTextColor(203, 213, 225);
          doc.setFont('helvetica', 'normal');
          doc.text(e.country || '—', 18, rowY);
          doc.setTextColor(248, 113, 113);
          doc.setFont('helvetica', 'bold');
          doc.text(String(e.count || 0), 90, rowY);
          doc.setTextColor(251, 146, 60);
          doc.setFont('helvetica', 'normal');
          doc.text(e.action || '—', 120, rowY);
          doc.setTextColor(100, 116, 139);
          doc.text((e.rule_id || '—').slice(0, 24), 155, rowY);
        });
        y += firewall.slice(0, 10).length * 8 + 10;
      }

      // ── Section: Internal Security KPIs ─────────────────────────
      doc.setTextColor(0, 229, 200);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Internal Security Posture', 14, y);
      y += 6;

      const kpis = [
        ['Open STIG Findings', openStigs.length],
        ['Open Vulnerabilities', openVulns.length],
        ['Critical Vulnerabilities', critVulns.length],
        ['CISA KEV Hits', kevCount],
        ['Scanned Assets', assets.length],
        ['Average Compliance Score', avgCompliance + '%'],
      ];

      kpis.forEach(([label, value], i) => {
        const rowY = y + i * 9;
        doc.setFillColor(i % 2 === 0 ? 15 : 12, i % 2 === 0 ? 30 : 25, i % 2 === 0 ? 46 : 38);
        doc.rect(14, rowY - 5, W - 28, 9, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(label, 18, rowY);
        doc.setTextColor(226, 232, 240);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value), W - 18, rowY, { align: 'right' });
      });

      y += kpis.length * 9 + 14;

      // ── Footer ───────────────────────────────────────────────────
      doc.setFillColor(7, 21, 32);
      doc.rect(0, 280, W, 17, 'F');
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Emerging Defense Solutions  ·  cyber.eds-360.com  ·  CONFIDENTIAL — FOR EXECUTIVE REVIEW ONLY', W / 2, 289, { align: 'center' });

      const filename = `EDS-ThreatReport-${now.toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } finally {
      setExporting(false);
    }
  };

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
      <PageHeader
        title="Eye of EDS"
        subtitle="Threat Intelligence & Compliance Operations"
        icon={Eye}
        actions={
          <Button onClick={exportThreatReport} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {exporting ? 'Generating…' : 'Export Threat Report'}
          </Button>
        }
      />

      <CloudflareThreatStatusCard />

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

      {/* Cloudflare Live Threat Panel */}
      <SectionPanel title="Cloudflare Network Defense — Live Metrics" icon={Cloud}>
        <CloudflareEyePanel />
      </SectionPanel>

      {/* Live Traffic & Threat Map */}
      <SectionPanel title="Live Traffic & Threat Intelligence" icon={Cloud}>
        <CloudflareTrafficChart />
      </SectionPanel>

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