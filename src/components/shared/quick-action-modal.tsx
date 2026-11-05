'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { IncomeForm } from '@/components/quick-actions/income-form';
import { ExpenseForm } from '@/components/quick-actions/expense-form';
import { SaleForm } from '@/components/quick-actions/sale-form';
import { ProductForm } from '@/components/quick-actions/product-form';
import { AssetForm } from '@/components/quick-actions/asset-form';

export type QuickActionTab = 'income' | 'expense' | 'sale' | 'product' | 'asset';

interface QuickActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: QuickActionTab;
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
          desc: 'Register a new item into your sales catalog.',
        };
      case 'sale':
        return {
          title: 'Record Channel Sale',
          desc: 'Record a customer order from an online marketplace or offline sale.',
        };
      case 'asset':
        return {
          title: 'Add Personal Asset',
          desc: 'Track personal collectibles, figures, or valuable devices.',
        };
      case 'income':
      case 'expense':
      default:
        return {
          title: 'Record Financial Transaction',
          desc: 'Log cash inflow or outflow transactions.',
        };
    }
  };

  const isFinancialTransaction = activeTab === 'income' || activeTab === 'expense';
  const meta = getModalMeta();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted/70 rounded-lg text-xs font-medium border border-border/50">
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
              </div>
            )}

            {activeTab === 'income' && <IncomeForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'expense' && <ExpenseForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'sale' && <SaleForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'product' && <ProductForm onSuccess={handleSuccess} onCancel={handleCancel} />}
            {activeTab === 'asset' && <AssetForm onSuccess={handleSuccess} onCancel={handleCancel} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
