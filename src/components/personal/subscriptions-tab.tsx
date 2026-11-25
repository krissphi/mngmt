'use client';

import React, { useState, useMemo } from 'react';
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { getLocalDateString } from '@/lib/date';
import { resolveCategoryPair } from '@/lib/categories';
import { Subscription } from '@/types';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Button } from '@/components/ui/button';
import { EmptyState, NoSearchResultState } from '@/components/states/state-views';
import { CreditCard, Plus, Trash2, Calendar, CheckCircle2, PauseCircle, PlayCircle, Pencil } from 'lucide-react';
import { SubscriptionDialog } from './subscription-dialog';
import { PaySubscriptionDialog } from './pay-subscription-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

type SubFilter = 'all' | 'active' | 'paused';

function getCycleSuffix(cycle: Subscription['billingCycle']): string {
  if (cycle === '28_days') return '/ 28d';
  if (cycle === 'yearly') return '/ yr';
  if (cycle === 'weekly') return '/ wk';
  return '/ mo';
}

export function SubscriptionsTab() {
  const { subscriptions, accounts, categories, updateSubscription, deleteSubscription, paySubscription } = useStore();
  const [statusFilter, setStatusFilter] = useState<SubFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [payingSub, setPayingSub] = useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayStr = getLocalDateString();

  const { monthlyTotal, activeCount, pausedCount, dueSoonCount } = useMemo(() => {
    let total = 0;
    let active = 0;
    let paused = 0;
    let dueSoon = 0;
    const todayDate = parseISO(todayStr);

    for (const sub of subscriptions) {
      if (sub.status === 'active') {
        active++;
        if (sub.billingCycle === 'monthly' || sub.billingCycle === '28_days') total += sub.amount;
        else if (sub.billingCycle === 'yearly') total += Math.round(sub.amount / 12);
        else if (sub.billingCycle === 'weekly') total += sub.amount * 4;

        if (sub.nextBillingDate) {
          const next = parseISO(sub.nextBillingDate);
          if (isValid(next) && isValid(todayDate)) {
            const diff = differenceInCalendarDays(next, todayDate);
            if (diff <= 7) dueSoon++;
          }
        }
      } else {
        paused++;
      }
    }
    return { monthlyTotal: total, activeCount: active, pausedCount: paused, dueSoonCount: dueSoon };
  }, [subscriptions, todayStr]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      if (statusFilter === 'active') return sub.status === 'active';
      if (statusFilter === 'paused') return sub.status === 'paused';
      return true;
    });
  }, [subscriptions, statusFilter]);

  const handleOpenAdd = () => {
    setSelectedSub(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (sub: Subscription) => {
    setSelectedSub(sub);
    setDialogOpen(true);
  };

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const getAccountName = (id: string) => accountMap.get(id) || 'Pocket';
  const subToDelete = subscriptions.find((s) => s.id === deletingId);

  return (
    <div className="space-y-6">
      <SummaryBanner
        label="Monthly Recurring Estimate"
        value={formatIDR(monthlyTotal)}
        meta={[
          `${subscriptions.length} ${subscriptions.length === 1 ? 'Service' : 'Services'}`,
          `${activeCount} Active`,
          `${pausedCount} Paused`,
          ...(dueSoonCount > 0 ? [`${dueSoonCount} Due Soon`] : []),
        ]}
        actions={
          <>
            <div className="inline-flex p-0.5 bg-secondary/40 backdrop-blur-xs rounded-xl border border-border/40 gap-0.5">
              {(['all', 'active', 'paused'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize font-medium transition-all ${
                    statusFilter === st
                      ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="text-xs h-8.5 bg-foreground text-background hover:bg-foreground/90 font-medium gap-1.5 rounded-lg shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>Add Subscription</span>
            </Button>
          </>
        }
      />

      {filteredSubscriptions.length === 0 ? (
        subscriptions.length > 0 ? (
          <NoSearchResultState query={statusFilter} onReset={() => setStatusFilter('all')} />
        ) : (
          <EmptyState
            icon={<CreditCard className="size-8" />}
            title="No Subscriptions Registered"
            description="Track recurring services such as Netflix, Spotify, cloud storage, or monthly data plans."
            action={<Button size="sm" onClick={handleOpenAdd}>+ Add First Subscription</Button>}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => {
            const isPaused = sub.status === 'paused';
            const resolvedCat = resolveCategoryPair(categories, sub.categoryId, sub.subCategoryId, '');
            const leafCategory = resolvedCat.subName || resolvedCat.mainName;
            const accent = sub.color || '#2563EB';

            let dueStatus: 'paused' | 'overdue' | 'soon' | 'active' = isPaused ? 'paused' : 'active';
            if (!isPaused && sub.nextBillingDate) {
              const nextDate = parseISO(sub.nextBillingDate);
              const todayDate = parseISO(todayStr);
              if (isValid(nextDate) && isValid(todayDate)) {
                const daysLeft = differenceInCalendarDays(nextDate, todayDate);
                if (daysLeft < 0) dueStatus = 'overdue';
                else if (daysLeft <= 7) dueStatus = 'soon';
              }
            }

            const statusBadgeClass =
              dueStatus === 'paused'
                ? 'bg-muted text-muted-foreground border-border/50'
                : dueStatus === 'overdue'
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : dueStatus === 'soon'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

            const statusLabel =
              dueStatus === 'paused'
                ? 'Paused'
                : dueStatus === 'overdue'
                ? 'Overdue'
                : dueStatus === 'soon'
                ? 'Due Soon'
                : 'Active';

            return (
              <div
                key={sub.id}
                className={`group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 hover:border-border/90 hover:bg-card/90 transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isPaused ? 'opacity-65' : ''
                }`}
              >
                {/* Header: Monogram, Name, Concise Category + Hover Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="size-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border"
                      style={{
                        backgroundColor: `${accent}18`,
                        borderColor: `${accent}35`,
                        color: accent,
                      }}
                    >
                      {sub.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-foreground leading-snug break-words">
                        {sub.name}
                      </h4>
                      {leafCategory && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {leafCategory}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
                      title="Edit subscription"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => updateSubscription(sub.id, { status: isPaused ? 'active' : 'paused' })}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
                      title={isPaused ? 'Resume Subscription' : 'Pause Subscription'}
                    >
                      {isPaused ? <PlayCircle className="size-3.5" /> : <PauseCircle className="size-3.5" />}
                    </button>
                    <button
                      onClick={() => setDeletingId(sub.id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-accent/60 transition-colors"
                      title="Delete Subscription"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Hero: Billing Amount + Clean Due Date Line */}
                <div>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                      {formatIDR(sub.amount)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {getCycleSuffix(sub.billingCycle)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                      <Calendar className="size-3 shrink-0" />
                      <span>Next {sub.nextBillingDate}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Footer: Payment Pocket & Quick Pay Action */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground truncate pr-2">
                    {getAccountName(sub.accountId)}
                  </span>

                  <button
                    onClick={() => setPayingSub(sub)}
                    className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 font-medium py-0.5 shrink-0 transition-colors"
                    title="Record expense and advance next billing date"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Pay Bill</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialSubscription={selectedSub}
      />

      <PaySubscriptionDialog
        open={!!payingSub}
        onOpenChange={(open) => !open && setPayingSub(null)}
        subscription={payingSub}
        onConfirm={(subId, details) => {
          paySubscription(subId, details);
          setPayingSub(null);
        }}
      />

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
