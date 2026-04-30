import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Shield, AlertTriangle, CheckCircle2, Globe, Server, Calendar, Users, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = {
  1: 'DNS Compromise', 2: 'DNS Poisoning', 3: 'Fraud Orders', 4: 'DDoS Attack',
  5: 'FTP Brute-Force', 6: 'Ping of Death', 7: 'Phishing', 8: 'Fraud VoIP',
  9: 'Open Proxy', 10: 'Web Spam', 11: 'Email Spam', 12: 'Blog Spam',
  13: 'VPN IP', 14: 'Port Scan', 15: 'Hacking', 16: 'SQL Injection',
  17: 'Spoofing', 18: 'Brute-Force', 19: 'Bad Web Bot', 20: 'Exploited Host',
  21: 'Web App Attack', 22: 'SSH', 23: 'IoT Targeted',
};

function ScoreMeter({ score }) {
  const color = score >= 80 ? 'text-red-400' : score >= 50 ? 'text-orange-400' : score >= 20 ? 'text-yellow-400' : 'text-green-400';
  const barColor = score >= 80 ? 'bg-red-500' : score >= 50 ? 'bg-orange-500' : score >= 20 ? 'bg-yellow-500' : 'bg-green-500';
  const label = score >= 80 ? 'HIGH RISK' : score >= 50 ? 'SUSPICIOUS' : score >= 20 ? 'LOW RISK' : 'CLEAN';
  const labelColor = score >= 80 ? 'bg-red-500/10 text-red-400 border-red-500/20' : score >= 50 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : score >= 20 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-5xl font-black tabular-nums ${color}`}>{score}%</div>
      <Badge variant="outline" className={`text-xs font-bold ${labelColor}`}>{label}</Badge>
      <div className="w-full h-2 rounded-full bg-border/40 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">Abuse Confidence Score</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="text-xs text-foreground font-medium">{value}</span>
    </div>
  );
}

export default function AbuseIPDBPanel() {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  const handleCheck = async () => {
    if (!ip.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setReports(null);
    setShowReports(false);
    const res = await base44.functions.invoke('abuseIPDBLookup', { ip: ip.trim(), action: 'check' });
    setLoading(false);
    if (res.data?.success) {
      setResult(res.data.data);
    } else {
      setError(res.data?.error || 'Lookup failed');
    }
  };

  const handleLoadReports = async () => {
    setReportsLoading(true);
    const res = await base44.functions.invoke('abuseIPDBLookup', { ip: ip.trim(), action: 'reports' });
    setReportsLoading(false);
    if (res.data?.success) {
      setReports(res.data.data?.reports || []);
      setShowReports(true);
    }
  };

  const d = result;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter IP address (e.g. 1.2.3.4)"
            value={ip}
            onChange={e => setIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            className="pl-9 bg-secondary/30 border-border/50 font-mono"
          />
        </div>
        <Button onClick={handleCheck} disabled={loading || !ip.trim()} className="gap-2 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {loading ? 'Checking…' : 'Check IP'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {d && (
        <div className="space-y-4">
          {/* Score + verdict */}
          <div className="rounded-xl border border-border/40 bg-card/60 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <ScoreMeter score={d.abuseConfidenceScore} />
              <div className="space-y-1">
                <InfoRow icon={Globe} label="Country" value={d.countryCode} />
                <InfoRow icon={Server} label="ISP" value={d.isp} />
                <InfoRow icon={Server} label="Domain" value={d.domain} />
                <InfoRow icon={Users} label="Total Reports" value={d.totalReports?.toLocaleString()} />
                <InfoRow icon={Users} label="Distinct Users" value={d.numDistinctUsers?.toLocaleString()} />
                <InfoRow icon={Calendar} label="Last Reported" value={d.lastReportedAt ? new Date(d.lastReportedAt).toLocaleDateString() : null} />
                <InfoRow icon={Shield} label="Usage Type" value={d.usageType} />
                <InfoRow icon={Shield} label="Whitelisted" value={d.isWhitelisted ? 'Yes' : 'No'} />
                <InfoRow icon={Globe} label="Tor Node" value={d.isTor ? 'Yes' : 'No'} />
              </div>
            </div>
          </div>

          {/* Abuse categories */}
          {d.reports?.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-card/60 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Reported Categories</p>
              <div className="flex flex-wrap gap-2">
                {[...new Set(d.reports.flatMap(r => r.categories || []))].map(cat => (
                  <Badge key={cat} variant="outline" className="text-xs bg-secondary/50 border-border/50">
                    {CATEGORIES[cat] || `Category ${cat}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Load full reports */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadReports}
            disabled={reportsLoading}
            className="gap-2 text-xs"
          >
            {reportsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            {reportsLoading ? 'Loading reports…' : 'Load Abuse Reports (Premium)'}
          </Button>

          {/* Report list */}
          {showReports && reports && (
            <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-3 max-h-72 overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{reports.length} Recent Reports</p>
              {reports.length === 0 ? (
                <p className="text-xs text-muted-foreground">No detailed reports available.</p>
              ) : reports.map((r, i) => (
                <div key={i} className="text-xs space-y-1 pb-3 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground">{new Date(r.reportedAt).toLocaleDateString()}</span>
                    {(r.categories || []).map(c => (
                      <Badge key={c} variant="outline" className="text-xs py-0">{CATEGORIES[c] || c}</Badge>
                    ))}
                  </div>
                  {r.comment && <p className="text-muted-foreground font-mono text-xs leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}