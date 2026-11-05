'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Subscription } from '@/types';
import { formatIDR } from '@/lib/currency';
import { advanceNextBillingDate } from '@/context/store-handlers';
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
import { Calendar, ArrowRight, CheckCircle2, Wallet, Info } from 'lucide-react';

interface PaySubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onConfirm: (subId: string, details: { accountId: string; date: string; amount: number }) => void;
}

interface PaySubscriptionFormProps {
  subscription: Subscription;
  onClose: () => void;
  onConfirm: (subId: string, details: { accountId: string; date: string; amount: number }) => void;
}

function PaySubscriptionForm({ subscription, onClose, onConfirm }: PaySubscriptionFormProps) {
  const { accounts, categories } = useStore();

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState(() => subscription.accountId || accounts[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState(() => String(subscription.amount));

  const activeAccounts = accounts.filter((a) => a.isActive);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const category = categories.find((c) => c.id === subscription.categoryId);
  const parsedAmount = Number(paymentAmount) || subscription.amount;

  const currentNextBilling = subscription.nextBillingDate || paymentDate;
  const advancedNextBilling = advanceNextBillingDate(currentNextBilling, subscription.billingCycle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || parsedAmount <= 0) return;

    onConfirm(subscription.id, {
      accountId: selectedAccountId,
      date: paymentDate,
      amount: parsedAmount,
    });
  };

  const cycleLabel =
    subscription.billingCycle === '28_days'
      ? '28 days'
      : subscription.billingCycle === 'monthly'
      ? 'Monthly'
      : subscription.billingCycle === 'yearly'
      ? 'Yearly'
      : 'Weekly';

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base font-semibold flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Pay Subscription Bill</span>
        </DialogTitle>
        <DialogDescription className="text-xs">
          Confirm bill payment to record this expense in your ledger and advance the billing cycle.
        </DialogDescription>
      </DialogHeader>

      {/* Subscription Info Card */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="size-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: subscription.color || '#2563EB' }}
            >
              {subscription.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">{subscription.name}</h4>
              <div className="text-[11px] text-muted-foreground">
                {category?.name || 'Subscription'} • {cycleLabel} Cycle
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-sm text-foreground tabular-nums">
              {formatIDR(subscription.amount)}
            </div>
            <div className="text-[10px] text-muted-foreground">Standard rate</div>
          </div>
        </div>

        {/* Billing Date Advancement Preview */}
        <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Current Due</span>
            <div className="font-medium text-foreground flex items-center gap-1 text-[11px]">
              <Calendar className="size-3 text-muted-foreground" />
              <span>{currentNextBilling}</span>
            </div>
          </div>

          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />

          <div className="text-right space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">New Next Billing</span>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 text-[11px]">
              <span>{advancedNextBilling}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
        {/* Payment Account */}
        <div>
          <label className="text-xs font-medium text-foreground block mb-1 flex items-center gap-1.5">
            <Wallet className="size-3 text-muted-foreground" />
            <span>Payment Account</span>
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            required
            className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
          >
            {activeAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatIDR(acc.balance)})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Payment Amount (Rp)</label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
              min={1}
              className="h-8.5 text-xs bg-card"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Payment Date</label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="h-8.5 text-xs bg-card"
            />
          </div>
        </div>

        {/* Ledger Effect Summary Note */}
        <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <Info className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Will deduct <strong>{formatIDR(parsedAmount)}</strong> from{' '}
            <strong>{selectedAccount?.name || 'Account'}</strong>, create an expense transaction, and advance the next billing date to <strong>{advancedNextBilling}</strong>.
          </span>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 shadow-2xs"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Confirm & Pay Bill</span>
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function PaySubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}: PaySubscriptionDialogProps) {
  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <PaySubscriptionForm
          key={subscription.id}
          subscription={subscription}
          onClose={() => onOpenChange(false)}
          onConfirm={onConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}
