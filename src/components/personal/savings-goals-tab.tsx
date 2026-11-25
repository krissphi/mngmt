'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { SavingsGoal } from '@/types';
import { formatIDR } from '@/lib/currency';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DepositDialog } from './deposit-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/states/state-views';
import { Target, Plus, Pencil, Trash2, ArrowUpRight, Calendar, CheckCircle2 } from 'lucide-react';

export function SavingsGoalsTab() {
  const {
    savingsGoals,
    accounts,
    addSavingsGoal,
    updateSavingsGoal,
    depositToSavingsGoal,
    deleteSavingsGoal,
  } = useStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [depositingGoal, setDepositingGoal] = useState<SavingsGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const { totalSaved, totalTarget, completedCount, activeCount, overallPct } = useMemo(() => {
    let saved = 0;
    let target = 0;
    let completed = 0;
    for (const g of savingsGoals) {
      const cur = g.currentAmount || 0;
      const tgt = g.targetAmount || 0;
      saved += cur;
      target += tgt;
      if (tgt > 0 && cur >= tgt) completed++;
    }
    const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    return {
      totalSaved: saved,
      totalTarget: target,
      completedCount: completed,
      activeCount: savingsGoals.length - completed,
      overallPct: pct,
    };
  }, [savingsGoals]);

  const openAdd = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setFormOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setCurrentAmount(String(g.currentAmount));
    setTargetDate(g.targetDate || '');
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tgt = Number(targetAmount) || 0;
    const cur = Math.max(0, Number(currentAmount) || 0);
    if (!name.trim() || tgt <= 0) return;

    if (editingGoal) {
      updateSavingsGoal(editingGoal.id, {
        name: name.trim(),
        targetAmount: tgt,
        currentAmount: cur,
        targetDate: targetDate || undefined,
      });
    } else {
      addSavingsGoal({
        name: name.trim(),
        targetAmount: tgt,
        currentAmount: cur,
        targetDate: targetDate || undefined,
        color: '#2563EB',
      });
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <SummaryBanner
        label="Total Savings Accumulated"
        value={formatIDR(totalSaved)}
        meta={[
          `${savingsGoals.length} ${savingsGoals.length === 1 ? 'Goal' : 'Goals'}`,
          `${activeCount} In Progress`,
          `${completedCount} Reached`,
          `Target ${formatIDR(totalTarget)} (${overallPct}%)`,
        ]}
        actions={
          <Button
            onClick={openAdd}
            size="sm"
            className="text-xs h-8.5 gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>New Goal</span>
          </Button>
        }
      />

      {savingsGoals.length === 0 ? (
        <EmptyState
          icon={<Target className="size-8" />}
          title="No Savings Goals Yet"
          description="Set targets for emergency funds, equipment upgrades, or business reserves."
          action={
            <Button onClick={openAdd} size="sm">
              + Create First Goal
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isComplete = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 hover:border-border/90 hover:bg-card/90 transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isComplete
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : 'bg-sky-500/10 border-sky-500/20 text-sky-500'
                      }`}
                    >
                      {isComplete ? <CheckCircle2 className="size-4.5" /> : <Target className="size-4.5" />}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-foreground leading-snug break-words">
                        {goal.name}
                      </h4>
                      {goal.targetDate && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                          <Calendar className="size-3 shrink-0" />
                          <span>Target {goal.targetDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(goal)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
                      title="Edit goal"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingGoal(goal)}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-accent/60 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress & Amount Hero */}
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium block">
                        Saved Progress
                      </span>
                      <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono tabular-nums mt-0.5">
                        {formatIDR(goal.currentAmount)}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold font-mono px-2 py-0.5 rounded-md border ${
                        isComplete
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : 'bg-muted/60 border-border/50 text-muted-foreground'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-secondary/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                    <span className="text-muted-foreground">Target {formatIDR(goal.targetAmount)}</span>
                    <span className={isComplete ? 'text-emerald-500 font-semibold' : 'text-foreground font-medium'}>
                      {isComplete ? 'Completed' : `Left ${formatIDR(remaining)}`}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground">
                    {isComplete ? 'Milestone achieved' : 'Add funds from pocket'}
                  </span>
                  <button
                    onClick={() => setDepositingGoal(goal)}
                    className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 font-medium py-0.5 transition-colors"
                  >
                    <ArrowUpRight className="size-3.5" />
                    <span>Deposit Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Track progress toward an important financial milestone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Goal Name</label>
              <Input
                placeholder="e.g. Emergency Fund, New Laptop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Target Amount (Rp)</label>
                <Input
                  type="number"
                  min={1}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Current Saved (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Target Date (Optional)</label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                {editingGoal ? 'Save Changes' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <DepositDialog
        open={!!depositingGoal}
        onOpenChange={(open) => !open && setDepositingGoal(null)}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        onDeposit={(amount, accountId) => {
          if (depositingGoal) {
            depositToSavingsGoal(depositingGoal.id, amount, accountId);
            setDepositingGoal(null);
          }
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(open) => !open && setDeletingGoal(null)}
        title="Delete Savings Goal?"
        description={`Are you sure you want to remove "${deletingGoal?.name}"?`}
        confirmText="Delete Goal"
        cancelText="Cancel"
        onConfirm={() => {
          if (deletingGoal) {
            deleteSavingsGoal(deletingGoal.id);
            setDeletingGoal(null);
          }
        }}
      />
    </div>
  );
}
