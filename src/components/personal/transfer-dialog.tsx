'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { getLocalDateString } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowRightLeft, AlertCircle } from 'lucide-react';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSourceId?: string;
  onSuccess?: () => void;
}

export function TransferDialog({ open, onOpenChange, defaultSourceId, onSuccess }: TransferDialogProps) {
  const { accounts, addTransaction } = useStore();

  const [fromAccountId, setFromAccountId] = useState(() => defaultSourceId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(() => accounts.find((a) => a.id !== fromAccountId)?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Sync if defaultSourceId changes
  const [prevDefaultSource, setPrevDefaultSource] = useState(defaultSourceId);
  if (defaultSourceId !== prevDefaultSource) {
    setPrevDefaultSource(defaultSourceId);
    if (defaultSourceId) {
      setFromAccountId(defaultSourceId);
      if (toAccountId === defaultSourceId) {
        const other = accounts.find((a) => a.id !== defaultSourceId);
        if (other) setToAccountId(other.id);
      }
    }
  }

  const sourceAccount = accounts.find((a) => a.id === fromAccountId);
  const destAccount = accounts.find((a) => a.id === toAccountId);
  const numAmount = Number(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setError('Please select source and destination pockets.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Source and destination pockets cannot be the same.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid transfer amount.');
      return;
    }

    setError('');

    const desc = notes.trim()
      ? `Transfer: ${sourceAccount?.name} to ${destAccount?.name} (${notes.trim()})`
      : `Transfer: ${sourceAccount?.name} to ${destAccount?.name}`;

    addTransaction({
      date,
      scope: 'personal',
      type: 'transfer',
      amount: numAmount,
      accountId: fromAccountId,
      toAccountId: toAccountId,
      sourceModule: 'transfer',
      description: desc,
      notes: notes.trim() || undefined,
    });

    setAmount('');
    setNotes('');
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowRightLeft className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Transfer Between Pockets</DialogTitle>
              <DialogDescription className="text-xs">
                Move funds between your cash wallets, bank accounts, or digital e-wallets.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                From Pocket (Source)
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatIDR(a.balance)})
                  </option>
                ))}
              </select>
              {sourceAccount && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Balance: <b className="text-foreground">{formatIDR(sourceAccount.balance)}</b>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                To Pocket (Destination)
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                    {a.name} ({formatIDR(a.balance)})
                  </option>
                ))}
              </select>
              {destAccount && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Balance: <b className="text-foreground">{formatIDR(destAccount.balance)}</b>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Transfer Amount (IDR)
            </label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={1}
              className="font-semibold text-sm"
            />
            {numAmount > 0 && (
              <div className="text-xs text-primary font-medium mt-1">
                {formatIDR(numAmount)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-8.5 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Note (Optional)</label>
              <Input
                placeholder="e.g. ATM withdrawal, GoPay top-up"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium text-xs gap-1.5">
              <ArrowRightLeft className="size-3.5" />
              <span>Send Transfer</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
