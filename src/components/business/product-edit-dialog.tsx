'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Product } from '@/types';
import { CategorySubSelect } from '@/components/shared/category-sub-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Trash2 } from 'lucide-react';

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductEditDialog({ open, onOpenChange, product }: ProductEditDialogProps) {
  const { updateProduct, deleteProduct, categories, suppliers } = useStore();
  const [prevKey, setPrevKey] = useState('');
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [subCategoryId, setSubCategoryId] = useState(product?.subCategoryId || '');
  const [supplierId, setSupplierId] = useState(product?.supplierId || '');
  const [purchaseCost, setPurchaseCost] = useState(product ? String(product.purchaseCost) : '');
  const [sellingPrice, setSellingPrice] = useState(product ? String(product.sellingPrice) : '');
  const [minStockAlert, setMinStockAlert] = useState(product ? String(product.minStockAlert || 2) : '2');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const syncKey = `${open}-${product?.id || ''}`;
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open && product) {
      setName(product.name);
      setBrand(product.brand || '');
      setCategoryId(product.categoryId || '');
      setSubCategoryId(product.subCategoryId || '');
      setSupplierId(product.supplierId || '');
      setPurchaseCost(String(product.purchaseCost));
      setSellingPrice(String(product.sellingPrice));
      setMinStockAlert(String(product.minStockAlert ?? 2));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !name.trim()) return;

    updateProduct(product.id, {
      name: name.trim(),
      brand: brand.trim() || undefined,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      supplierId: supplierId || undefined,
      purchaseCost: Number(purchaseCost) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      minStockAlert: Number(minStockAlert) || 0,
    });

    onOpenChange(false);
  };

  const handleConfirmDelete = () => {
    if (!product) return;
    deleteProduct(product.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Edit Product</DialogTitle>
          <DialogDescription className="text-xs">
            Update name, brand, category, cost, and selling price for product ({product.sku}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Product Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Brand</label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Bandai, Hasbro"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Supplier</label>
              <select
                className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
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
            categoryId={categoryId}
            subCategoryId={subCategoryId}
            onCategoryChange={setCategoryId}
            onSubCategoryChange={setSubCategoryId}
          />

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Purchase Cost (Rp)</label>
              <Input
                type="number"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Selling Price (Rp)</label>
              <Input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Min. Alert</label>
              <Input
                type="number"
                min={0}
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 px-2"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Product</span>
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Remove Product from Catalog?"
        description={`Are you sure you want to remove "${product.name}" (${product.sku}) from the sales catalog? This action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="destructive"
        icon="trash"
        onConfirm={handleConfirmDelete}
      />
    </Dialog>
  );
}
