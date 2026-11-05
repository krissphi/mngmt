'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Transaction } from '@/types';
import { formatIDR } from '@/lib/currency';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuickActionModal } from '@/components/shared/quick-action-modal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TablePagination } from '@/components/shared/table-pagination';
import { TransactionsTable, TrxSortField, TrxSortState } from './transactions-table';

export function TransactionsTab() {
  const { transactions, accounts, categories, deleteTransaction } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<TrxSortState>({ field: 'date', direction: 'desc' });
  const [deletingTrx, setDeletingTrx] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const handleSort = (field: TrxSortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const personalTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.scope !== 'personal') return false;
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;
        if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const { field, direction } = sortState;
        const dir = direction === 'asc' ? 1 : -1;
        if (field === 'date') return dir * a.date.localeCompare(b.date);
        if (field === 'description') return dir * a.description.localeCompare(b.description);
        if (field === 'amount') return dir * (a.amount - b.amount);
        return 0;
      });
  }, [transactions, filterType, selectedMonth, searchQuery, sortState]);

  const totalPages = Math.ceil(personalTransactions.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return personalTransactions.slice(start, start + pageSize);
  }, [personalTransactions, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-lg border border-border/50">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative min-w-[180px] flex-1 max-w-xs">
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
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none"
          >
            <option value="all">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md text-xs border border-border/60">
            {(['all', 'income', 'expense'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                  filterType === type ? 'bg-card text-foreground font-semibold shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Transactions Table Component */}
      <TransactionsTable
        transactions={paginatedTransactions}
        categories={categories}
        accounts={accounts}
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        searchQuery={searchQuery}
        sortState={sortState}
        onSort={handleSort}
        onDeleteClick={setDeletingTrx}
      />

      <TablePagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={personalTransactions.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50]}
      />

      <QuickActionModal open={showModal} onOpenChange={setShowModal} defaultTab="expense" />

      <ConfirmDialog
        open={!!deletingTrx}
        onOpenChange={(open) => !open && setDeletingTrx(null)}
        title="Delete Transaction?"
        description={`Are you sure you want to delete "${deletingTrx?.description}" (${formatIDR(deletingTrx?.amount || 0)})? The associated account balance will be automatically reversed.`}
        confirmText="Delete"
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
