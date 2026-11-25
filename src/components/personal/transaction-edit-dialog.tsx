'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Transaction } from '@/types';
import { formatIDR } from '@/lib/currency';
import { CategorySubSelect } from '@/components/shared/category-sub-select';
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

interface TransactionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function TransactionEditDialog({ open, onOpenChange, transaction }: TransactionEditDialogProps) {
  const { accounts, categories, updateTransaction } = useStore();
  const [prevKey, setPrevKey] = useState('');

  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const syncKey = `${open}-${transaction?.id || ''}`;
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open && transaction) {
      setDate(transaction.date);
      setAmount(String(transaction.amount));
      setAccountId(transaction.accountId);
      setToAccountId(transaction.toAccountId || '');
      setCategoryId(transaction.categoryId || '');
      setSubCategoryId(transaction.subCategoryId || '');
      setDescription(transaction.description);
      setNotes(transaction.notes || '');
    }
  }

  if (!transaction) return null;

  const isTransfer = transaction.type === 'transfer';
  const isGoalDeposit = isTransfer && transaction.sourceModule === 'savings_deposit';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0 || !description.trim()) return;
    if (isTransfer && !isGoalDeposit && (!toAccountId || toAccountId === accountId)) return;

    updateTransaction(transaction.id, {
      date,
      amount: numericAmount,
      accountId,
      toAccountId: isTransfer && !isGoalDeposit ? toAccountId : undefined,
      categoryId: isTransfer ? undefined : categoryId || undefined,
      subCategoryId: isTransfer ? undefined : subCategoryId || undefined,
      description: description.trim(),
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Edit Transaction</DialogTitle>
          <DialogDescription className="text-xs">
            Update details for this {transaction.type}. Associated pocket balances will adjust automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-8.5 text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (IDR)</label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-8.5 text-xs font-semibold"
              />
            </div>
          </div>

          <div className={`grid grid-cols-1 ${isTransfer && !isGoalDeposit ? 'sm:grid-cols-2' : ''} gap-3`}>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {isTransfer ? 'Source Pocket' : 'Pocket'}
              </label>
              <select
                className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatIDR(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            {isTransfer && !isGoalDeposit && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Destination Pocket</label>
                <select
                  className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === accountId}>
                      {a.name} ({formatIDR(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!isTransfer && (
            <CategorySubSelect
              categories={categories}
              flow={transaction.type === 'income' ? 'income' : 'expense'}
              categoryId={categoryId}
              subCategoryId={subCategoryId}
              onCategoryChange={setCategoryId}
              onSubCategoryChange={setSubCategoryId}
            />
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="h-8.5 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes (Optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note..."
              className="h-8.5 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground text-xs font-medium">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
