import React from 'react';

export default function SectionPanel({ title, icon: Icon, actions, children, className = '' }) {
  return (
    <div className={`glass-panel rounded-xl overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}