'use client';

import React from 'react';
import { Sale } from '@/types';
import { formatIDR } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown, Wallet } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export type SaleSortField = 'orderNumber' | 'channel' | 'date' | 'revenue' | 'profit' | 'status';
export type SortDirection = 'asc' | 'desc';
export interface SaleSortState {
  field: SaleSortField;
  direction: SortDirection;
}

interface SalesTableProps {
  sales: Sale[];
  currentPage: number;
  pageSize: number;
  isFiltered: boolean;
  sortState?: SaleSortState;
  onSort?: (field: SaleSortField) => void;
  onStatusChange: (id: string, newStatus: Sale['orderStatus']) => void;
  onSettleSale?: (sale: Sale) => void;
  onDeleteSale?: (sale: Sale) => void;
}

export function SalesTable({
  sales,
  currentPage,
  pageSize,
  isFiltered,
  sortState,
  onSort,
  onStatusChange,
  onSettleSale,
  onDeleteSale,
}: SalesTableProps) {
  const renderSortIcon = (field: SaleSortField) => {
    if (!sortState) return null;
    const isField = sortState.field === field;
    if (isField && sortState.direction === 'asc') {
      return <ArrowUp className="size-3 text-primary ml-1 inline shrink-0" />;
    }
    if (isField && sortState.direction === 'desc') {
      return <ArrowDown className="size-3 text-primary ml-1 inline shrink-0" />;
    }
    return <ArrowUpDown className="size-3 text-muted-foreground/40 ml-1 inline shrink-0 group-hover:text-muted-foreground" />;
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="w-10 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-2">
              #
            </TableHead>
            <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => onSort?.('orderNumber')}
                className="group inline-flex items-center hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Order Number</span>
                {renderSortIcon('orderNumber')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => onSort?.('channel')}
                className="group inline-flex items-center hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Channel</span>
                {renderSortIcon('channel')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => onSort?.('date')}
                className="group inline-flex items-center hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Date</span>
                {renderSortIcon('date')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-4 min-w-[200px] text-xs font-semibold text-muted-foreground uppercase">
              Items & Customer
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => onSort?.('revenue')}
                className="group inline-flex items-center ml-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Gross Sales</span>
                {renderSortIcon('revenue')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => onSort?.('profit')}
                className="group inline-flex items-center ml-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Net Profit</span>
                {renderSortIcon('profit')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-4 text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => onSort?.('status')}
                className="group inline-flex items-center mx-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Status</span>
                {renderSortIcon('status')}
              </button>
            </TableHead>
            {onDeleteSale && (
              <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-2">
                Action
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60">
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onDeleteSale ? 9 : 8} className="py-8 text-center text-muted-foreground text-xs">
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
                    <div>{formatIDR(s.grossSales)}</div>
                    <div className="mt-0.5">
                      {s.paymentStatus === 'paid' ? (
                        <span className="text-[10px] text-emerald-500 font-medium">Paid</span>
                      ) : s.orderStatus !== 'cancelled' && s.orderStatus !== 'returned' ? (
                        <span className="text-[10px] text-amber-500 font-semibold">Pending Escrow</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Unpaid</span>
                      )}
                    </div>
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
                  {(onDeleteSale || onSettleSale) && (
                    <TableCell className="text-center whitespace-nowrap py-3 px-2">
                      <div className="inline-flex items-center gap-1">
                        {onSettleSale &&
                          s.paymentStatus !== 'paid' &&
                          s.orderStatus !== 'cancelled' &&
                          s.orderStatus !== 'returned' && (
                            <button
                              onClick={() => onSettleSale(s)}
                              className="p-1.5 text-amber-500 hover:text-emerald-500 rounded transition-colors"
                              title="Settle Escrow / Mark Paid"
                            >
                              <Wallet className="size-3.5" />
                            </button>
                          )}
                        {onDeleteSale && (
                          <button
                            onClick={() => onDeleteSale(s)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                            title="Delete sale order"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
