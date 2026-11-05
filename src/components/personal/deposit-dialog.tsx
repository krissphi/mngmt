'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeposit: (amount: number, accountId?: string) => void;
  accounts?: Array<{ id: string; name: string }>;
}

export function DepositDialog({ open, onOpenChange, onDeposit, accounts }: DepositDialogProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;
    const addVal = Number(depositAmount.replace(/\D/g, ''));
    if (addVal > 0) {
      onDeposit(addVal, selectedAccount || undefined);
    }
    setDepositAmount('');
    setSelectedAccount('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Deposit to Goal</DialogTitle>
          <DialogDescription className="text-xs">
            Enter the amount to allocate towards this savings goal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Deposit Amount (Rp)</label>
            <Input
              type="number"
              placeholder="e.g. 500000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          {accounts && accounts.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Funding Account (Optional)</label>
              <select
                className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">Do Not Deduct Account Balance</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
              Confirm Deposit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
