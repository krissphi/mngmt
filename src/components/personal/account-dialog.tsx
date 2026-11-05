'use client';

import React, { useState } from 'react';
import { Account } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAccount?: Account | null;
  onSave: (data: { name: string; type: Account['type']; balance: number; accountNumber?: string }) => void;
}

export function AccountDialog({ open, onOpenChange, initialAccount, onSave }: AccountDialogProps) {
  const [prevAccount, setPrevAccount] = useState(initialAccount);
  const [name, setName] = useState(initialAccount?.name || '');
  const [type, setType] = useState<Account['type']>(initialAccount?.type || 'bank');
  const [balance, setBalance] = useState(initialAccount ? String(initialAccount.balance) : '');
  const [accountNumber, setAccountNumber] = useState(initialAccount?.accountNumber || '');

  const isEdit = Boolean(initialAccount);

  if (initialAccount !== prevAccount) {
    setPrevAccount(initialAccount);
    if (initialAccount) {
      setName(initialAccount.name);
      setType(initialAccount.type);
      setBalance(String(initialAccount.balance));
      setAccountNumber(initialAccount.accountNumber || '');
    } else {
      setName('');
      setType('bank');
      setBalance('');
      setAccountNumber('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type,
      balance: Number(balance) || 0,
      accountNumber: accountNumber.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Account & Balance' : 'Add Financial Account'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? 'Update account details or adjust the current real-world balance.'
              : 'Register a new bank account, cash wallet, or e-wallet.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Account Name</label>
            <Input
              placeholder="e.g. BCA Checking, Savings Wallet, Petty Cash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Account Type</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-card px-2.5 text-xs"
                value={type}
                onChange={(e) => setType(e.target.value as Account['type'])}
              >
                <option value="bank">Bank Account</option>
                <option value="cash">Cash / Physical Wallet</option>
                <option value="e_wallet">E-Wallet</option>
                <option value="marketplace">Marketplace Balance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {isEdit ? 'Adjust Balance (Rp)' : 'Initial Balance (Rp)'}
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

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Account Number / ID</label>
            <Input
              placeholder="e.g. 1234567890 (Optional)"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
              {isEdit ? 'Save Changes' : 'Save Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
