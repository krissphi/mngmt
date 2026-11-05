'use client';

import React from 'react';
import { Transaction, Category, Account } from '@/types';
import { formatIDR } from '@/lib/currency';
import { Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export type TrxSortField = 'date' | 'description' | 'amount';
export type SortDirection = 'asc' | 'desc';
export interface TrxSortState {
  field: TrxSortField;
  direction: SortDirection;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  sortState?: TrxSortState;
  onSort?: (field: TrxSortField) => void;
  onDeleteClick: (t: Transaction) => void;
}

export function TransactionsTable({
  transactions,
  categories,
  accounts,
  currentPage,
  pageSize,
  searchQuery,
  sortState,
  onSort,
  onDeleteClick,
}: TransactionsTableProps) {
  const renderSortIcon = (field: TrxSortField) => {
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
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="w-10 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-2">
              #
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
              <button
                type="button"
                onClick={() => onSort?.('description')}
                className="group inline-flex items-center hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Description</span>
                {renderSortIcon('description')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Category
            </TableHead>
            <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Account
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => onSort?.('amount')}
                className="group inline-flex items-center ml-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Amount</span>
                {renderSortIcon('amount')}
              </button>
            </TableHead>
            <TableHead className="w-16 py-3 px-3 text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60">
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                {searchQuery ? 'No transactions match your search.' : 'No personal transactions recorded.'}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((t, idx) => {
              const rowNumber = (currentPage - 1) * pageSize + idx + 1;
              const isIncome = t.type === 'income';
              const categoryObj = categories.find((c) => c.id === t.categoryId);
              const accountObj = accounts.find((a) => a.id === t.accountId);

              return (
                <TableRow
                  key={`${t.id}-${idx}`}
                  className="text-xs hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-2">
                    {rowNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap py-3 px-4 font-mono text-[11px]">
                    {t.date}
                  </TableCell>
                  <TableCell className="font-medium text-foreground min-w-[200px] py-3 px-4">
                    {t.description}
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-3 px-4">
                    {categoryObj ? (
                      <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 py-0 font-normal">
                        {categoryObj.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap py-3 px-4">
                    {accountObj?.name || '-'}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums whitespace-nowrap py-3 px-4 ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatIDR(t.amount)}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap py-3 px-3">
                    <button
                      onClick={() => onDeleteClick(t)}
                      className="text-muted-foreground/60 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
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
