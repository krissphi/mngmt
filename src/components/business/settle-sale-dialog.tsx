'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Sale } from '@/types';
import { formatIDR } from '@/lib/currency';
import { getLocalDateString } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

interface SettleSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}

export function SettleSaleDialog({ open, onOpenChange, sale }: SettleSaleDialogProps) {
  const { accounts, settleSalePayment } = useStore();
  const [prevKey, setPrevKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());

  const syncKey = `${open}-${sale?.id || ''}`;
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open && sale) {
      setAccountId(sale.paymentAccountId || accounts[0]?.id || '');
      setDate(getLocalDateString());
    }
  }

  if (!sale) return null;

  const netExpected = Math.max(0, sale.grossSales - sale.marketplaceFees - sale.discounts);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    settleSalePayment(sale.id, accountId, date);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Settle Marketplace Payout</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Record settlement for order <b>#{sale.orderNumber}</b> ({sale.channel.toUpperCase()}) into a liquid pocket.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">Net Payout Amount:</span>
            <span className="text-base font-bold font-mono text-emerald-500">{formatIDR(netExpected)}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Destination Pocket</label>
            <select
              className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
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

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Settlement Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="h-8.5 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
              Mark Paid &amp; Credit Pocket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
