'use client';

import React, { useState, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { useStore } from '@/context/store-context';
import { Budget } from '@/types';
import { formatIDR } from '@/lib/currency';
import { getLocalMonthString } from '@/lib/date';
import { resolveCategoryPair } from '@/lib/categories';
import { CategorySubSelect } from '@/components/shared/category-sub-select';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, PieChart } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/states/state-views';

function formatMonthLabel(monthStr: string): string {
  try {
    const d = parseISO(`${monthStr}-01`);
    return isValid(d) ? format(d, 'MMMM yyyy') : monthStr;
  } catch {
    return monthStr;
  }
}

export function BudgetsTab() {
  const { categories, budgets, transactions, addBudget, updateBudget, deleteBudget } = useStore();
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetSubCategory, setNewBudgetSubCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [editBudgetAmount, setEditBudgetAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getLocalMonthString());

  const availableMonths = useMemo(() => {
    const set = new Set<string>([getLocalMonthString()]);
    budgets.forEach((b) => b.month && set.add(b.month));
    transactions.forEach((t) => t.date && set.add(t.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [budgets, transactions]);

  const activeMonthForCreate = selectedMonth === 'all' ? getLocalMonthString() : selectedMonth;
  const monthLabel = selectedMonth === 'all' ? 'All Months' : formatMonthLabel(selectedMonth);

  const { spentByMainMap, spentBySubMap } = useMemo(() => {
    const mainMap = new Map<string, number>();
    const subMap = new Map<string, number>();

    for (const t of transactions) {
      if (t.scope === 'personal' && t.type === 'expense' && t.date) {
        const monthKey = t.date.slice(0, 7);
        const resolved = resolveCategoryPair(categories, t.categoryId, t.subCategoryId);
        if (resolved.mainId) {
          const mKey = `${resolved.mainId}_${monthKey}`;
          mainMap.set(mKey, (mainMap.get(mKey) || 0) + t.amount);
        }
        if (resolved.subId) {
          const sKey = `${resolved.subId}_${monthKey}`;
          subMap.set(sKey, (subMap.get(sKey) || 0) + t.amount);
        }
      }
    }

    return { spentByMainMap: mainMap, spentBySubMap: subMap };
  }, [transactions, categories]);

  const visibleBudgets = useMemo(() => {
    if (selectedMonth === 'all') return budgets;
    return budgets.filter((b) => b.month === selectedMonth);
  }, [budgets, selectedMonth]);

  const budgetCards = useMemo(() => {
    return visibleBudgets.map((b) => {
      const resolved = resolveCategoryPair(categories, b.categoryId, b.subCategoryId, 'Category');
      const spent = resolved.subId
        ? spentBySubMap.get(`${resolved.subId}_${b.month}`) || 0
        : spentByMainMap.get(`${resolved.mainId || b.categoryId}_${b.month}`) || 0;
      const rawPercent = b.allocatedAmount > 0 ? Math.round((spent / b.allocatedAmount) * 100) : 0;
      const barPercent = Math.min(100, rawPercent);
      const isOver = spent > b.allocatedAmount;
      const remaining = b.allocatedAmount - spent;

      return {
        budget: b,
        resolved,
        spent,
        rawPercent,
        barPercent,
        isOver,
        remaining,
      };
    });
  }, [visibleBudgets, categories, spentByMainMap, spentBySubMap]);

  const { totalAllocated, totalSpent, onTrackCount, overCount } = useMemo(() => {
    let alloc = 0;
    let spent = 0;
    let over = 0;
    for (const item of budgetCards) {
      alloc += item.budget.allocatedAmount || 0;
      spent += item.spent;
      if (item.isOver) over++;
    }
    return {
      totalAllocated: alloc,
      totalSpent: spent,
      onTrackCount: budgetCards.length - over,
      overCount: over,
    };
  }, [budgetCards]);

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetCategory || !newBudgetAmount) return;
    addBudget({
      categoryId: newBudgetCategory,
      subCategoryId: newBudgetSubCategory || undefined,
      month: activeMonthForCreate,
      allocatedAmount: Number(newBudgetAmount),
      spentAmount: 0,
    });
    setNewBudgetAmount('');
    setNewBudgetCategory('');
    setNewBudgetSubCategory('');
    setShowAddBudget(false);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setEditBudgetAmount(String(b.allocatedAmount));
  };

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget || !editBudgetAmount) return;
    updateBudget(editingBudget.id, {
      allocatedAmount: Number(editBudgetAmount),
    });
    setEditingBudget(null);
  };

  const budgetToDelete = budgets.find((b) => b.id === deletingId);
  const budgetToDeleteName = budgetToDelete
    ? resolveCategoryPair(categories, budgetToDelete.categoryId, budgetToDelete.subCategoryId, 'this category').fullName
    : 'this category';

  return (
    <div className="space-y-6">
      <SummaryBanner
        label={`Monthly Budget Limit (${monthLabel})`}
        value={formatIDR(totalAllocated)}
        meta={[
          `${budgetCards.length} ${budgetCards.length === 1 ? 'Budget' : 'Budgets'}`,
          `${onTrackCount} On Track`,
          `${overCount} Over Limit`,
          `Spent ${formatIDR(totalSpent)}`,
        ]}
        actions={
          <>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8.5 rounded-lg border border-border/60 bg-card/60 px-2.5 text-xs text-foreground focus-visible:outline-none"
              aria-label="Filter budgets by month"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
            <Button
              onClick={() => setShowAddBudget(true)}
              size="sm"
              className="text-xs gap-1.5 h-8.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>Add Budget</span>
            </Button>
          </>
        }
      />

      {/* Add Budget Modal */}
      <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Create Monthly Budget</DialogTitle>
            <DialogDescription className="text-xs">
              Set a spending limit for a category or sub-category in {formatMonthLabel(activeMonthForCreate)}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget} className="space-y-3 pt-2">
            <CategorySubSelect
              categories={categories}
              allowedTypes={['personal_expense']}
              categoryId={newBudgetCategory}
              subCategoryId={newBudgetSubCategory}
              onCategoryChange={setNewBudgetCategory}
              onSubCategoryChange={setNewBudgetSubCategory}
              subLabel="Sub Category (Optional)"
              required
            />
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Monthly Spending Limit (Rp)</label>
              <Input
                type="number"
                placeholder="e.g. 1500000"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                required
                min={1000}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddBudget(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
                Save Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Modal */}
      <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Adjust Budget Limit</DialogTitle>
            <DialogDescription className="text-xs">
              Update monthly spending limit for this category.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBudget} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
              <Input
                value={
                  editingBudget
                    ? resolveCategoryPair(categories, editingBudget.categoryId, editingBudget.subCategoryId, 'Category').fullName
                    : 'Category'
                }
                disabled
                className="bg-muted text-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">New Limit (Rp)</label>
              <Input
                type="number"
                value={editBudgetAmount}
                onChange={(e) => setEditBudgetAmount(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingBudget(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modern Obsidian Budget Cards */}
      {budgetCards.length === 0 ? (
        <EmptyState
          icon={<PieChart className="size-8" />}
          title={`No Budgets for ${monthLabel}`}
          description="Plan monthly spending limits to keep personal expenses under control."
          action={<Button onClick={() => setShowAddBudget(true)} size="sm">+ Create First Budget</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetCards.map(({ budget: b, resolved, spent, rawPercent, barPercent, isOver, remaining }) => {
            const isNearLimit = !isOver && rawPercent >= 85;
            const accentBg = isOver
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              : isNearLimit
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            const barColor = isOver
              ? 'bg-rose-500'
              : isNearLimit
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            return (
              <div
                key={b.id}
                className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 hover:border-border/90 hover:bg-card/90 transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${accentBg}`}>
                      <PieChart className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground leading-snug break-words">
                        {resolved.mainName}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[11px] text-muted-foreground">
                        {resolved.subName && <span>{resolved.subName}</span>}
                        {selectedMonth === 'all' && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 font-mono">
                            {b.month}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
                      title="Edit budget limit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(b.id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-accent/60 transition-colors"
                      title="Delete budget"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Middle: Remaining / Over Budget Hero + Progress */}
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium block">
                        {isOver ? 'Over Budget' : 'Remaining'}
                      </span>
                      <div
                        className={`text-lg sm:text-xl font-bold tracking-tight font-mono tabular-nums mt-0.5 ${
                          isOver ? 'text-rose-500' : 'text-foreground'
                        }`}
                      >
                        {formatIDR(Math.abs(remaining))}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold font-mono px-2 py-0.5 rounded-md border ${
                        isOver
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : isNearLimit
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : 'bg-muted/60 border-border/50 text-muted-foreground'
                      }`}
                    >
                      {rawPercent}% used
                    </span>
                  </div>

                  <div className="w-full bg-secondary/70 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>

                {/* Clean Footer */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40 text-xs font-mono tabular-nums">
                  <span className="text-muted-foreground">Spent {formatIDR(spent)}</span>
                  <span className="font-semibold text-foreground">Limit {formatIDR(b.allocatedAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Category Budget?"
        description={`Are you sure you want to delete the budget allocation for "${budgetToDeleteName}"?`}
        confirmText="Delete Budget"
        cancelText="Cancel"
        onConfirm={() => {
          if (deletingId) {
            deleteBudget(deletingId);
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
}
