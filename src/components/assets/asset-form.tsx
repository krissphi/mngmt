'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { formatCompactIDR } from '@/lib/currency';
import { AssetCondition, Asset } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/shared/image-upload';

interface AssetFormSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Asset | null;
  onSuccess?: (msg: string) => void;
  embedded?: boolean;
}

export function AssetFormSection({
  open,
  onOpenChange,
  initialData,
  onSuccess,
  embedded = false,
}: AssetFormSectionProps) {
  const { addAsset, updateAsset, accounts } = useStore();
  const [prevData, setPrevData] = useState(initialData);
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'Toys');
  const [purchasePrice, setPurchasePrice] = useState(initialData ? String(initialData.purchasePrice) : '');
  const [currentVal, setCurrentVal] = useState(initialData ? String(initialData.currentEstimatedValue) : '');
  const [condition, setCondition] = useState<AssetCondition>(initialData?.condition || 'mint');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');

  if (initialData !== prevData) {
    setPrevData(initialData);
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setPurchasePrice(String(initialData.purchasePrice));
      setCurrentVal(String(initialData.currentEstimatedValue));
      setCondition(initialData.condition);
      setNotes(initialData.notes || '');
      setImageUrl(initialData.imageUrl || '');
      setPaymentAccount('');
    } else {
      setName('');
      setCategory('Toys');
      setPurchasePrice('');
      setCurrentVal('');
      setCondition('mint');
      setNotes('');
      setImageUrl('');
      setPaymentAccount('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialData) {
      updateAsset(initialData.id, {
        name: name.trim(),
        category,
        purchasePrice: Number(purchasePrice) || 0,
        currentEstimatedValue: Number(currentVal) || Number(purchasePrice) || 0,
        condition,
        notes: notes.trim(),
        imageUrl: imageUrl || undefined,
      });
    } else {
      addAsset({
        name: name.trim(),
        category,
        purchasePrice: Number(purchasePrice) || 0,
        currentEstimatedValue: Number(currentVal) || Number(purchasePrice) || 0,
        condition,
        status: 'owned',
        notes: notes.trim(),
        imageUrl: imageUrl || undefined,
      }, paymentAccount || undefined);
    }
    if (onSuccess) {
      onSuccess(initialData ? 'Asset changes saved successfully!' : 'Personal asset registered successfully!');
    }
    onOpenChange(false);
  };

  const isEdit = Boolean(initialData);

  const formElement = (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Asset / Item Name</label>
        <Input
          placeholder="e.g. Transformers MP-44 Convoy, Nintendo Switch"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Toys">Toys</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Equipment">Equipment</option>
            <option value="Property">Property</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Collectibles">Collectibles</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Physical Condition</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
            value={condition}
            onChange={(e) => setCondition(e.target.value as AssetCondition)}
          >
            <option value="mint">Mint Condition (Collector Quality)</option>
            <option value="good">Good Condition (Very Good)</option>
            <option value="fair">Fair Condition (Visible Signs of Use)</option>
            <option value="needs_repair">Needs Repair / Repaint</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Original Cost (Rp)</label>
          <Input
            type="number"
            placeholder="e.g. 1500000"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Current Estimated Value (Rp)</label>
          <Input
            type="number"
            placeholder="e.g. 2200000"
            value={currentVal}
            onChange={(e) => setCurrentVal(e.target.value)}
          />
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Funding Account (Logs Cash Expense)
          </label>
          <select
            className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
            value={paymentAccount}
            onChange={(e) => setPaymentAccount(e.target.value)}
          >
            <option value="">Legacy Item / Do Not Deduct Cash Balance</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatCompactIDR(a.balance)})
              </option>
            ))}
          </select>
        </div>
      )}

      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        label="Collectible Photo (Optional)"
      />

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Notes (Optional)</label>
        <Input
          placeholder="e.g. Complete box, kept in glass display case"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
          {isEdit ? 'Save Changes' : 'Save Asset'}
        </Button>
      </div>
    </form>
  );

  if (embedded) {
    return formElement;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Personal Asset' : 'Add Personal Asset'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? 'Update valuation, condition, or notes for this asset.'
              : 'Register hobby collections and personal gear to track net worth.'}
          </DialogDescription>
        </DialogHeader>
        {formElement}
      </DialogContent>
    </Dialog>
  );
}
