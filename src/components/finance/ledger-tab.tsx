'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Transaction } from '@/types';
import { formatIDR } from '@/lib/currency';
import { Trash2, Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TablePagination } from '@/components/shared/table-pagination';

export function LedgerTab() {
  const { accounts, transactions, deleteTransaction } = useStore();

  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'business'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingTrx, setDeletingTrx] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const isFiltered =
    scopeFilter !== 'all' ||
    typeFilter !== 'all' ||
    accountFilter !== 'all' ||
    selectedMonth !== 'all' ||
    searchQuery !== '';

  const resetFilters = () => {
    setScopeFilter('all');
    setTypeFilter('all');
    setAccountFilter('all');
    setSelectedMonth('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;
      if (scopeFilter !== 'all' && t.scope !== scopeFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
      if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [transactions, selectedMonth, scopeFilter, typeFilter, accountFilter, searchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl border border-border/60 bg-card shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8.5 h-8 text-xs bg-card"
            />
          </div>
          <select
            className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
            value={scopeFilter}
            onChange={(e) => {
              setScopeFilter(e.target.value as 'all' | 'personal' | 'business');
              setCurrentPage(1);
            }}
          >
            <option value="all">All Scopes</option>
            <option value="personal">Personal Only</option>
            <option value="business">Business Only</option>
          </select>
          <select
            className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as 'all' | 'income' | 'expense' | 'transfer');
              setCurrentPage(1);
            }}
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
          <select
            className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {isFiltered && (
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
            <span className="text-muted-foreground text-[11px]">
              Active filters applied • <b>{filteredTransactions.length}</b> matches
            </span>
            <Button
              onClick={resetFilters}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              <span>Reset Filters</span>
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-3">#</TableHead>
              <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">Date</TableHead>
              <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">Scope</TableHead>
              <TableHead className="py-3 px-4 min-w-[200px] text-xs font-semibold text-muted-foreground uppercase">Description</TableHead>
              <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">Account</TableHead>
              <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">Source</TableHead>
              <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">Amount</TableHead>
              <TableHead className="w-16 py-3 px-3 text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                  No transactions matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((trx, idx) => {
                const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                const isIncome = trx.type === 'income';
                const acc = accounts.find((a) => a.id === trx.accountId);

                return (
                  <TableRow key={`${trx.id}-${idx}`} className="text-xs hover:bg-muted/20 transition-colors">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-3">{rowNumber}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap py-3 px-4 font-mono text-[11px]">{trx.date}</TableCell>
                    <TableCell className="whitespace-nowrap py-3 px-4">
                      <Badge variant={trx.scope === 'business' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-semibold h-5 px-1.5 py-0">
                        {trx.scope}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground min-w-[200px] py-3 px-4">{trx.description}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap py-3 px-4">{acc?.name || '-'}</TableCell>
                    <TableCell className="capitalize text-muted-foreground whitespace-nowrap py-3 px-4">{trx.sourceModule.replace('_', ' ')}</TableCell>
                    <TableCell className={`text-right font-bold tabular-nums whitespace-nowrap py-3 px-4 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {isIncome ? '+' : '-'}{formatIDR(trx.amount)}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap py-3 px-3">
                      <button onClick={() => setDeletingTrx(trx)} className="text-muted-foreground/60 hover:text-rose-600 p-1 rounded transition-colors" title="Delete transaction">
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

      <TablePagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredTransactions.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50, 100]}
      />

      <ConfirmDialog
        open={!!deletingTrx}
        onOpenChange={(open) => !open && setDeletingTrx(null)}
        title="Delete Ledger Transaction?"
        description={`Are you sure you want to delete transaction "${deletingTrx?.description}" (${formatIDR(deletingTrx?.amount || 0)})? The associated account balance will be automatically reversed.`}
        confirmText="Delete Transaction"
        cancelText="Cancel"
        variant="destructive"
        icon="trash"
        onConfirm={() => {
          if (deletingTrx) {
            deleteTransaction(deletingTrx.id);
            setDeletingTrx(null);
          }
        }}
      />
    </div>
  );
}
