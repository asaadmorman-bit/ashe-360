import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const SEVERITY_COLORS = {
  low: 'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CAT_I: 'bg-red-500/10 text-red-400 border-red-500/20',
  CAT_II: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  CAT_III: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const STATUS_COLORS = {
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  investigating: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  new: 'bg-primary/10 text-primary border-primary/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  queued: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  escalated: 'bg-red-500/10 text-red-400 border-red-500/20',
  online: 'bg-green-500/10 text-green-400 border-green-500/20',
  offline: 'bg-red-500/10 text-red-400 border-red-500/20',
  degraded: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export function SeverityBadge({ severity }) {
  return (
    <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[severity] || 'bg-muted text-muted-foreground'}`}>
      {severity?.replace(/_/g, ' ')}
    </Badge>
  );
}

export function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[status] || 'bg-muted text-muted-foreground'}`}>
      {status?.replace(/_/g, ' ')}
    </Badge>
  );
}

export default function DataTable({ columns, data, emptyMessage = 'No data available', onRowClick }) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              {columns.map(col => (
                <TableHead key={col.key} className="text-muted-foreground text-sm font-medium">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-10 text-base">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow 
                  key={row.id || i} 
                  className="border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <TableCell key={col.key} className="text-base">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}