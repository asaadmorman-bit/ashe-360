import React, { useState } from 'react';
import { CircleDot } from 'lucide-react';

const STATUSES = [
  { value: 'online',  label: 'Online',   color: 'bg-green-400' },
  { value: 'busy',    label: 'Busy',     color: 'bg-yellow-400' },
  { value: 'on_call', label: 'On Call',  color: 'bg-orange-400' },
  { value: 'away',    label: 'Away',     color: 'bg-slate-400' },
  { value: 'offline', label: 'Offline',  color: 'bg-slate-600' },
];

export default function MyStatusBar({ user, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const current = user?.availability_status || 'offline';

  const handleStatus = async (val) => {
    if (val === current || saving) return;
    setSaving(true);
    await onUpdate({ availability_status: val });
    setSaving(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-3.5 rounded-xl border border-border/40 bg-card/60 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <CircleDot className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">My Status</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => handleStatus(s.value)}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              current === s.value
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/40 bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${s.color}`} />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}