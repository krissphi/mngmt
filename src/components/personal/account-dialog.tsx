'use client';

import React, { useState } from 'react';
import { Account } from '@/types';
import { formatSignedIDR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export interface AccountSavePayload {
  name: string;
  type: Account['type'];
  balance: number;
  institution?: string;
  accountNumber?: string;
  recordAdjustment?: boolean;
}

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAccount?: Account | null;
  onSave: (data: AccountSavePayload) => void;
}

export function AccountDialog({ open, onOpenChange, initialAccount, onSave }: AccountDialogProps) {
  const [prevKey, setPrevKey] = useState('');
  const [name, setName] = useState(initialAccount?.name || '');
  const [type, setType] = useState<Account['type']>(initialAccount?.type || 'bank');
  const [balance, setBalance] = useState(initialAccount ? String(initialAccount.balance) : '');
  const [institution, setInstitution] = useState(initialAccount?.institution || '');
  const [accountNumber, setAccountNumber] = useState(initialAccount?.accountNumber || '');
  const [recordAdjustment, setRecordAdjustment] = useState(true);

  const isEdit = Boolean(initialAccount);
  const syncKey = `${open}-${initialAccount?.id || 'new'}`;

  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open) {
      if (initialAccount) {
        setName(initialAccount.name);
        setType(initialAccount.type);
        setBalance(String(initialAccount.balance));
        setInstitution(initialAccount.institution || '');
        setAccountNumber(initialAccount.accountNumber || '');
        setRecordAdjustment(true);
      } else {
        setName('');
        setType('bank');
        setBalance('');
        setInstitution('');
        setAccountNumber('');
        setRecordAdjustment(false);
      }
    }
  }

  const numericBalance = Number(balance) || 0;
  const balanceDiff = initialAccount ? numericBalance - initialAccount.balance : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type,
      balance: numericBalance,
      institution: institution.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      recordAdjustment: isEdit && balanceDiff !== 0 ? recordAdjustment : false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Pocket' : 'Add New Pocket'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? 'Update pocket details or adjust your real balance.'
              : 'Add a pocket to track cash, bank accounts, or digital e-money.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Pocket Name</label>
            <Input
              placeholder="e.g. Daily Cash, BCA Checking, GoPay..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Pocket Type</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none"
                value={type}
                onChange={(e) => setType(e.target.value as Account['type'])}
              >
                <option value="cash">Cash (Physical)</option>
                <option value="bank">Bank Account</option>
                <option value="e_money">E-Money / Digital</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {isEdit ? 'Current Balance (IDR)' : 'Initial Balance (IDR)'}
              </label>
              <Input
                type="number"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required={isEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Institution (Optional)</label>
              <Input
                placeholder="e.g. Bank BCA, Mandiri, GoPay"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Account / Phone ID (Optional)</label>
              <Input
                placeholder="e.g. 1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          {isEdit && balanceDiff !== 0 && (
            <label className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recordAdjustment}
                onChange={(e) => setRecordAdjustment(e.target.checked)}
                className="size-3.5 mt-0.5 rounded border-input accent-primary cursor-pointer"
              />
              <span>
                Log balance difference (<b className="text-foreground font-mono">{formatSignedIDR(balanceDiff)}</b>) as a Balance Adjustment in General Ledger
              </span>
            </label>
          )}

          {type === 'cash' && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400">
              <b>Cash Pocket:</b> Use &ldquo;Count Bills&rdquo; on the pocket card to calculate individual Rupiah banknotes and coins.
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
              {isEdit ? 'Save Changes' : 'Create Pocket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
