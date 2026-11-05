'use client';

import React from 'react';
import { Sale } from '@/types';
import { formatIDR } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface SalesTableProps {
  sales: Sale[];
  currentPage: number;
  pageSize: number;
  isFiltered: boolean;
  onStatusChange: (id: string, newStatus: Sale['orderStatus']) => void;
}

export function SalesTable({
  sales,
  currentPage,
  pageSize,
  isFiltered,
  onStatusChange,
}: SalesTableProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="w-10 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-2">
              #
            </TableHead>
            <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Order Number
            </TableHead>
            <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Channel
            </TableHead>
            <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Date
            </TableHead>
            <TableHead className="py-3 px-4 min-w-[200px] text-xs font-semibold text-muted-foreground uppercase">
              Items & Customer
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Gross Sales
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Net Profit
            </TableHead>
            <TableHead className="py-3 px-4 text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60">
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                {isFiltered ? 'No sales orders match your filter criteria.' : 'No sales orders recorded yet.'}
              </TableCell>
            </TableRow>
          ) : (
            sales.map((s, idx) => {
              const rowNumber = (currentPage - 1) * pageSize + idx + 1;

              return (
                <TableRow
                  key={`${s.id}-${idx}`}
                  className="text-xs hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-2">
                    {rowNumber}
                  </TableCell>
                  <TableCell className="font-mono font-medium text-foreground whitespace-nowrap py-3 px-4">
                    {s.orderNumber}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-3 px-4">
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold h-5 px-1.5 py-0 bg-muted/60">
                      {s.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap py-3 px-4 font-mono text-[11px]">
                    {s.saleDate}
                  </TableCell>
                  <TableCell className="min-w-[200px] py-3 px-4">
                    <div className="font-medium text-foreground line-clamp-1">
                      {s.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </div>
                    {s.customerName && (
                      <div className="text-[11px] text-muted-foreground truncate">{s.customerName}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground whitespace-nowrap tabular-nums py-3 px-4">
                    {formatIDR(s.grossSales)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums py-3 px-4">
                    {formatIDR(s.netProfit)}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap py-3 px-4">
                    <select
                      value={s.orderStatus}
                      onChange={(e) => onStatusChange(s.id, e.target.value as Sale['orderStatus'])}
                      className="text-[11px] bg-card border border-border/80 rounded px-2 py-1 font-medium cursor-pointer text-foreground focus-visible:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                    </select>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
