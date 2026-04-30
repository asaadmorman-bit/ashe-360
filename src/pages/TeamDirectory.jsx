import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Users, Mail, Phone, Search, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/shared/PageHeader';
import TeamMemberCard from '../components/directory/TeamMemberCard';
import MyStatusBar from '../components/directory/MyStatusBar';

const DEPARTMENTS = [
  { key: 'management',       label: 'Management' },
  { key: 'soc',              label: 'SOC' },
  { key: 'incident_response',label: 'Incident Response' },
  { key: 'threat_intel',     label: 'Threat Intelligence' },
  { key: 'noc',              label: 'NOC' },
  { key: 'compliance',       label: 'Compliance' },
  { key: 'engineering',      label: 'Engineering' },
  { key: 'it',               label: 'IT Support' },
  { key: 'client',           label: 'Client Contacts' },
];

export default function TeamDirectory() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['team-directory'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-directory'] }),
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.title?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    );
  });

  // Group by department; ungrouped goes to "Other"
  const grouped = DEPARTMENTS.map(dept => ({
    ...dept,
    members: filtered.filter(u => u.department === dept.key),
  })).filter(g => g.members.length > 0);

  const ungrouped = filtered.filter(u => !u.department);
  if (ungrouped.length > 0) grouped.push({ key: 'other', label: 'Other', members: ungrouped });

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Team Directory"
        subtitle="Staff roster, roles, and current availability"
        icon={Users}
      />

      {/* My status bar */}
      <MyStatusBar user={me} onUpdate={(data) => updateMutation.mutate(data)} />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search name, role, department…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-secondary/30 border-border/50"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading directory…</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No team members found.</div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.key}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">{group.label}</h2>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs text-muted-foreground">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.members.map(u => (
                  <TeamMemberCard key={u.id} member={u} isMe={u.id === me?.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}