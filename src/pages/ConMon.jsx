import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, Ticket, MapPin, Search, Archive } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import SectionPanel from '../components/shared/SectionPanel';
import DataTable, { SeverityBadge, StatusBadge } from '../components/shared/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function ConMon() {
  const [iocSearch, setIocSearch] = useState('');

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date', 50),
    initialData: [],
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 50),
    initialData: [],
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.ClientSite.list('-created_date', 50),
    initialData: [],
  });

  const { data: bcmQueue = [] } = useQuery({
    queryKey: ['bcm-queue'],
    queryFn: () => base44.entities.BCMQueue.list('-created_date', 30),
    initialData: [],
  });

  const openIncidents = incidents.filter(i => ['open', 'investigating', 'mitigating'].includes(i.status));
  const openTickets = tickets.filter(t => ['new', 'open', 'in_progress'].includes(t.status));

  const incidentCols = [
    { key: 'title', label: 'Incident' },
    { key: 'severity', label: 'Severity', render: v => <SeverityBadge severity={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'affected_client', label: 'Client', render: v => v || '—' },
    { key: 'created_date', label: 'Detected', render: v => v ? format(new Date(v), 'MMM d, h:mm a') : '—' },
  ];

  const ticketCols = [
    { key: 'ticket_number', label: '#', render: v => <span className="font-mono text-primary">{v || '—'}</span> },
    { key: 'subject', label: 'Subject' },
    { key: 'priority', label: 'Priority', render: v => <SeverityBadge severity={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'client_name', label: 'Client', render: v => v || '—' },
  ];

  const siteCols = [
    { key: 'site_name', label: 'Site' },
    { key: 'site_type', label: 'Type', render: v => <span className="capitalize">{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'network_status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'endpoint_count', label: 'Endpoints', render: v => v || 0 },
  ];

  const bcmCols = [
    { key: 'title', label: 'Task' },
    { key: 'priority', label: 'Priority', render: v => <SeverityBadge severity={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'client_name', label: 'Client', render: v => v || '—' },
    { key: 'due_date', label: 'Due', render: v => v ? format(new Date(v), 'MMM d') : '—' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="ConMon" subtitle="Continuous Monitoring — Network & Security Operations" icon={Shield} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Open Incidents" value={openIncidents.length} icon={AlertTriangle} />
        <KPICard label="Open Tickets" value={openTickets.length} icon={Ticket} />
        <KPICard label="Client Sites" value={sites.length} icon={MapPin} />
        <KPICard label="BCM Queue" value={bcmQueue.filter(b => b.status !== 'completed').length} icon={Archive} />
      </div>

      <Tabs defaultValue="incidents" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="incidents">Incidents ({incidents.length})</TabsTrigger>
          <TabsTrigger value="tickets">Service Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="sites">Client Sites ({sites.length})</TabsTrigger>
          <TabsTrigger value="ioc">IOC Scanner</TabsTrigger>
          <TabsTrigger value="bcm">BCM Queue ({bcmQueue.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents">
          <DataTable columns={incidentCols} data={incidents} emptyMessage="No incidents recorded" />
        </TabsContent>

        <TabsContent value="tickets">
          <DataTable columns={ticketCols} data={tickets} emptyMessage="No service tickets" />
        </TabsContent>

        <TabsContent value="sites">
          <DataTable columns={siteCols} data={sites} emptyMessage="No client sites" />
        </TabsContent>

        <TabsContent value="ioc">
          <SectionPanel title="IOC Scanner" icon={Search}>
            <div className="space-y-4">
              <Input
                placeholder="Enter IP, domain, hash, or URL to scan..."
                value={iocSearch}
                onChange={e => setIocSearch(e.target.value)}
                className="bg-secondary/50 border-border/50 text-lg h-12"
              />
              <p className="text-muted-foreground text-sm">
                Enter an indicator of compromise to check against threat intelligence feeds.
                Connect external threat intel APIs for live scanning.
              </p>
            </div>
          </SectionPanel>
        </TabsContent>

        <TabsContent value="bcm">
          <DataTable columns={bcmCols} data={bcmQueue} emptyMessage="BCM queue is empty" />
        </TabsContent>
      </Tabs>
    </div>
  );
}