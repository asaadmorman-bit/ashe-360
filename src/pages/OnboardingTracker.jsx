import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, CheckCircle2, Circle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import { Button } from '@/components/ui/button';

const PHASE_COLORS = {
  discovery: '#64748b', planning: '#3b82f6', migration: '#8b5cf6',
  testing: '#eab308', go_live: '#f97316', completed: '#22c55e',
};

const PHASE_ORDER = ['discovery', 'planning', 'migration', 'testing', 'go_live', 'completed'];

function PhaseBar({ current }) {
  const idx = PHASE_ORDER.indexOf(current);
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {PHASE_ORDER.map((phase, i) => {
        const done = i < idx;
        const active = i === idx;
        const color = PHASE_COLORS[phase];
        return (
          <div key={phase} title={phase.replace(/_/g,' ')} style={{
            flex: 1, height: 6, borderRadius: 999,
            background: done ? color : active ? color : '#1e293b',
            opacity: active ? 1 : done ? 0.8 : 0.3,
            boxShadow: active ? `0 0 8px ${color}88` : 'none',
          }} />
        );
      })}
    </div>
  );
}

function ChecklistItem({ item, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', userSelect: 'none' }}
    >
      {item.done
        ? <CheckCircle2 size={16} color="#22c55e" />
        : <Circle size={16} color="#334155" />
      }
      <span style={{ color: item.done ? '#475569' : '#94a3b8', fontSize: 13, textDecoration: item.done ? 'line-through' : 'none' }}>
        {item.task}
      </span>
    </div>
  );
}

export default function OnboardingTracker() {
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newClient, setNewClient] = useState({ client_name: '', assigned_pm: '', target_completion: '' });
  const queryClient = useQueryClient();

  const { data: onboardings = [] } = useQuery({
    queryKey: ['onboardings'],
    queryFn: () => base44.entities.Onboarding.list('-created_date', 100),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Onboarding.create({
      ...data,
      phase: 'discovery',
      status: 'active',
      progress_pct: 0,
      start_date: new Date().toISOString().split('T')[0],
      checklist: [
        { task: 'Kickoff call completed', done: false },
        { task: 'Scope of work signed', done: false },
        { task: 'Asset discovery scan run', done: false },
        { task: 'Network diagram received', done: false },
        { task: 'Credentials & access provisioned', done: false },
        { task: 'SIEM agent deployment', done: false },
        { task: 'Baseline security scan completed', done: false },
        { task: 'Initial compliance gap report delivered', done: false },
        { task: 'Monitoring rules configured', done: false },
        { task: 'Executive brief delivered', done: false },
        { task: 'Go-live sign-off received', done: false },
      ],
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboardings'] }); setShowForm(false); setNewClient({ client_name: '', assigned_pm: '', target_completion: '' }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Onboarding.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboardings'] }),
  });

  const toggleChecklistItem = (onboarding, idx) => {
    const checklist = onboarding.checklist.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    const done = checklist.filter(c => c.done).length;
    const progress_pct = Math.round((done / checklist.length) * 100);
    const phase = progress_pct === 100 ? 'completed' : progress_pct >= 80 ? 'go_live' : progress_pct >= 60 ? 'testing' : progress_pct >= 40 ? 'migration' : progress_pct >= 20 ? 'planning' : 'discovery';
    updateMutation.mutate({ id: onboarding.id, data: { checklist, progress_pct, phase } });
  };

  const active = onboardings.filter(o => o.status === 'active').length;
  const completed = onboardings.filter(o => o.status === 'completed' || o.phase === 'completed').length;
  const avgProgress = onboardings.length ? Math.round(onboardings.reduce((s, o) => s + (o.progress_pct || 0), 0) / onboardings.length) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      <PageHeader
        title="Onboarding Tracker"
        subtitle="Client onboarding checklists and completion progress"
        icon={Users}
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> New Client
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Active Onboardings" value={active} icon={Users} />
        <KPICard label="Completed" value={completed} icon={CheckCircle2} />
        <KPICard label="Avg Progress" value={`${avgProgress}%`} icon={CheckCircle2} />
      </div>

      {showForm && (
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Add New Client Onboarding</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Client Name *</label>
              <input value={newClient.client_name} onChange={e => setNewClient(f => ({ ...f, client_name: e.target.value }))}
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none" placeholder="Acme Defense Corp" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assigned PM</label>
              <input value={newClient.assigned_pm} onChange={e => setNewClient(f => ({ ...f, assigned_pm: e.target.value }))}
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none" placeholder="Project Manager Name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target Completion</label>
              <input type="date" value={newClient.target_completion} onChange={e => setNewClient(f => ({ ...f, target_completion: e.target.value }))}
                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={() => createMutation.mutate(newClient)} disabled={!newClient.client_name || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Onboarding'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {onboardings.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No onboardings yet. Add your first client above.</div>
        )}
        {onboardings.map(o => {
          const isExpanded = expanded === o.id;
          const checklist = o.checklist || [];
          const done = checklist.filter(c => c.done).length;
          const pct = o.progress_pct || 0;
          const phaseColor = PHASE_COLORS[o.phase] || '#64748b';

          return (
            <div key={o.id} className="glass-panel rounded-xl overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : o.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="font-semibold text-foreground">{o.client_name}</span>
                      <span style={{ background: `${phaseColor}20`, color: phaseColor, border: `1px solid ${phaseColor}44`, borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                        {o.phase?.replace(/_/g,' ').toUpperCase()}
                      </span>
                      {o.assigned_pm && <span className="text-xs text-muted-foreground">PM: {o.assigned_pm}</span>}
                      {o.target_completion && <span className="text-xs text-muted-foreground">Due: {o.target_completion}</span>}
                    </div>
                    <PhaseBar current={o.phase || 'discovery'} />
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono" style={{ color: pct === 100 ? '#22c55e' : pct >= 60 ? '#eab308' : '#e2e8f0' }}>{pct}%</div>
                      <div className="text-xs text-muted-foreground">{done}/{checklist.length} tasks</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              </div>

              {isExpanded && checklist.length > 0 && (
                <div className="border-t border-border/50 px-5 pb-4">
                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {checklist.map((item, idx) => (
                      <ChecklistItem key={idx} item={item} onToggle={() => toggleChecklistItem(o, idx)} />
                    ))}
                  </div>
                  {o.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">{o.notes}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}