'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/states/state-views';
import { CreditCard, Plus, Trash2, Calendar, CheckCircle2, PauseCircle, PlayCircle, Pencil } from 'lucide-react';
import { SubscriptionDialog } from './subscription-dialog';
import { PaySubscriptionDialog } from './pay-subscription-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

export function SubscriptionsTab() {
  const { subscriptions, accounts, categories, updateSubscription, deleteSubscription, paySubscription } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [payingSub, setPayingSub] = useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { monthlyTotal, activeCount } = useMemo(() => {
    let total = 0;
    let active = 0;
    for (const sub of subscriptions) {
      if (sub.status === 'active') {
        active++;
        if (sub.billingCycle === 'monthly' || sub.billingCycle === '28_days') total += sub.amount;
        else if (sub.billingCycle === 'yearly') total += Math.round(sub.amount / 12);
        else if (sub.billingCycle === 'weekly') total += sub.amount * 4;
      }
    }
    return { monthlyTotal: total, activeCount: active };
  }, [subscriptions]);

  const handleOpenAdd = () => {
    setSelectedSub(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (sub: Subscription) => {
    setSelectedSub(sub);
    setDialogOpen(true);
  };

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const getAccountName = (id: string) => accountMap.get(id) || 'Main Account';
  const getCategoryName = (id?: string) => (id ? categoryMap.get(id) : undefined) || 'Subscription';
  const subToDelete = subscriptions.find((s) => s.id === deletingId);

  return (
    <div className="space-y-4">
      {/* Standard Tab Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-medium">
          Estimated Recurring Expenses: <b className="text-foreground">{formatIDR(monthlyTotal)}</b> / month ({activeCount} active subscriptions)
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="text-xs h-8 bg-primary text-primary-foreground font-medium gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Add Subscription</span>
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="size-8" />}
          title="No Subscriptions Registered"
          description="Track recurring services such as Netflix, Spotify, cloud storage, or monthly data plans."
          action={<Button size="sm" onClick={handleOpenAdd}>+ Add First Subscription</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            const isPaused = sub.status === 'paused';
            return (
              <div
                key={sub.id}
                className={`p-4 rounded-xl border transition-all space-y-3 bg-card ${
                  isPaused ? 'border-border/50 opacity-60' : 'border-border shadow-2xs hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                      style={{ backgroundColor: sub.color || '#2563EB' }}
                    >
                      {sub.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{sub.name}</h4>
                      <div className="text-[11px] text-muted-foreground">
                        {getCategoryName(sub.categoryId)} • {getAccountName(sub.accountId)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground tabular-nums whitespace-nowrap">{formatIDR(sub.amount)}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">
                      / {sub.billingCycle === '28_days' ? '28 days' : sub.billingCycle === 'monthly' ? 'month' : sub.billingCycle === 'yearly' ? 'year' : 'week'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-muted/40 text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap shrink-0">
                    <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>Next Billing: <strong className="text-foreground font-semibold">{sub.nextBillingDate}</strong></span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${isPaused ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {isPaused ? 'Paused' : 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-600/30 font-medium"
                    onClick={() => setPayingSub(sub)}
                    title="Record expense and advance next billing date"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Pay Bill</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                      title="Edit subscription"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => updateSubscription(sub.id, { status: isPaused ? 'active' : 'paused' })}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                      title={isPaused ? 'Resume Subscription' : 'Pause Subscription'}
                    >
                      {isPaused ? <PlayCircle className="size-3.5" /> : <PauseCircle className="size-3.5" />}
                    </button>
                    <button
                      onClick={() => setDeletingId(sub.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                      title="Delete Subscription"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscription Dialog */}
      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialSubscription={selectedSub}
      />

      {/* Pay Bill Confirmation & Customization Dialog */}
      <PaySubscriptionDialog
        open={!!payingSub}
        onOpenChange={(open) => !open && setPayingSub(null)}
        subscription={payingSub}
        onConfirm={(subId, details) => {
          paySubscription(subId, details);
          setPayingSub(null);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Subscription Service?"
        description={`Are you sure you want to delete subscription "${subToDelete?.name}"? Historical payment records will remain in your general ledger.`}
        confirmText="Delete Subscription"
        cancelText="Cancel"
        onConfirm={() => {
          if (deletingId) {
            deleteSubscription(deletingId);
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
}
