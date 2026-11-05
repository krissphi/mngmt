'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, CreditCard, Banknote, Wallet, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickActionModal } from '@/components/shared/quick-action-modal';

export function PersonalSummaryTab() {
  const { accounts, transactions, wishlist, subscriptions } = useStore();
  const [currentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
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

  return (
    <div className="space-y-4">
      {/* Standard Tab Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-medium">
          Personal Financial Overview, Monthly Inflows & Savings Allocations
        </div>

        <Button
          onClick={() => setQuickModalOpen(true)}
          size="sm"
          className="text-xs h-8 gap-1.5 self-start sm:self-auto bg-primary text-primary-foreground font-medium"
        >
          <Plus className="size-3.5" />
          <span>Add Transaction</span>
        </Button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Cash & Accounts" value={formatIDR(totalBalance)} />
        <StatCard title="Income This Month" value={formatIDR(monthIncome)} />
        <StatCard title="Expenses This Month" value={formatIDR(monthExpense)} />
        <StatCard
          title="Planned Wishlist"
          value={formatIDR(plannedWishlistTotal)}
          subtitle={`${plannedWishlistCount} items pending`}
        />
      </div>

      {/* Account Balances & Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/60 bg-card">
          <CardHeader className="py-3.5 px-5 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-foreground">Liquid Account Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {accounts.map((acc) => {
              const Icon =
                acc.type === 'bank' ? Building2 : acc.type === 'e_wallet' ? CreditCard : acc.type === 'cash' ? Banknote : Wallet;
              const pct = totalBalance > 0 ? Math.round((acc.balance / totalBalance) * 100) : 0;

              return (
                <div key={acc.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{acc.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground">{formatIDR(acc.balance)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader className="py-3.5 px-5 border-b border-border/60 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">Recurring Subscriptions</CardTitle>
            <span className="text-xs text-muted-foreground font-normal">
              Est. {formatIDR(monthlySubsTotal)}/mo
            </span>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {activeSubs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No active subscriptions.</p>
            ) : (
              activeSubs.slice(0, 4).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: sub.color || '#2563EB' }}
                    />
                    <span className="font-medium text-foreground">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                      <Calendar className="size-3" /> {sub.nextBillingDate}
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">{formatIDR(sub.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <QuickActionModal
        open={quickModalOpen}
        onOpenChange={setQuickModalOpen}
        defaultTab="expense"
      />
    </div>
  );
}
