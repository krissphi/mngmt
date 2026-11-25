'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { getLocalDateString } from '@/lib/date';
import { calculateWeightedAverageCost } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface RestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

export function RestockDialog({ open, onOpenChange, productId }: RestockDialogProps) {
  const { products, suppliers, accounts, recordStockPurchase } = useStore();
  const product = products.find((p) => p.id === productId);

  const [prevKey, setPrevKey] = useState('');
  const [quantity, setQuantity] = useState('5');
  const [unitCost, setUnitCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [notes, setNotes] = useState('');

  const syncKey = `${open}-${productId}`;
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open && product) {
      setQuantity('5');
      setUnitCost(String(product.purchaseCost || 0));
      setSupplierId(product.supplierId || '');
      setPaymentAccountId(accounts[0]?.id || '');
      setDate(getLocalDateString());
      setNotes('');
    }
  }

  if (!product) return null;

  const qtyNum = Math.max(1, Number(quantity) || 0);
  const costNum = Math.max(0, Number(unitCost) || 0);
  const totalSpend = qtyNum * costNum;
  const newAvgCost = calculateWeightedAverageCost(product.stockOnHand, product.purchaseCost, qtyNum, costNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyNum <= 0) return;

    recordStockPurchase({
      productId: product.id,
      quantity: qtyNum,
      unitCost: costNum,
      supplierId: supplierId || undefined,
      paymentAccountId: paymentAccountId || undefined,
      date,
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Purchase &amp; Restock Inventory</DialogTitle>
          <DialogDescription className="text-xs">
            Record incoming stock for <b>{product.name}</b> ({product.sku}). Weighted average cost updates automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Incoming Qty (Pcs)</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="h-8.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Unit Cost (Rp)</label>
              <Input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                required
                className="h-8.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Purchase Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Supplier (Optional)</label>
              <select
                className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">No Supplier Selected</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Funding Pocket</label>
              <select
                className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
              >
                <option value="">Do Not Deduct Cash (Credit / Existing)</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatIDR(a.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">PO / Invoice Note (Optional)</label>
            <Input
              placeholder="e.g. PO-2026-1125 from PT Hobby Toys"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8.5 text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stock After Restock:</span>
              <span className="font-semibold font-mono text-foreground">
                {product.stockOnHand} → {product.stockOnHand + qtyNum} pcs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Avg. Cost (COGS):</span>
              <span className="font-semibold font-mono text-foreground">
                {formatIDR(product.purchaseCost)} → {formatIDR(newAvgCost)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/50 font-bold">
              <span>Total Purchase Value:</span>
              <span className="text-rose-500 font-mono">{formatIDR(totalSpend)}</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
              Confirm Restock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
