'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { getLocalMonthString } from '@/lib/date';
import { resolveCategoryPair } from '@/lib/categories';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { StatCard } from '@/components/shared/stat-card';
import { Building2, CreditCard, Banknote, Wallet, Calendar, Plus, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickActionModal } from '@/components/shared/quick-action-modal';

export function PersonalSummaryTab() {
  const { accounts, transactions, savingsGoals, wishlist, subscriptions, budgets, categories } = useStore();
  const [currentMonth] = useState(() => getLocalMonthString());
  const [quickModalOpen, setQuickModalOpen] = useState(false);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  const { monthIncome, monthExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of transactions) {
      if (t.scope === 'personal' && t.date && t.date.startsWith(currentMonth)) {
        if (t.type === 'income') inc += t.amount;
        else if (t.type === 'expense') exp += t.amount;
      }
    }
    return { monthIncome: inc, monthExpense: exp };
  }, [transactions, currentMonth]);

  const { totalSavedGoals, totalTargetGoals } = useMemo(() => {
    let saved = 0;
    let target = 0;
    for (const g of savingsGoals) {
      saved += g.currentAmount || 0;
      target += g.targetAmount || 0;
    }
    return { totalSavedGoals: saved, totalTargetGoals: target };
  }, [savingsGoals]);

  const { plannedWishlistTotal, plannedWishlistCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const w of wishlist) {
      if (!w.isPurchased) {
        total += w.estimatedPrice;
        count++;
      }
    }
    return { plannedWishlistTotal: total, plannedWishlistCount: count };
  }, [wishlist]);

  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => s.status === 'active');
  }, [subscriptions]);

  const monthlySubsTotal = useMemo(() => {
    return activeSubs.reduce((sum, s) => {
      if (s.billingCycle === 'monthly' || s.billingCycle === '28_days') return sum + s.amount;
      if (s.billingCycle === 'yearly') return sum + Math.round(s.amount / 12);
      if (s.billingCycle === 'weekly') return sum + s.amount * 4;
      return sum + s.amount;
    }, 0);
  }, [activeSubs]);

  const netMonthFlow = monthIncome - monthExpense;

  const { monthBudgets, totalAllocatedBudget, totalSpentBudget } = useMemo(() => {
    const spentByMain = new Map<string, number>();
    for (const t of transactions) {
      if (t.scope === 'personal' && t.type === 'expense' && t.date && t.date.startsWith(currentMonth)) {
        const resolved = resolveCategoryPair(categories, t.categoryId, t.subCategoryId);
        if (resolved.mainId) {
          spentByMain.set(resolved.mainId, (spentByMain.get(resolved.mainId) || 0) + t.amount);
        }
      }
    }

    const activeBudgets = budgets.filter((b) => b.month === currentMonth);
    const items = activeBudgets.map((b) => {
      const resolved = resolveCategoryPair(categories, b.categoryId, b.subCategoryId);
      const spent = resolved.mainId ? spentByMain.get(resolved.mainId) || 0 : 0;
      const pct = b.allocatedAmount > 0 ? Math.round((spent / b.allocatedAmount) * 100) : 0;
      return {
        id: b.id,
        name: resolved.mainName,
        allocated: b.allocatedAmount,
        spent,
        pct,
      };
    });

    const totalAlloc = items.reduce((sum, i) => sum + i.allocated, 0);
    const totalSpent = items.reduce((sum, i) => sum + i.spent, 0);
    return { monthBudgets: items, totalAllocatedBudget: totalAlloc, totalSpentBudget: totalSpent };
  }, [budgets, transactions, categories, currentMonth]);

  return (
    <div className="space-y-6">
      <SummaryBanner
        label="Total Liquid Funds"
        value={formatIDR(totalBalance)}
        meta={[
          `${accounts.length} ${accounts.length === 1 ? 'Pocket' : 'Pockets'}`,
          `Month Net ${formatSignedIDR(netMonthFlow)}`,
          `${activeSubs.length} Active Subscriptions`,
        ]}
        actions={
          <Button
            onClick={() => setQuickModalOpen(true)}
            size="sm"
            className="text-xs h-8.5 px-3 rounded-lg gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>New Transaction</span>
          </Button>
        }
      />

      {/* 4 Summary Stat Cards (Responsive 1->2->4 col so nominals never clip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Income This Month"
          value={formatIDR(monthIncome)}
          valueClassName="text-emerald-500"
          subtitle={`Period ${currentMonth}`}
        />
        <StatCard
          title="Expenses This Month"
          value={formatIDR(monthExpense)}
          subtitle={`Net flow ${formatSignedIDR(netMonthFlow)}`}
        />
        <StatCard
          title="Savings Goals"
          value={formatIDR(totalSavedGoals)}
          subtitle={
            totalTargetGoals > 0
              ? `${savingsGoals.length} goals • Target ${formatIDR(totalTargetGoals)}`
              : `${savingsGoals.length} active goals`
          }
        />
        <StatCard
          title="Planned Wishlist"
          value={formatIDR(plannedWishlistTotal)}
          subtitle={`${plannedWishlistCount} items pending`}
        />
      </div>

      {/* Account Balances & Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <span className="text-sm font-semibold text-foreground">Liquid Account Distribution</span>
            <span className="text-xs text-muted-foreground font-mono">{accounts.length} pockets</span>
          </div>
          <div className="space-y-3">
            {accounts.map((acc) => {
              const Icon =
                acc.type === 'bank' ? Building2 : acc.type === 'e_money' ? CreditCard : acc.type === 'cash' ? Banknote : Wallet;
              const pct = totalBalance > 0 ? Math.round((acc.balance / totalBalance) * 100) : 0;

              return (
                <div key={acc.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{acc.name}</span>
                    </div>
                    <span className="font-semibold font-mono tabular-nums text-foreground shrink-0">
                      {formatIDR(acc.balance)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <span className="text-sm font-semibold text-foreground">Recurring Subscriptions</span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {formatIDR(monthlySubsTotal)}/mo
            </span>
          </div>
          <div className="space-y-3">
            {activeSubs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No active subscriptions.</p>
            ) : (
              activeSubs.slice(0, 4).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || '#2563EB' }}
                    />
                    <span className="font-medium text-foreground truncate">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-muted-foreground text-[11px] flex items-center gap-1 font-mono">
                      <Calendar className="size-3" /> {sub.nextBillingDate}
                    </span>
                    <span className="font-semibold font-mono text-foreground tabular-nums">{formatIDR(sub.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Budgets Realization */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Monthly Budgets ({currentMonth})</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {formatIDR(totalSpentBudget)} / {formatIDR(totalAllocatedBudget)}
          </span>
        </div>

        {monthBudgets.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            No budgets configured for {currentMonth}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthBudgets.map((b) => {
              const isOver = b.spent > b.allocated;
              const isWarn = !isOver && b.pct >= 80;
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground truncate">{b.name}</span>
                    <span className="font-mono tabular-nums shrink-0 text-[11px]">
                      <span className={isOver ? 'text-rose-500 font-semibold' : isWarn ? 'text-amber-500 font-semibold' : 'text-foreground'}>
                        {formatIDR(b.spent)}
                      </span>
                      <span className="text-muted-foreground"> / {formatIDR(b.allocated)} ({b.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuickActionModal
        open={quickModalOpen}
        onOpenChange={setQuickModalOpen}
        defaultTab="expense"
      />
    </div>
  );
}
