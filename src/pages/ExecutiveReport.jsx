import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Printer, Download, Calendar, AlertTriangle, Shield, TrendingUp, Lock, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';

const SEV_COLORS = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
  low:      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  info:     { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' },
};

function PrintHeader() {
  const today = new Date();
  const weekStart = subDays(today, 7);
  return (
    <div className="border-b border-gray-300 pb-6 mb-6 print:pb-4 print:mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 print:text-3xl">Executive Security Report</h1>
          <p className="text-sm text-gray-600 mt-1 print:mt-0.5">Weekly Compliance & Threat Intelligence Summary</p>
        </div>
        <div className="text-right text-xs text-gray-600">
          <p><strong>Report Period:</strong> {format(weekStart, 'MMM d')} — {format(today, 'MMM d, yyyy')}</p>
          <p><strong>Generated:</strong> {format(today, 'MMM d, yyyy h:mm a')}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = 'gray', suffix = '' }) {
  const colors = {
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };
  return (
    <div className={`border rounded-lg p-4 ${colors[color]} print:p-3 print:text-sm`}>
      <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-black mt-2 print:mt-1 print:text-2xl">{value}{suffix}</p>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-3 mt-8 mb-4 pt-6 border-t border-gray-300 print:mt-6 print:mb-3 print:pt-4">
      {Icon && <Icon className="w-5 h-5 text-gray-700 print:w-4 print:h-4" />}
      <h2 className="text-2xl font-bold text-gray-900 print:text-lg">{title}</h2>
    </div>
  );
}

function IncidentRow({ incident }) {
  const sevMap = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' };
  const sev = incident.severity || 'low';
  const color = SEV_COLORS[sev];
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 print:px-2 print:py-2">{incident.title}</td>
      <td className="px-4 py-3 text-sm text-gray-600 print:px-2 print:py-2">{incident.affected_client || '—'}</td>
      <td className="px-4 py-3 text-sm print:px-2 print:py-2">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${color.badge}`}>
          {sev.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 print:px-2 print:py-2">{incident.status || '—'}</td>
    </tr>
  );
}

function VulnRow({ vuln }) {
  const color = SEV_COLORS[vuln.severity] || SEV_COLORS.low;
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
      <td className="px-4 py-3 text-sm font-mono text-gray-900 print:px-2 print:py-2">{vuln.cve_id || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-700 print:px-2 print:py-2">{vuln.title}</td>
      <td className="px-4 py-3 text-sm print:px-2 print:py-2">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${color.badge}`}>
          {vuln.severity?.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 print:px-2 print:py-2">{vuln.status || '—'}</td>
    </tr>
  );
}

function STIGRow({ stig }) {
  const catMap = { CAT_I: 'red', CAT_II: 'orange', CAT_III: 'yellow' };
  const cat = stig.severity || 'CAT_III';
  const color = SEV_COLORS[catMap[cat]] || SEV_COLORS.low;
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
      <td className="px-4 py-3 text-sm font-mono text-gray-900 print:px-2 print:py-2">{stig.stig_id || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-700 print:px-2 print:py-2">{stig.title}</td>
      <td className="px-4 py-3 text-sm print:px-2 print:py-2">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${color.badge}`}>
          {cat}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 print:px-2 print:py-2">{stig.status || '—'}</td>
    </tr>
  );
}

function ThreatFeedRow({ feed }) {
  const color = SEV_COLORS[feed.severity] || SEV_COLORS.info;
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
      <td className="px-4 py-3 text-sm text-gray-700 print:px-2 print:py-2">{feed.title}</td>
      <td className="px-4 py-3 text-sm text-gray-600 print:px-2 print:py-2">{feed.source || '—'}</td>
      <td className="px-4 py-3 text-sm print:px-2 print:py-2">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${color.badge}`}>
          {(feed.severity || 'info').toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 print:px-2 print:py-2">
        {feed.category ? feed.category.replace(/_/g, ' ').toUpperCase() : '—'}
      </td>
    </tr>
  );
}

export default function ExecutiveReport() {
  const [printing, setPrinting] = useState(false);

  // Fetch all data
  const { data: incidents = [] } = useQuery({
    queryKey: ['report-incidents'],
    queryFn: () => base44.asServiceRole.entities.Incident.list('-created_date', 100),
    initialData: [],
  });

  const { data: vulns = [] } = useQuery({
    queryKey: ['report-vulns'],
    queryFn: () => base44.asServiceRole.entities.VulnerabilityFinding.filter({ status: 'open' }, '-severity', 100),
    initialData: [],
  });

  const { data: stigs = [] } = useQuery({
    queryKey: ['report-stigs'],
    queryFn: () => base44.asServiceRole.entities.STIGFinding.filter({ status: 'open' }, '-severity', 100),
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['report-assets'],
    queryFn: () => base44.asServiceRole.entities.ScannedAsset.list('-created_date', 100),
    initialData: [],
  });

  const { data: feeds = [] } = useQuery({
    queryKey: ['report-feeds'],
    queryFn: () => base44.entities.ThreatIntelFeed.list('-published_at', 50),
    initialData: [],
  });

  // Calculate metrics
  const week = subDays(new Date(), 7);
  const newIncidents = incidents.filter(i => i.created_date && new Date(i.created_date) > week);
  const openIncidents = incidents.filter(i => !['resolved', 'closed'].includes(i.status));
  const criticalVulns = vulns.filter(v => v.severity === 'critical');
  const kevVulns = vulns.filter(v => v.is_kev);
  const catIFindings = stigs.filter(s => s.severity === 'CAT_I');
  const avgCompliance = assets.length ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length) : 0;
  const criticalFeeds = feeds.filter(f => f.severity === 'critical');

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => window.print(), 100);
    setTimeout(() => setPrinting(false), 500);
  };

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print toolbar */}
      <div className="sticky top-0 z-50 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
        <div>
          <h3 className="font-bold text-gray-900">Executive Security Report</h3>
          <p className="text-xs text-gray-600 mt-0.5">{format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
            disabled={printing}
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
        <PrintHeader />

        {/* Executive Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:gap-2 print:mb-4">
          <MetricCard label="Open Incidents" value={openIncidents.length} color={openIncidents.length > 0 ? 'red' : 'green'} />
          <MetricCard label="Critical Vulns" value={criticalVulns.length} color={criticalVulns.length > 0 ? 'red' : 'green'} />
          <MetricCard label="CAT I Findings" value={catIFindings.length} color={catIFindings.length > 0 ? 'red' : 'green'} />
          <MetricCard label="Avg Compliance" value={avgCompliance} suffix="%" color={avgCompliance >= 80 ? 'green' : avgCompliance >= 60 ? 'orange' : 'red'} />
        </div>

        {/* Compliance Status */}
        <SectionHeader icon={Shield} title="Compliance Status" />
        <div className="space-y-4 print:space-y-2">
          <p className="text-sm text-gray-700 print:text-xs">
            <strong>{assets.length}</strong> assets scanned · <strong>{avgCompliance}%</strong> average compliance score
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg print:border-gray-300">
            <table className="w-full text-sm print:text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 print:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Asset</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Compliance</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Critical</th>
                </tr>
              </thead>
              <tbody>
                {assets.slice(0, 8).map(a => (
                  <tr key={a.id} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
                    <td className="px-4 py-3 font-medium text-gray-900 print:px-2 print:py-2">{a.hostname}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize print:px-2 print:py-2">{(a.asset_type || '').replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-900 print:px-2 print:py-2">{a.compliance_score || 0}%</td>
                    <td className="px-4 py-3 print:px-2 print:py-2">
                      <span className={a.critical_count > 0 ? 'text-red-700 font-semibold' : 'text-green-700'}>{a.critical_count} items</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incident Status */}
        <SectionHeader icon={AlertTriangle} title="Incident & Threat Status" />
        <div className="space-y-4 print:space-y-2">
          <p className="text-sm text-gray-700 print:text-xs">
            <strong>{openIncidents.length}</strong> open incidents · <strong>{newIncidents.length}</strong> new this week
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg print:border-gray-300">
            <table className="w-full text-sm print:text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 print:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Severity</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 8).map(i => <IncidentRow key={i.id} incident={i} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vulnerabilities */}
        <SectionHeader icon={Bug} title="Vulnerability Status" />
        <div className="space-y-4 print:space-y-2">
          <p className="text-sm text-gray-700 print:text-xs">
            <strong>{vulns.length}</strong> total · <strong>{criticalVulns.length}</strong> critical · <strong>{kevVulns.length}</strong> CISA KEV
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg print:border-gray-300">
            <table className="w-full text-sm print:text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 print:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">CVE</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Severity</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {vulns.slice(0, 8).map(v => <VulnRow key={v.id} vuln={v} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* STIG Findings */}
        <SectionHeader icon={Lock} title="STIG & Compliance Findings" />
        <div className="space-y-4 print:space-y-2">
          <p className="text-sm text-gray-700 print:text-xs">
            <strong>{stigs.length}</strong> total · <strong>{catIFindings.length}</strong> CAT I (High)
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg print:border-gray-300">
            <table className="w-full text-sm print:text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 print:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">STIG ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stigs.slice(0, 8).map(s => <STIGRow key={s.id} stig={s} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Threat Intelligence */}
        <SectionHeader icon={TrendingUp} title="Threat Intelligence Summary" />
        <div className="space-y-4 print:space-y-2">
          <p className="text-sm text-gray-700 print:text-xs">
            <strong>{feeds.length}</strong> alerts · <strong>{criticalFeeds.length}</strong> critical · Most recent 48h window
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg print:border-gray-300">
            <table className="w-full text-sm print:text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 print:bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Source</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Severity</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 print:px-2 print:py-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {feeds.slice(0, 10).map(f => <ThreatFeedRow key={f.id} feed={f} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-600 print:mt-8 print:pt-4">
          <p>This is a confidential security report. Share only with authorized personnel.</p>
          <p className="mt-2">For questions or escalations, contact your SOC team or security officer.</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          * { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:text-3xl { font-size: 1.875rem !important; }
          .print\\:text-lg { font-size: 1.125rem !important; }
          .print\\:text-xs { font-size: 0.75rem !important; }
          .print\\:text-sm { font-size: 0.875rem !important; }
          .print\\:text-2xl { font-size: 1.5rem !important; }
          .print\\:p-3 { padding: 0.75rem !important; }
          .print\\:px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
          .print\\:py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .print\\:pb-4 { padding-bottom: 1rem !important; }
          .print\\:mb-4 { margin-bottom: 1rem !important; }
          .print\\:mt-0.5 { margin-top: 0.125rem !important; }
          .print\\:gap-2 { gap: 0.5rem !important; }
          .print\\:mb-3 { margin-bottom: 0.75rem !important; }
          .print\\:mt-6 { margin-top: 1.5rem !important; }
          .print\\:pt-4 { padding-top: 1rem !important; }
          .print\\:mt-1 { margin-top: 0.25rem !important; }
          .print\\:space-y-2 > * + * { margin-top: 0.5rem !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:bg-gray-50 { background-color: #f9fafb !important; }
          .print\\:hover\\:bg-transparent:hover { background-color: transparent !important; }
          .print\\:mt-8 { margin-top: 2rem !important; }
          .print\\:space-y-4 > * + * { margin-top: 1rem !important; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </div>
  );
}