'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Transaction } from '@/types';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { getMainCategories, getSubCategories, resolveCategoryPair } from '@/lib/categories';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Trash2, Pencil, Search, RotateCcw } from 'lucide-react';
import { TransactionEditDialog } from '@/components/personal/transaction-edit-dialog';
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
  const { accounts, categories, transactions, deleteTransaction } = useStore();

  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'business'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [deletingTrx, setDeletingTrx] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const outcomeMainCategories = useMemo(
    () => getMainCategories(categories, { flow: 'expense' }),
    [categories]
  );

  const incomeMainCategories = useMemo(
    () => getMainCategories(categories, { flow: 'income' }),
    [categories]
  );

  const isFiltered =
    scopeFilter !== 'all' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    accountFilter !== 'all' ||
    selectedMonth !== 'all' ||
    searchQuery !== '';

  const resetFilters = () => {
    setScopeFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setSelectedMonth('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredTransactions = useMemo(() => {
    const selectedCatObj =
      categoryFilter !== 'all' ? categories.find((c) => c.id === categoryFilter) : undefined;

    return transactions.filter((t) => {
      if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;
      if (scopeFilter !== 'all' && t.scope !== scopeFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (
        accountFilter !== 'all' &&
        t.accountId !== accountFilter &&
        t.toAccountId !== accountFilter
      ) {
        return false;
      }

      if (categoryFilter !== 'all') {
        const resolved = resolveCategoryPair(categories, t.categoryId, t.subCategoryId);
        if (selectedCatObj?.parentId) {
          if (
            resolved.subId !== categoryFilter &&
            t.subCategoryId !== categoryFilter &&
            t.categoryId !== categoryFilter
          ) {
            return false;
          }
        } else if (resolved.mainId !== categoryFilter && t.categoryId !== categoryFilter) {
          return false;
        }
      }

      if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [transactions, categories, selectedMonth, scopeFilter, typeFilter, categoryFilter, accountFilter, searchQuery]);

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let inCount = 0;
    let outCount = 0;
    let transferCount = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') {
        totalIn += t.amount;
        inCount++;
      } else if (t.type === 'expense') {
        totalOut += t.amount;
        outCount++;
      } else if (t.type === 'transfer') {
        transferCount++;
      }
    }
    return {
      totalIn,
      totalOut,
      netFlow: totalIn - totalOut,
      inCount,
      outCount,
      transferCount,
    };
  }, [filteredTransactions]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-5">
      <SummaryBanner
        label={isFiltered ? 'Filtered Ledger Net Flow' : 'General Ledger Net Flow'}
        value={formatSignedIDR(summary.netFlow)}
        valueClassName={summary.netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}
        meta={[
          `${filteredTransactions.length} ${filteredTransactions.length === 1 ? 'Entry' : 'Entries'}`,
          `${summary.inCount} Inflow (${formatIDR(summary.totalIn)})`,
          `${summary.outCount} Outflow (${formatIDR(summary.totalOut)})`,
          ...(summary.transferCount > 0 ? [`${summary.transferCount} Transfer`] : []),
        ]}
      />

      {/* Clean Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8.5 h-8.5 text-xs bg-card/50 border-border/60 rounded-xl"
          />
        </div>

        <select
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by month"
        >
          <option value="all">All Months</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none"
          value={scopeFilter}
          onChange={(e) => {
            setScopeFilter(e.target.value as 'all' | 'personal' | 'business');
            setCurrentPage(1);
          }}
          aria-label="Filter by scope"
        >
          <option value="all">All Scopes</option>
          <option value="personal">Personal Only</option>
          <option value="business">Business Only</option>
        </select>

        <select
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'all' | 'income' | 'expense' | 'transfer');
            setCurrentPage(1);
          }}
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>

        <select
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none max-w-[180px]"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {typeFilter !== 'income' && (
            <optgroup label="Outcome">
              {outcomeMainCategories.map((main) => {
                const subs = getSubCategories(categories, main.id);
                return (
                  <React.Fragment key={main.id}>
                    <option value={main.id}>{main.name}</option>
                    {subs.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </React.Fragment>
                );
              })}
            </optgroup>
          )}
          {typeFilter !== 'expense' && (
            <optgroup label="Income">
              {incomeMainCategories.map((main) => {
                const subs = getSubCategories(categories, main.id);
                return (
                  <React.Fragment key={main.id}>
                    <option value={main.id}>{main.name}</option>
                    {subs.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </React.Fragment>
                );
              })}
            </optgroup>
          )}
        </select>

        <select
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none max-w-[170px]"
          value={accountFilter}
          onChange={(e) => {
            setAccountFilter(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by account"
        >
          <option value="all">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {isFiltered && (
          <Button
            onClick={resetFilters}
            variant="ghost"
            size="sm"
            className="h-8.5 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground rounded-xl"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
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
                const rowNumber = (safeCurrentPage - 1) * pageSize + idx + 1;
                const isIncome = trx.type === 'income';
                const isTransfer = trx.type === 'transfer';
                const acc = accounts.find((a) => a.id === trx.accountId);
                const resolvedCat = resolveCategoryPair(categories, trx.categoryId, trx.subCategoryId, '');

                return (
                  <TableRow key={`${trx.id}-${idx}`} className="text-xs hover:bg-muted/20 transition-colors">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-3">{rowNumber}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap py-3 px-4 font-mono text-[11px]">{trx.date}</TableCell>
                    <TableCell className="whitespace-nowrap py-3 px-4">
                      <Badge variant={trx.scope === 'business' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-semibold h-5 px-1.5 py-0">
                        {trx.scope}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground min-w-[200px] py-3 px-4">
                      <div>{trx.description}</div>
                      {resolvedCat.main && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">{resolvedCat.fullName}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap py-3 px-4">{acc?.name || '-'}</TableCell>
                    <TableCell className="capitalize text-muted-foreground whitespace-nowrap py-3 px-4">{trx.sourceModule.replace('_', ' ')}</TableCell>
                    <TableCell className={`text-right font-bold font-mono tabular-nums whitespace-nowrap py-3 px-4 ${isTransfer ? 'text-blue-500' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {isTransfer ? '⇄ ' : isIncome ? '+' : '-'}{formatIDR(trx.amount)}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap py-3 px-3">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => setEditingTrx(trx)} className="text-muted-foreground/70 hover:text-foreground p-1 rounded transition-colors" title="Edit transaction">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => setDeletingTrx(trx)} className="text-muted-foreground/60 hover:text-rose-600 p-1 rounded transition-colors" title="Delete transaction">
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

      <TablePagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredTransactions.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50, 100]}
      />

      <TransactionEditDialog
        open={!!editingTrx}
        onOpenChange={(open) => !open && setEditingTrx(null)}
        transaction={editingTrx}
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
