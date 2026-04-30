import React, { useState } from 'react';
import { Globe, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function DNSHealthPanel({ dnsSummary, zone }) {
  const [showRecords, setShowRecords] = useState(false);

  if (!dnsSummary) return null;

  const proxiedPct = dnsSummary.total > 0 ? Math.round((dnsSummary.proxied / dnsSummary.total) * 100) : 0;
  const typeEntries = Object.entries(dnsSummary.types || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">DNS & SSL Coverage</h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${zone?.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
          {zone?.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Zone info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{zone?.name || '—'}</p>
            <p className="text-xs text-muted-foreground">{zone?.plan || 'Cloudflare Protected'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">SSL/TLS</p>
            <p className="text-xs font-bold text-green-400">ACTIVE</p>
          </div>
        </div>

        {/* Proxied coverage */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Cloudflare-Proxied Records</span>
            <span className="font-bold text-primary">{dnsSummary.proxied}/{dnsSummary.total} ({proxiedPct}%)</span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${proxiedPct}%` }} />
          </div>
          {proxiedPct < 80 && (
            <p className="text-xs text-yellow-400 mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {100 - proxiedPct}% of records are unproxied — reduced Cloudflare coverage
            </p>
          )}
        </div>

        {/* Record type breakdown */}
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Record Types</p>
          <div className="grid grid-cols-3 gap-2">
            {typeEntries.map(([type, count]) => (
              <div key={type} className="bg-secondary/30 rounded-lg p-2 text-center">
                <p className="text-lg font-bold font-mono text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subdomains monitored */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Monitored Hostnames</p>
            <button onClick={() => setShowRecords(!showRecords)} className="text-xs text-primary hover:underline">
              {showRecords ? 'Hide' : `Show all ${dnsSummary.subdomains?.length || 0}`}
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {(showRecords ? dnsSummary.records : dnsSummary.records?.slice(0, 6) || []).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-border/20 last:border-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.proxied ? 'bg-primary' : 'bg-muted-foreground'}`} />
                <span className="font-mono text-foreground flex-1 truncate">{r.name}</span>
                <span className="text-muted-foreground w-8 text-center">{r.type}</span>
                {r.proxied && <span className="text-primary text-xs">🛡</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}