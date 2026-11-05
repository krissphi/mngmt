'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { InventoryMovement } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

export function AdjustStockDialog({ open, onOpenChange, productId }: AdjustStockDialogProps) {
  const { adjustStock } = useStore();
  const [adjustDelta, setAdjustDelta] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustType, setAdjustType] = useState<InventoryMovement['type']>('adjustment_in');

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !adjustDelta) return;
    const delta = Number(adjustDelta);
    adjustStock(
      productId,
      adjustType === 'adjustment_out' || adjustType === 'damaged' ? -Math.abs(delta) : Math.abs(delta),
      adjustType,
      adjustReason || 'Manual stock adjustment'
    );
    onOpenChange(false);
    setAdjustDelta('');
    setAdjustReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Stock Adjustment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Adjustment Type</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as InventoryMovement['type'])}
            >
              <option value="adjustment_in">Increase Stock (Found / Inflow)</option>
              <option value="adjustment_out">Decrease Stock (Discrepancy / Audit)</option>
              <option value="damaged">Damaged / Defective Items</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Quantity (Units)</label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 2"
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Reason for Adjustment</label>
            <Input
              placeholder="e.g. Routine stock count, damaged packaging..."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground font-medium">
              Save Adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
