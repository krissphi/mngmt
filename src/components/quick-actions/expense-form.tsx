'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { ItemDestinationAction, AssetCondition } from '@/types';
import { getLocalDateString } from '@/lib/date';
import { CategorySubSelect } from '@/components/shared/category-sub-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { formatIDR } from '@/lib/currency';
import { Sparkles, Box, Tag } from 'lucide-react';

interface ExpenseFormProps {
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { accounts, categories, addTransaction } = useStore();

  const [trxDate, setTrxDate] = useState(() => getLocalDateString());
  const [trxAmount, setTrxAmount] = useState('');
  const [trxAccount, setTrxAccount] = useState(() => accounts[0]?.id || '');
  const [trxCategory, setTrxCategory] = useState('');
  const [trxSubCategory, setTrxSubCategory] = useState('');
  const [trxDesc, setTrxDesc] = useState('');

  // Item destination: none (standard expense), collect, or sell
  const [itemAction, setItemAction] = useState<ItemDestinationAction>('none');
  const [itemCondition, setItemCondition] = useState<AssetCondition>('mint');
  const [itemBrand, setItemBrand] = useState('');

  const suggestCollectIfMatching = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const lower = cat.name.toLowerCase();
    if (
      lower.includes('mainan') ||
      lower.includes('toys') ||
      lower.includes('koleksi') ||
      lower.includes('figure') ||
      lower.includes('collectibles') ||
      lower.includes('hobbies')
    ) {
      if (itemAction === 'none') {
        setItemAction('collect');
      }
    }
  };

  const handleCategoryChange = (catId: string) => {
    setTrxCategory(catId);
    suggestCollectIfMatching(catId);
  };

  const handleSubCategoryChange = (subId: string) => {
    setTrxSubCategory(subId);
    suggestCollectIfMatching(subId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(trxAmount);
    if (!amountNum || amountNum <= 0) return;
    if (!trxDesc.trim()) return;

    const selectedMainCat = categories.find((c) => c.id === trxCategory);
    const isBusinessCat = selectedMainCat?.type === 'business_expense';

    addTransaction({
      date: trxDate,
      scope: itemAction === 'sell' || isBusinessCat ? 'business' : 'personal',
      type: 'expense',
      amount: amountNum,
      accountId: trxAccount || accounts[0]?.id,
      categoryId: trxCategory || undefined,
      subCategoryId: trxSubCategory || undefined,
      sourceModule:
        itemAction === 'sell'
          ? 'business_purchase'
          : isBusinessCat
          ? 'business_expense'
          : 'personal_expense',
      description: trxDesc.trim(),
      itemAction,
      itemCondition: itemAction === 'collect' ? itemCondition : undefined,
      itemBrand: itemBrand.trim() || undefined,
    });

    if (itemAction === 'collect') {
      onSuccess('Expense recorded & item automatically added to Collection!');
    } else if (itemAction === 'sell') {
      onSuccess('Expense recorded & product added to Seller inventory!');
    } else {
      onSuccess('Expense recorded successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
          <Input type="date" value={trxDate} onChange={(e) => setTrxDate(e.target.value)} required className="h-8.5 text-xs" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (IDR)</label>
          <Input
            type="number"
            placeholder="e.g. 250000"
            value={trxAmount}
            onChange={(e) => setTrxAmount(e.target.value)}
            required
            min={1}
            className="h-8.5 text-xs font-semibold"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Pocket</label>
        <select
          className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
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
        flow="expense"
        categoryId={trxCategory}
        subCategoryId={trxSubCategory}
        onCategoryChange={handleCategoryChange}
        onSubCategoryChange={handleSubCategoryChange}
      />

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Item Name / Description</label>
        <Input
          placeholder="e.g. Gundam Barbatos MG, Lunch with team, Gasoline..."
          value={trxDesc}
          onChange={(e) => setTrxDesc(e.target.value)}
          required
          className="h-8.5 text-xs"
        />
      </div>

      {/* Item Destination (Standard vs Collect vs Sell) */}
      <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-2.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Item Destination:</span>
          <span className="text-[11px] text-muted-foreground font-normal">Auto-create collection or stock</span>
        </label>

        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setItemAction('none')}
            className={`p-2 rounded-md border flex flex-col items-center justify-center gap-1 transition-all ${
              itemAction === 'none'
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <Box className="size-3.5" />
            <span className="text-[11px]">Standard Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setItemAction('collect')}
            className={`p-2 rounded-md border flex flex-col items-center justify-center gap-1 transition-all ${
              itemAction === 'collect'
                ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs'
                : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="size-3.5" />
            <span className="text-[11px]">Collection</span>
          </button>

          <button
            type="button"
            onClick={() => setItemAction('sell')}
            className={`p-2 rounded-md border flex flex-col items-center justify-center gap-1 transition-all ${
              itemAction === 'sell'
                ? 'border-amber-600 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs'
                : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tag className="size-3.5" />
            <span className="text-[11px]">Seller Inventory</span>
          </button>
        </div>

        {itemAction === 'collect' && (
          <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs animate-in fade-in duration-200">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Condition</label>
              <select
                className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none"
                value={itemCondition}
                onChange={(e) => setItemCondition(e.target.value as AssetCondition)}
              >
                <option value="mint">Mint / Brand New (MISB/BNIB)</option>
                <option value="good">Good / Well Kept</option>
                <option value="fair">Fair / Standard</option>
                <option value="needs_repair">Needs Repair / Flawed</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Brand / Line (Optional)</label>
              <Input
                placeholder="e.g. Bandai, Hasbro, Good Smile"
                value={itemBrand}
                onChange={(e) => setItemBrand(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="sm:col-span-2 text-[10px] text-emerald-600 dark:text-emerald-400">
              Item will be automatically saved to your <b>Collection</b> without manual entry.
            </div>
          </div>
        )}

        {itemAction === 'sell' && (
          <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs animate-in fade-in duration-200">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Brand / Manufacturer (Optional)</label>
              <Input
                placeholder="e.g. Bandai, Hot Toys, Generic"
                value={itemBrand}
                onChange={(e) => setItemBrand(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center text-[10px] text-amber-600 dark:text-amber-400">
              Item will be added to your <b>Seller</b> product catalog with an initial stock of 1 unit.
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="destructive" className="text-xs font-medium">
          Save Expense
        </Button>
      </DialogFooter>
    </form>
  );
}
