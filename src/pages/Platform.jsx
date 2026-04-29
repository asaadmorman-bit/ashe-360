import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Server, Building2, MapPin, Rocket, DollarSign } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import DataTable, { StatusBadge } from '../components/shared/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

const TIER_COLORS = {
  bronze: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  silver: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
  gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  platinum: 'bg-primary/10 text-primary border-primary/20',
};

export default function Platform() {
  const { data: clients = [] } = useQuery({
    queryKey: ['managed-clients'],
    queryFn: () => base44.entities.ManagedClient.list('-created_date', 50),
    initialData: [],
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['client-sites'],
    queryFn: () => base44.entities.ClientSite.list('-created_date', 100),
    initialData: [],
  });

  const { data: onboardings = [] } = useQuery({
    queryKey: ['onboardings'],
    queryFn: () => base44.entities.Onboarding.list('-created_date', 30),
    initialData: [],
  });

  const totalMRR = clients.reduce((s, c) => s + (c.mrr || 0), 0);
  const activeClients = clients.filter(c => c.status === 'active');
  const totalEndpoints = clients.reduce((s, c) => s + (c.total_endpoints || 0), 0);

  const clientCols = [
    { key: 'company_name', label: 'Company' },
    { key: 'primary_contact', label: 'Contact', render: v => v || '—' },
    { key: 'contract_type', label: 'Type', render: v => <span className="capitalize text-sm">{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'tier', label: 'Tier', render: v => (
      <Badge variant="outline" className={`text-xs capitalize ${TIER_COLORS[v] || ''}`}>{v}</Badge>
    )},
    { key: 'mrr', label: 'MRR', render: v => v ? `$${v.toLocaleString()}` : '—' },
    { key: 'total_endpoints', label: 'Endpoints', render: v => v || 0 },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ];

  const siteCols = [
    { key: 'site_name', label: 'Site' },
    { key: 'address', label: 'Address', render: v => v || '—' },
    { key: 'site_type', label: 'Type', render: v => <span className="capitalize text-sm">{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'endpoint_count', label: 'Endpoints', render: v => v || 0 },
    { key: 'network_status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ];

  const onboardCols = [
    { key: 'client_name', label: 'Client' },
    { key: 'phase', label: 'Phase', render: v => <StatusBadge status={v} /> },
    { key: 'assigned_pm', label: 'PM', render: v => v || '—' },
    { key: 'progress_pct', label: 'Progress', render: v => (
      <div className="flex items-center gap-2 min-w-[120px]">
        <Progress value={v || 0} className="h-2 flex-1 bg-secondary/50" />
        <span className="text-xs font-mono text-muted-foreground">{v || 0}%</span>
      </div>
    )},
    { key: 'target_completion', label: 'Target', render: v => v ? format(new Date(v), 'MMM d') : '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="Platform" subtitle="MSP Client Management & Operations" icon={Server} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Clients" value={activeClients.length} icon={Building2} />
        <KPICard label="Total MRR" value={`$${totalMRR.toLocaleString()}`} icon={DollarSign} />
        <KPICard label="Client Sites" value={sites.length} icon={MapPin} />
        <KPICard label="Total Endpoints" value={totalEndpoints.toLocaleString()} icon={Server} />
      </div>

      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="clients">Managed Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="sites">Site Inventory ({sites.length})</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding ({onboardings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <DataTable columns={clientCols} data={clients} emptyMessage="No managed clients" />
        </TabsContent>
        <TabsContent value="sites">
          <DataTable columns={siteCols} data={sites} emptyMessage="No sites" />
        </TabsContent>
        <TabsContent value="onboarding">
          <DataTable columns={onboardCols} data={onboardings} emptyMessage="No active onboardings" />
        </TabsContent>
      </Tabs>
    </div>
  );
}