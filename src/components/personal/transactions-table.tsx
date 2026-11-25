'use client';

import React from 'react';
import { Transaction, Category, Account } from '@/types';
import { formatIDR } from '@/lib/currency';
import { resolveCategoryPair } from '@/lib/categories';
import { Trash2, Pencil, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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
  onEditClick?: (t: Transaction) => void;
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
  onEditClick,
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
            <TableHead className="w-20 py-3 px-3 text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
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
              const isTransfer = t.type === 'transfer';
              const resolvedCat = resolveCategoryPair(categories, t.categoryId, t.subCategoryId, '');
              const accountObj = accounts.find((a) => a.id === t.accountId);
              const destAccountObj = t.toAccountId ? accounts.find((a) => a.id === t.toAccountId) : null;

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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{t.description}</span>
                      {t.itemAction === 'collect' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Collection
                        </span>
                      )}
                      {t.itemAction === 'sell' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                          Seller Stock
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-3 px-4">
                    {isTransfer ? (
                      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 py-0 font-normal border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5">
                        {t.sourceModule === 'savings_deposit' ? 'Goal Deposit' : 'Transfer'}
                      </Badge>
                    ) : resolvedCat.main ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 py-0 font-normal">
                          {resolvedCat.mainName}
                        </Badge>
                        {resolvedCat.subName && (
                          <span className="text-[10px] text-muted-foreground">
                            / {resolvedCat.subName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap py-3 px-4">
                    {isTransfer ? (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                        <span>{accountObj?.name || 'Source'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {t.sourceModule === 'savings_deposit' ? 'Savings Goal' : destAccountObj?.name || 'Dest'}
                        </span>
                      </div>
                    ) : (
                      accountObj?.name || '-'
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums whitespace-nowrap py-3 px-4 ${
                      isTransfer
                        ? 'text-blue-600 dark:text-blue-400'
                        : isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
                  >
                    {isTransfer ? '⇄ ' : isIncome ? '+' : '-'}{formatIDR(t.amount)}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap py-3 px-3">
                    <div className="inline-flex items-center gap-1">
                      {onEditClick && (
                        <button
                          onClick={() => onEditClick(t)}
                          className="text-muted-foreground/70 hover:text-foreground p-1 rounded transition-colors"
                          title="Edit transaction"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteClick(t)}
                        className="text-muted-foreground/60 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
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
