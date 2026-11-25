'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { getLocalDateString } from '@/lib/date';
import { IncomeForm } from '@/components/quick-actions/income-form';
import { ExpenseForm } from '@/components/quick-actions/expense-form';
import { SaleForm } from '@/components/quick-actions/sale-form';
import { ProductForm } from '@/components/quick-actions/product-form';
import { AssetForm } from '@/components/quick-actions/asset-form';

export type QuickActionTab = 'income' | 'expense' | 'transfer' | 'sale' | 'product' | 'asset';

interface QuickActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: QuickActionTab;
}

function InlineTransferForm({ onSuccess, onCancel }: { onSuccess: (msg: string) => void; onCancel: () => void }) {
  const { accounts, addTransaction } = useStore();
  const [fromAccountId, setFromAccountId] = useState(() => accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(() => accounts.find((a) => a.id !== fromAccountId)?.id || accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [notes, setNotes] = useState('');

  const numAmount = Number(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) return;
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) return;

    const source = accounts.find((a) => a.id === fromAccountId);
    const dest = accounts.find((a) => a.id === toAccountId);

    const desc = notes.trim()
      ? `Transfer: ${source?.name} to ${dest?.name} (${notes.trim()})`
      : `Transfer: ${source?.name} to ${dest?.name}`;

    addTransaction({
      date,
      scope: 'personal',
      type: 'transfer',
      amount: numAmount,
      accountId: fromAccountId,
      toAccountId,
      sourceModule: 'transfer',
      description: desc,
      notes: notes.trim() || undefined,
    });

    onSuccess('Transfer completed successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">From Pocket (Source)</label>
          <select
            className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
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
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">To Pocket (Destination)</label>
          <select
            className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Transfer Amount (IDR)</label>
          <Input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min={1}
            className="h-8.5 text-xs font-semibold"
          />
        </div>
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

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
        <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium text-xs gap-1.5">
          <ArrowRightLeft className="size-3.5" />
          <span>Send Transfer</span>
        </Button>
      </DialogFooter>
    </form>
  );
}

export function QuickActionModal({ open, onOpenChange, defaultTab = 'expense' }: QuickActionModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevDefaultTab, setPrevDefaultTab] = useState(defaultTab);
  const [activeTab, setActiveTab] = useState<QuickActionTab>(defaultTab);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (open !== prevOpen || defaultTab !== prevDefaultTab) {
    setPrevOpen(open);
    setPrevDefaultTab(defaultTab);
    if (open) {
      setActiveTab(defaultTab);
    }
  }

  const handleSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
      onOpenChange(false);
    }, 1200);
  };

  const handleCancel = () => onOpenChange(false);

  const getModalMeta = () => {
    switch (activeTab) {
      case 'product':
        return {
          title: 'Add New Product',
          desc: 'Register a new item to your Seller catalog.',
        };
      case 'sale':
        return {
          title: 'Record Store Sale',
          desc: 'Record orders from Shopee, TikTok Shop, Tokopedia, or Direct sales.',
        };
      case 'asset':
        return {
          title: 'Add to Collection',
          desc: 'Add collectibles, figures, gadgets, or personal valuables.',
        };
      case 'transfer':
        return {
          title: 'Transfer Between Pockets',
          desc: 'Move funds between your cash, bank accounts, or digital wallets.',
        };
      case 'income':
        return {
          title: 'Record Income',
          desc: 'Log incoming revenue or funds to your pocket.',
        };
      case 'expense':
      default:
        return {
          title: 'Record Expense',
          desc: 'Log expenses, purchase collection items, or operational supplies.',
        };
    }
  };

  const isFinancialTransaction = activeTab === 'income' || activeTab === 'expense' || activeTab === 'transfer';
  const meta = getModalMeta();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">{meta.title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{meta.desc}</DialogDescription>
        </DialogHeader>

        {successMessage ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <CheckCircle2 className="size-12 text-emerald-500 animate-in zoom-in-50 duration-200" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{successMessage}</p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {isFinancialTransaction && (
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted/70 rounded-lg text-xs font-medium border border-border/50">
                <button
                  type="button"
                  onClick={() => setActiveTab('expense')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
                    activeTab === 'expense'
                      ? 'bg-card text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowUpRight className="size-3.5 text-rose-600" />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('income')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
                    activeTab === 'income'
                      ? 'bg-card text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowDownLeft className="size-3.5 text-emerald-600" />
                  <span>Income</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('transfer')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-colors ${
                    activeTab === 'transfer'
                      ? 'bg-card text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowRightLeft className="size-3.5 text-blue-600" />
                  <span>Transfer</span>
                </button>
              </div>
            )}

            {activeTab === 'income' && <IncomeForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'expense' && <ExpenseForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'transfer' && <InlineTransferForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'sale' && <SaleForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'product' && <ProductForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'asset' && <AssetForm onSuccess={handleSuccess} onCancel={handleCancel} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
