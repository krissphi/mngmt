'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { getMainCategories } from '@/lib/categories';
import { CategorySubSelect } from '@/components/shared/category-sub-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';

interface ProductFormProps {
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}

export function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const { categories, suppliers, addProduct } = useStore();

  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('1');
  const [prodMinAlert, setProdMinAlert] = useState('2');
  const [prodSupplier, setProdSupplier] = useState('');
  const [prodCategory, setProdCategory] = useState(
    () => getMainCategories(categories, ['product'])[0]?.id || ''
  );
  const [prodSubCategory, setProdSubCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) return;

    addProduct({
      sku: prodSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      name: prodName.trim(),
      brand: prodBrand.trim() || 'Generic',
      categoryId: prodCategory || undefined,
      subCategoryId: prodSubCategory || undefined,
      supplierId: prodSupplier || undefined,
      purchaseCost: Number(prodCost) || 0,
      sellingPrice: Number(prodPrice),
      productType: 'regular_inventory',
      stockOnHand: Math.max(0, Number(prodStock) || 0),
      minStockAlert: Math.max(0, Number(prodMinAlert) || 0),
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
          <label className="text-xs font-medium text-muted-foreground block mb-1">Supplier (Optional)</label>
          <select
            className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs text-foreground"
            value={prodSupplier}
            onChange={(e) => setProdSupplier(e.target.value)}
          >
            <option value="">No Supplier Linked</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CategorySubSelect
        categories={categories}
        allowedTypes={['product']}
        categoryId={prodCategory}
        subCategoryId={prodSubCategory}
        onCategoryChange={setProdCategory}
        onSubCategoryChange={setProdSubCategory}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Purchase Cost</label>
          <Input
            type="number"
            placeholder="450000"
            value={prodCost}
            onChange={(e) => setProdCost(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Selling Price</label>
          <Input
            type="number"
            placeholder="650000"
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
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Min Alert</label>
          <Input
            type="number"
            min={0}
            value={prodMinAlert}
            onChange={(e) => setProdMinAlert(e.target.value)}
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
