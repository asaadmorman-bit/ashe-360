import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GraduationCap, BookOpen, Users, Calendar, Award } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import DataTable, { StatusBadge } from '../components/shared/DataTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const CAT_COLORS = {
  cybersecurity: 'bg-red-500/10 text-red-400 border-red-500/20',
  compliance: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  technical: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  leadership: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sales: 'bg-green-500/10 text-green-400 border-green-500/20',
  operations: 'bg-primary/10 text-primary border-primary/20',
};

export default function Training() {
  const { data: classes = [] } = useQuery({
    queryKey: ['training-classes'],
    queryFn: () => base44.entities.TrainingClass.list('-created_date', 50),
    initialData: [],
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['training-registrations'],
    queryFn: () => base44.entities.TrainingRegistration.list('-created_date', 100),
    initialData: [],
  });

  const activeClasses = classes.filter(c => ['upcoming', 'active'].includes(c.status));
  const totalEnrolled = registrations.filter(r => r.registration_status !== 'cancelled').length;
  const completedCount = registrations.filter(r => r.registration_status === 'completed').length;

  const classCols = [
    { key: 'title', label: 'Class' },
    { key: 'category', label: 'Category', render: v => (
      <Badge variant="outline" className={`text-xs capitalize ${CAT_COLORS[v] || ''}`}>{v}</Badge>
    )},
    { key: 'format', label: 'Format', render: v => <span className="capitalize text-sm">{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'instructor', label: 'Instructor', render: v => v || '—' },
    { key: 'start_date', label: 'Start', render: v => v ? format(new Date(v), 'MMM d, yyyy') : '—' },
    { key: 'current_enrollment', label: 'Enrolled', render: (v, row) => `${v || 0}/${row.max_capacity || 30}` },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ];

  const regCols = [
    { key: 'student_name', label: 'Student' },
    { key: 'student_email', label: 'Email', render: v => <span className="text-sm text-muted-foreground">{v}</span> },
    { key: 'company', label: 'Company', render: v => v || '—' },
    { key: 'registration_status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'payment_status', label: 'Payment', render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="Training" subtitle="Class Catalog & Training Operations" icon={GraduationCap} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Classes" value={activeClasses.length} icon={BookOpen} />
        <KPICard label="Total Enrolled" value={totalEnrolled} icon={Users} />
        <KPICard label="Completed" value={completedCount} icon={Award} />
        <KPICard label="Total Classes" value={classes.length} icon={Calendar} />
      </div>

      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="catalog">Class Catalog ({classes.length})</TabsTrigger>
          <TabsTrigger value="registrations">Registrations ({registrations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <DataTable columns={classCols} data={classes} emptyMessage="No training classes" />
        </TabsContent>
        <TabsContent value="registrations">
          <DataTable columns={regCols} data={registrations} emptyMessage="No registrations" />
        </TabsContent>
      </Tabs>
    </div>
  );
}