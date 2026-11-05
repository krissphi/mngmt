'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';

interface ProductFormProps {
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}

export function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const { categories, addProduct } = useStore();

  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('1');
  const [prodCategory, setProdCategory] = useState(
    () => categories.find((c) => c.type === 'product')?.id || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return;

    addProduct({
      sku: prodSku || `SKU-${Date.now().toString().slice(-4)}`,
      name: prodName,
      brand: prodBrand || 'Generic',
      categoryId: prodCategory,
      purchaseCost: Number(prodCost) || 0,
      sellingPrice: Number(prodPrice),
      productType: 'regular_inventory',
      stockOnHand: Number(prodStock) || 0,
      minStockAlert: 2,
      status: 'active',
    });

    onSuccess('New product added to catalog successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">SKU / Item Code</label>
          <Input
            placeholder="e.g. TF-SS-86"
            value={prodSku}
            onChange={(e) => setProdSku(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Product Name</label>
          <Input
            placeholder="Full product title..."
            value={prodName}
            onChange={(e) => setProdName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Brand</label>
          <Input
            placeholder="e.g. Hasbro, Bandai..."
            value={prodBrand}
            onChange={(e) => setProdBrand(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
            value={prodCategory}
            onChange={(e) => setProdCategory(e.target.value)}
          >
            {categories
              .filter((c) => c.type === 'product')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Purchase Cost (Rp)</label>
          <Input
            type="number"
            placeholder="e.g. 450000"
            value={prodCost}
            onChange={(e) => setProdCost(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Selling Price (Rp)</label>
          <Input
            type="number"
            placeholder="e.g. 650000"
            value={prodPrice}
            onChange={(e) => setProdPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Initial Stock</label>
          <Input
            type="number"
            min={0}
            value={prodStock}
            onChange={(e) => setProdStock(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary text-primary-foreground font-medium">
          Save Product
        </Button>
      </DialogFooter>
    </form>
  );
}
