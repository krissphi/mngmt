'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Transaction } from '@/types';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { getMainCategories, getSubCategories, resolveCategoryPair } from '@/lib/categories';
import { Plus, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { QuickActionModal } from '@/components/shared/quick-action-modal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TablePagination } from '@/components/shared/table-pagination';
import { TransactionsTable, TrxSortField, TrxSortState } from './transactions-table';
import { TransactionEditDialog } from './transaction-edit-dialog';

export function TransactionsTab() {
  const { transactions, accounts, categories, deleteTransaction } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<TrxSortState>({ field: 'date', direction: 'desc' });
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [deletingTrx, setDeletingTrx] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const personalMainCategories = useMemo(
    () => getMainCategories(categories, ['personal_expense', 'personal_income']),
    [categories]
  );

  const isFiltered =
    filterType !== 'all' ||
    selectedMonth !== 'all' ||
    selectedCategory !== 'all' ||
    selectedAccount !== 'all' ||
    searchQuery !== '';

  const resetFilters = () => {
    setFilterType('all');
    setSelectedMonth('all');
    setSelectedCategory('all');
    setSelectedAccount('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

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
    const selectedCatObj =
      selectedCategory !== 'all' ? categories.find((c) => c.id === selectedCategory) : undefined;

    return transactions
      .filter((t) => {
        if (t.scope !== 'personal') return false;
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;
        if (
          selectedAccount !== 'all' &&
          t.accountId !== selectedAccount &&
          t.toAccountId !== selectedAccount
        ) {
          return false;
        }

        if (selectedCategory !== 'all') {
          const resolved = resolveCategoryPair(categories, t.categoryId, t.subCategoryId);
          if (selectedCatObj?.parentId) {
            const matchesSub =
              resolved.subId === selectedCategory ||
              t.subCategoryId === selectedCategory ||
              t.categoryId === selectedCategory;
            if (!matchesSub) return false;
          } else {
            const matchesMain =
              resolved.mainId === selectedCategory || t.categoryId === selectedCategory;
            if (!matchesMain) return false;
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const resolved = resolveCategoryPair(categories, t.categoryId, t.subCategoryId, '');
          if (
            !t.description.toLowerCase().includes(q) &&
            !resolved.fullName.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
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
  }, [transactions, categories, filterType, selectedMonth, selectedCategory, selectedAccount, searchQuery, sortState]);

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalTransfer = 0;
    let inCount = 0;
    let outCount = 0;
    let transferCount = 0;

    for (const t of personalTransactions) {
      if (t.type === 'income') {
        totalIn += t.amount;
        inCount++;
      } else if (t.type === 'expense') {
        totalOut += t.amount;
        outCount++;
      } else if (t.type === 'transfer') {
        totalTransfer += t.amount;
        transferCount++;
      }
    }

    return {
      totalIn,
      totalOut,
      totalTransfer,
      netFlow: totalIn - totalOut,
      inCount,
      outCount,
      transferCount,
    };
  }, [personalTransactions]);

  const totalPages = Math.ceil(personalTransactions.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return personalTransactions.slice(start, start + pageSize);
  }, [personalTransactions, safeCurrentPage, pageSize]);

  const bannerLabel =
    filterType === 'income'
      ? 'Filtered Income'
      : filterType === 'expense'
      ? 'Filtered Expenses'
      : filterType === 'transfer'
      ? 'Filtered Transfers'
      : isFiltered
      ? 'Filtered Net Cashflow'
      : 'Personal Net Cashflow';

  const bannerValue =
    filterType === 'income'
      ? formatIDR(summary.totalIn)
      : filterType === 'expense'
      ? formatIDR(summary.totalOut)
      : filterType === 'transfer'
      ? formatIDR(summary.totalTransfer)
      : formatSignedIDR(summary.netFlow);

  const bannerValueClass =
    filterType === 'income'
      ? 'text-emerald-500'
      : filterType === 'transfer'
      ? 'text-sky-500'
      : filterType === 'expense'
      ? 'text-foreground'
      : summary.netFlow >= 0
      ? 'text-emerald-500'
      : 'text-rose-500';

  return (
    <div className="space-y-5">
      <SummaryBanner
        label={bannerLabel}
        value={bannerValue}
        valueClassName={bannerValueClass}
        meta={[
          `${personalTransactions.length} ${personalTransactions.length === 1 ? 'Transaction' : 'Transactions'}`,
          `${summary.inCount} Income (${formatIDR(summary.totalIn)})`,
          `${summary.outCount} Expense (${formatIDR(summary.totalOut)})`,
          ...(summary.transferCount > 0 ? [`${summary.transferCount} Transfer`] : []),
        ]}
        actions={
          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="text-xs gap-1.5 h-8.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Add Transaction</span>
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search description or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8.5 h-8.5 text-xs bg-card/50 border-border/60 rounded-xl"
          />
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setCurrentPage(1);
          }}
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none"
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
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none max-w-[190px]"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {personalMainCategories.map((main) => {
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
        </select>

        <select
          value={selectedAccount}
          onChange={(e) => {
            setSelectedAccount(e.target.value);
            setCurrentPage(1);
          }}
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none max-w-[170px]"
          aria-label="Filter by account"
        >
          <option value="all">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <div className="inline-flex p-0.5 bg-secondary/40 backdrop-blur-xs rounded-xl border border-border/40 gap-0.5">
          {(['all', 'income', 'expense', 'transfer'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs capitalize font-medium transition-all ${
                filterType === type
                  ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {isFiltered && (
          <Button
            onClick={resetFilters}
            variant="ghost"
            size="sm"
            className="text-xs h-8.5 px-2.5 text-muted-foreground hover:text-foreground gap-1 rounded-xl"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      <TransactionsTable
        transactions={paginatedTransactions}
        categories={categories}
        accounts={accounts}
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        searchQuery={searchQuery}
        sortState={sortState}
        onSort={handleSort}
        onEditClick={setEditingTrx}
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

      <TransactionEditDialog
        open={!!editingTrx}
        onOpenChange={(open) => !open && setEditingTrx(null)}
        transaction={editingTrx}
      />

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
