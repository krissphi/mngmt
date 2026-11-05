'use client';

import React, { useState, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { useStore } from '@/context/store-context';
import { Budget } from '@/types';
import { formatIDR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, PieChart } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/states/state-views';

export function BudgetsTab() {
  const { categories, budgets, transactions, addBudget, updateBudget, deleteBudget } = useStore();
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [editBudgetAmount, setEditBudgetAmount] = useState('');
  const [currentMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const monthLabel = useMemo(() => {
    try {
      const d = parseISO(`${currentMonth}-01`);
      return isValid(d) ? format(d, 'MMMM yyyy') : currentMonth;
    } catch {
      return currentMonth;
    }
  }, [currentMonth]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Pre-calculate spending by category and month: O(T) single pass instead of O(B * T)
  const spentByBudgetMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.scope === 'personal' && t.type === 'expense' && t.categoryId && t.date) {
        const monthKey = t.date.slice(0, 7);
        const compositeKey = `${t.categoryId}_${monthKey}`;
        map.set(compositeKey, (map.get(compositeKey) || 0) + t.amount);
      }
    }
    return map;
  }, [transactions]);

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetCategory || !newBudgetAmount) return;
    addBudget({
      categoryId: newBudgetCategory,
      month: currentMonth,
      allocatedAmount: Number(newBudgetAmount),
      spentAmount: 0,
    });
    setNewBudgetAmount('');
    setNewBudgetCategory('');
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
  const budgetToDeleteName = budgetToDelete ? categoryMap.get(budgetToDelete.categoryId) || 'this category' : 'this category';

  return (
    <div className="space-y-4">
      {/* Standard Tab Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-medium">
          Category Spending Budgets: <b className="text-foreground">{monthLabel}</b>
        </div>

        <Button
          onClick={() => setShowAddBudget(true)}
          size="sm"
          className="text-xs gap-1.5 h-8 self-start sm:self-auto bg-primary text-primary-foreground font-medium"
        >
          <Plus className="size-3.5" />
          <span>Add Budget</span>
        </Button>
      </div>

      {/* Add Budget Modal */}
      <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Create Monthly Budget</DialogTitle>
            <DialogDescription className="text-xs">
              Set a spending limit for a specific category in {monthLabel}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
              <select
                value={newBudgetCategory}
                onChange={(e) => setNewBudgetCategory(e.target.value)}
                required
                className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
              >
                <option value="">Select an expense category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
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
        <DialogContent className="max-w-md">
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
                value={editingBudget ? categoryMap.get(editingBudget.categoryId) || 'Category' : 'Category'}
                disabled
                className="bg-muted text-xs cursor-not-allowed"
              >
              </Input>
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

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={<PieChart className="size-8" />}
          title="No Budgets Created"
          description="Plan monthly spending limits to keep personal expenses under control."
          action={<Button onClick={() => setShowAddBudget(true)} size="sm">+ Create First Budget</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {budgets.map((b) => {
            const catName = categoryMap.get(b.categoryId) || 'Category';
            const spent = spentByBudgetMap.get(`${b.categoryId}_${b.month}`) || 0;
            const percent = Math.min(100, Math.round((spent / b.allocatedAmount) * 100));
            const isOver = spent > b.allocatedAmount;

            return (
              <Card key={b.id} className="border-border/60 bg-card hover:border-border transition-colors shadow-2xs">
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{catName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-semibold tabular-nums ${isOver ? 'text-rose-600' : 'text-muted-foreground'}`}>
                        {percent}%
                      </span>
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Edit budget limit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(b.id)}
                        className="p-1 text-muted-foreground/60 hover:text-rose-600 rounded transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${isOver ? 'bg-rose-600' : 'bg-primary'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Spent: {formatIDR(spent)}</span>
                    <span className="font-medium text-foreground">Limit: {formatIDR(b.allocatedAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Budget Confirmation */}
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
