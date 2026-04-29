import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: AlertTriangle,
    text: 'text-red-400',
    label: 'Critical'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: AlertCircle,
    text: 'text-yellow-400',
    label: 'Warning'
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: Info,
    text: 'text-blue-400',
    label: 'Info'
  }
};

export default function ATOAlertBanner({ alert }) {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
  const Icon = cfg.icon;

  const handleDismiss = async () => {
    await base44.entities.ATONotification.update(alert.id, { is_read: true });
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg ${cfg.bg} border ${cfg.border} mb-3`}>
      <Icon className={`w-5 h-5 ${cfg.text} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
          <span className="text-sm text-foreground font-medium">{alert.system_name}</span>
        </div>
        <p className="text-sm text-muted-foreground">{alert.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}