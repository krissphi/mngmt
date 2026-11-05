'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ImageUpload } from '@/components/shared/image-upload';
import { Trash2 } from 'lucide-react';

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductEditDialog({ open, onOpenChange, product }: ProductEditDialogProps) {
  const { updateProduct, deleteProduct, categories } = useStore();
  const [prevProduct, setPrevProduct] = useState(product);
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [purchaseCost, setPurchaseCost] = useState(product ? String(product.purchaseCost) : '');
  const [sellingPrice, setSellingPrice] = useState(product ? String(product.sellingPrice) : '');
  const [minStockAlert, setMinStockAlert] = useState(product ? String(product.minStockAlert || 2) : '2');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (product !== prevProduct) {
    setPrevProduct(product);
    if (product) {
      setName(product.name);
      setBrand(product.brand || '');
      setCategoryId(product.categoryId || '');
      setPurchaseCost(String(product.purchaseCost));
      setSellingPrice(String(product.sellingPrice));
      setMinStockAlert(String(product.minStockAlert || 2));
      setImageUrl(product.imageUrl || '');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !name.trim()) return;

    updateProduct(product.id, {
      name: name.trim(),
      brand: brand.trim() || undefined,
      categoryId: categoryId || undefined,
      purchaseCost: Number(purchaseCost) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      minStockAlert: Number(minStockAlert) || 0,
      imageUrl: imageUrl || undefined,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Edit Product</DialogTitle>
          <DialogDescription className="text-xs">
            Update name, brand, cost, and selling price for product ({product.sku}).
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-card px-2.5 text-xs"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select Category...</option>
                {categories
                  .filter((c) => c.type === 'product')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Brand</label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Bandai, Hasbro"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Min. Stock Alert</label>
            <Input
              type="number"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Product Photo"
          />

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
