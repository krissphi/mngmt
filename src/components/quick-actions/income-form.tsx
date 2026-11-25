'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { getLocalDateString } from '@/lib/date';
import { CategorySubSelect } from '@/components/shared/category-sub-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { formatIDR } from '@/lib/currency';

interface IncomeFormProps {
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}

export function IncomeForm({ onSuccess, onCancel }: IncomeFormProps) {
  const { accounts, categories, addTransaction } = useStore();

  const [trxDate, setTrxDate] = useState(() => getLocalDateString());
  const [trxAmount, setTrxAmount] = useState('');
  const [trxAccount, setTrxAccount] = useState(() => accounts[0]?.id || '');
  const [trxCategory, setTrxCategory] = useState('');
  const [trxSubCategory, setTrxSubCategory] = useState('');
  const [trxDesc, setTrxDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(trxAmount);
    if (!amountNum || amountNum <= 0) return;
    if (!trxDesc.trim()) return;

    addTransaction({
      date: trxDate,
      scope: 'personal',
      type: 'income',
      amount: amountNum,
      accountId: trxAccount || accounts[0]?.id,
      categoryId: trxCategory || undefined,
      subCategoryId: trxSubCategory || undefined,
      sourceModule: 'personal_income',
      description: trxDesc.trim(),
    });

    onSuccess('Income recorded successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
          <Input type="date" value={trxDate} onChange={(e) => setTrxDate(e.target.value)} required className="h-8.5 text-xs" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (IDR)</label>
          <Input
            type="number"
            placeholder="e.g. 5000000"
            value={trxAmount}
            onChange={(e) => setTrxAmount(e.target.value)}
            required
            min={1}
            className="h-8.5 text-xs font-semibold"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Destination Pocket</label>
        <select
          className="w-full h-8.5 rounded-md border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none"
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

      <CategorySubSelect
        categories={categories}
        allowedTypes={['personal_income']}
        categoryId={trxCategory}
        subCategoryId={trxSubCategory}
        onCategoryChange={setTrxCategory}
        onSubCategoryChange={setTrxSubCategory}
      />

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Description / Income Source</label>
        <Input
          placeholder="e.g. Monthly salary, freelance project, bonus..."
          value={trxDesc}
          onChange={(e) => setTrxDesc(e.target.value)}
          required
          className="h-8.5 text-xs"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs">
          Save Income
        </Button>
      </DialogFooter>
    </form>
  );
}
