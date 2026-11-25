'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { formatCompactIDR } from '@/lib/currency';
import { getLocalDateString } from '@/lib/date';
import { CategorySubSelect } from '@/components/shared/category-sub-select';
import { BillingCycle, Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSubscription?: Subscription | null;
}

export function SubscriptionDialog({ open, onOpenChange, initialSubscription }: SubscriptionDialogProps) {
  const { accounts, categories, addSubscription, updateSubscription } = useStore();
  const [prevKey, setPrevKey] = useState('');
  const [name, setName] = useState(initialSubscription?.name || '');
  const [amount, setAmount] = useState(initialSubscription ? String(initialSubscription.amount) : '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialSubscription?.billingCycle || 'monthly');
  const [billingDay, setBillingDay] = useState(initialSubscription?.billingDay || 1);
  const [accountId, setAccountId] = useState(initialSubscription?.accountId || accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(initialSubscription?.categoryId || '');
  const [subCategoryId, setSubCategoryId] = useState(initialSubscription?.subCategoryId || '');

  const isEdit = Boolean(initialSubscription);
  const syncKey = `${open}-${initialSubscription?.id || 'new'}`;

  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open) {
      if (initialSubscription) {
        setName(initialSubscription.name);
        setAmount(String(initialSubscription.amount));
        setBillingCycle(initialSubscription.billingCycle);
        setBillingDay(initialSubscription.billingDay);
        setAccountId(initialSubscription.accountId);
        setCategoryId(initialSubscription.categoryId || '');
        setSubCategoryId(initialSubscription.subCategoryId || '');
      } else {
        setName('');
        setAmount('');
        setBillingCycle('monthly');
        setBillingDay(1);
        setAccountId(accounts[0]?.id || '');
        setCategoryId('');
        setSubCategoryId('');
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount.replace(/\D/g, ''));
    if (!name.trim() || num <= 0 || !accountId) return;

    if (initialSubscription) {
      updateSubscription(initialSubscription.id, {
        name: name.trim(),
        amount: num,
        billingCycle,
        billingDay: Number(billingDay),
        accountId,
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
      });
    } else {
      const today = new Date();
      let nextDate: Date;
      if (billingCycle === '28_days') {
        nextDate = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000);
      } else {
        nextDate = new Date(today.getFullYear(), today.getMonth(), billingDay);
        if (nextDate < today) nextDate.setMonth(nextDate.getMonth() + 1);
      }

      addSubscription({
        name: name.trim(),
        amount: num,
        billingCycle,
        billingDay: Number(billingDay),
        accountId,
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        status: 'active',
        nextBillingDate: getLocalDateString(nextDate),
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Subscription' : 'Add Subscription'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? 'Update recurring cost, billing cycle, or payment account.'
              : 'Track software, streaming, and utility subscriptions to stay on top of recurring bills.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Service Name</label>
              <Input
                placeholder="e.g. Netflix 4K, Spotify Premium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Billing Amount (Rp)</label>
              <Input
                type="number"
                placeholder="e.g. 186000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-xs"
              >
                <option value="monthly">Monthly</option>
                <option value="28_days">Every 28 Days (Cellular Plan)</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Billing Day (1 - 31)</label>
              <Input
                type="number"
                min={1}
                max={31}
                value={billingDay}
                onChange={(e) => setBillingDay(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Payment Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-xs"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCompactIDR(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          <CategorySubSelect
            categories={categories}
            flow="expense"
            categoryId={categoryId}
            subCategoryId={subCategoryId}
            onCategoryChange={setCategoryId}
            onSubCategoryChange={setSubCategoryId}
          />

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
              {isEdit ? 'Save Changes' : 'Save Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
