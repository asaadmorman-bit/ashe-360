import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const SEVERITY_COLORS = {
  low: 'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const STATUS_COLORS = {
  open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  investigating: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  new: 'bg-primary/10 text-primary border-primary/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
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

export default function SelectableDataTable({
  columns,
  data,
  emptyMessage = 'No data available',
  onRowClick,
  selectedIds,
  onToggleSelect,
}) {
  const allSelected = data.length > 0 && data.every(row => selectedIds.has(row.id));
  const someSelected = data.some(row => selectedIds.has(row.id));

  const handleSelectAll = () => {
    if (allSelected) {
      data.forEach(row => {
        selectedIds.delete(row.id);
      });
    } else {
      data.forEach(row => {
        selectedIds.add(row.id);
      });
    }
    onToggleSelect(new Set(selectedIds));
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
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
                <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-10 text-base">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={row.id || i}
                  className="border-border/30 hover:bg-secondary/30 transition-colors"
                >
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={() => onToggleSelect(row.id)}
                    />
                  </TableCell>
                  {columns.map(col => (
                    <TableCell key={col.key} className="text-base cursor-pointer" onClick={() => onRowClick?.(row)}>
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