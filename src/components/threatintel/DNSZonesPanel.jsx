import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, Shield, Lock, RefreshCw, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

export default function DNSZonesPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getCloudflareZones', {});
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="glass-panel rounded-xl p-6 flex items-center justify-center h-40">
      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
    </div>
  );

  if (!data?.configured) return (
    <div className="glass-panel rounded-xl p-6 text-center text-muted-foreground">Cloudflare not configured</div>
  );

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Cloudflare DNS Zones</h3>
        <span className="ml-auto text-xs text-muted-foreground">{data.total_zones} zones · {data.total_subdomains} subdomains</span>
        <button onClick={load} className="text-muted-foreground hover:text-primary ml-2">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Coverage summary */}
      <div className="grid grid-cols-3 gap-px bg-border/30 border-b border-border/30">
        {[
          { label: 'Total Zones', value: data.total_zones, icon: Globe, color: 'text-primary' },
          { label: 'SSL Active', value: data.zones?.filter(z => z.ssl_active).length, icon: Lock, color: 'text-green-400' },
          { label: 'Total Subdomains', value: data.total_subdomains, icon: Shield, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-card/40 px-4 py-3 flex items-center gap-3">
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
        {data.zones?.map((zone, i) => (
          <div key={zone.id} className="rounded-lg border border-border/30 bg-secondary/10 overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/20 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              {/* Status dot */}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${zone.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="font-mono text-sm font-semibold text-foreground flex-1">{zone.name}</span>
              {/* Badges */}
              <span className={`text-xs px-1.5 py-0.5 rounded border ${zone.ssl_active ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                {zone.ssl_active ? 'SSL ✓' : 'SSL ✗'}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded border ${zone.dnssec_enabled ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-muted-foreground border-border/50 bg-secondary/30'}`}>
                {zone.dnssec_enabled ? 'DNSSEC ✓' : 'DNSSEC'}
              </span>
              <span className="text-xs text-muted-foreground">{zone.proxied_records} proxied</span>
              {expanded === i ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>

            {expanded === i && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: 'Plan', value: zone.plan },
                    { label: 'SSL Mode', value: zone.ssl_mode || 'flexible' },
                    { label: 'DNS Records', value: zone.total_dns_records },
                    { label: 'Cert Packs', value: zone.cert_count },
                    { label: 'A Records', value: zone.a_records },
                    { label: 'MX Records', value: zone.mx_records },
                    { label: 'TXT Records', value: zone.txt_records },
                    { label: 'Proxied', value: zone.proxied_records },
                  ].map(f => (
                    <div key={f.label} className="bg-secondary/20 rounded px-2 py-1.5">
                      <p className="text-muted-foreground">{f.label}</p>
                      <p className="font-mono font-bold text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>
                {zone.subdomains?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-semibold">Monitored Subdomains</p>
                    <div className="flex flex-wrap gap-1">
                      {zone.subdomains.map(s => (
                        <span key={s} className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {!zone.ssl_active && (
                  <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    SSL certificate not active — SOCaaS coverage may be incomplete
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}