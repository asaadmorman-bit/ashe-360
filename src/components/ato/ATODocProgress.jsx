import React from 'react';

const DOC_LABELS = {
  doc_ssp:  'SSP',
  doc_sar:  'SAR',
  doc_sap:  'SAP',
  doc_poam: 'POA&M',
  doc_iscp: 'ISCP',
};

const DOC_COLORS = {
  complete:    { bg: '#22c55e22', text: '#22c55e', dot: '#22c55e' },
  in_progress: { bg: '#eab30822', text: '#eab308', dot: '#eab308' },
  not_started: { bg: '#64748b22', text: '#64748b', dot: '#64748b' },
};

export default function ATODocProgress({ record }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(DOC_LABELS).map(([key, label]) => {
        const status = record[key] || 'not_started';
        const cfg = DOC_COLORS[status];
        return (
          <span
            key={key}
            title={status.replace(/_/g, ' ')}
            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.dot}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}