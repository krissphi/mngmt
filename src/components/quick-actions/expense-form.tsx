'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { formatIDR } from '@/lib/currency';

interface ExpenseFormProps {
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { accounts, categories, addTransaction } = useStore();

  const [trxDate, setTrxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [trxAmount, setTrxAmount] = useState('');
  const [trxAccount, setTrxAccount] = useState(() => accounts[0]?.id || '');
  const [trxCategory, setTrxCategory] = useState('');
  const [trxDesc, setTrxDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxAmount || Number(trxAmount) <= 0) return;

    addTransaction({
      date: trxDate,
      scope: 'personal',
      type: 'expense',
      amount: Number(trxAmount),
      accountId: trxAccount || accounts[0]?.id,
      categoryId: trxCategory || undefined,
      sourceModule: 'personal_expense',
      description: trxDesc || 'Personal Expense',
    });

    onSuccess('Personal expense recorded successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
          <Input type="date" value={trxDate} onChange={(e) => setTrxDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (Rp)</label>
          <Input
            type="number"
            placeholder="e.g. 150000"
            value={trxAmount}
            onChange={(e) => setTrxAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Funding Account</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm"
            value={trxAccount}
            onChange={(e) => setTrxAccount(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatIDR(a.balance)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Expense Category</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm"
            value={trxCategory}
            onChange={(e) => setTrxCategory(e.target.value)}
          >
            <option value="">Select Category...</option>
            <optgroup label="Personal Expenses">
              {categories
                .filter((c) => c.type === 'personal_expense')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Business Expenses">
              {categories
                .filter((c) => c.type === 'business_expense')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Description / Notes</label>
        <Input
          placeholder="e.g. Lunch with team, monthly internet, packaging boxes..."
          value={trxDesc}
          onChange={(e) => setTrxDesc(e.target.value)}
          required
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive">
          Save Expense
        </Button>
      </DialogFooter>
    </form>
  );
}
