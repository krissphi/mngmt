'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { WishlistItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface WishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: WishlistItem | null;
}

export function WishlistDialog({ open, onOpenChange, initialItem }: WishlistDialogProps) {
  const { addWishlistItem, updateWishlistItem } = useStore();
  const [prevItem, setPrevItem] = useState(initialItem);
  const [name, setName] = useState(initialItem?.name || '');
  const [estimatedPrice, setEstimatedPrice] = useState(
    initialItem ? String(initialItem.estimatedPrice) : ''
  );
  const [targetDate, setTargetDate] = useState(initialItem?.targetDate || '');

  const isEdit = Boolean(initialItem);

  if (initialItem !== prevItem) {
    setPrevItem(initialItem);
    if (initialItem) {
      setName(initialItem.name);
      setEstimatedPrice(String(initialItem.estimatedPrice));
      setTargetDate(initialItem.targetDate || '');
    } else {
      setName('');
      setEstimatedPrice('');
      setTargetDate('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !estimatedPrice) return;

    const priceNum = Math.max(0, Number(estimatedPrice.replace(/\D/g, '')) || 0);

    if (initialItem) {
      updateWishlistItem(initialItem.id, {
        name: name.trim(),
        estimatedPrice: priceNum,
        targetDate: targetDate || undefined,
      });
    } else {
      addWishlistItem({
        name: name.trim(),
        estimatedPrice: priceNum,
        priority: 'medium',
        targetDate: targetDate || undefined,
        isPurchased: false,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? 'Update the item name, price, or target date.'
              : 'Add an item to your wishlist.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Item Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. MacBook Pro M3, PS5, Kursi Kerja"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Estimated Price (IDR) <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 15000000"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Target Date (Optional)
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-primary text-primary-foreground font-medium"
            >
              {isEdit ? 'Save Changes' : 'Add to Wishlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
