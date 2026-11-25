'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { formatCompactIDR } from '@/lib/currency';
import { getMainCategories } from '@/lib/categories';
import { CategorySubSelect } from '@/components/shared/category-sub-select';
import { AssetCondition, Asset, ProductType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const { addAsset, updateAsset, accounts, categories } = useStore();
  const [prevKey, setPrevKey] = useState('');
  const [name, setName] = useState(initialData?.name || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [subCategoryId, setSubCategoryId] = useState(initialData?.subCategoryId || '');
  const [purchasePrice, setPurchasePrice] = useState(initialData ? String(initialData.purchasePrice) : '');
  const [currentVal, setCurrentVal] = useState(initialData ? String(initialData.currentEstimatedValue) : '');
  const [condition, setCondition] = useState<AssetCondition>(initialData?.condition || 'mint');
  const [productType, setProductType] = useState<ProductType>(initialData?.productType || 'asset');
  const [paymentAccount, setPaymentAccount] = useState('');

  const syncKey = `${open}-${initialData?.id || 'new'}`;
  if (syncKey !== prevKey) {
    setPrevKey(syncKey);
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setBrand(initialData.brand || '');
        setCategoryId(initialData.categoryId || '');
        setSubCategoryId(initialData.subCategoryId || '');
        setPurchasePrice(String(initialData.purchasePrice));
        setCurrentVal(String(initialData.currentEstimatedValue));
        setCondition(initialData.condition || 'mint');
        setProductType(initialData.productType || 'asset');
        setPaymentAccount('');
      } else {
        setName('');
        setBrand('');
        setCategoryId(getMainCategories(categories, { flow: 'expense' })[0]?.id || '');
        setSubCategoryId('');
        setPurchasePrice('');
        setCurrentVal('');
        setCondition('mint');
        setProductType('asset');
        setPaymentAccount('');
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedCat = categories.find((c) => c.id === categoryId);
    const catName = selectedCat ? selectedCat.name : 'Collection';
    const cost = Number(purchasePrice) || 0;
    const estVal = Number(currentVal) || cost;

    if (initialData) {
      updateAsset(initialData.id, {
        name: name.trim(),
        brand: brand.trim(),
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        category: catName,
        purchasePrice: cost,
        purchaseCost: cost,
        currentEstimatedValue: estVal,
        sellingPrice: estVal,
        condition,
        productType,
      });
    } else {
      addAsset(
        {
          name: name.trim(),
          brand: brand.trim(),
          categoryId: categoryId || undefined,
          subCategoryId: subCategoryId || undefined,
          category: catName,
          purchasePrice: cost,
          purchaseCost: cost,
          currentEstimatedValue: estVal,
          sellingPrice: estVal,
          condition,
          status: 'active',
          productType,
          stockOnHand: 1,
          stockReserved: 0,
          stockSold: 0,
          minStockAlert: 0,
        },
        paymentAccount || undefined
      );
    }
    if (onSuccess) {
      onSuccess(initialData ? 'Asset changes saved successfully!' : 'Personal asset registered successfully!');
    }
    onOpenChange(false);
  };

  const isEdit = Boolean(initialData);

  const formElement = (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Asset / Item Name</label>
          <Input
            placeholder="e.g. Transformers MP-44 Convoy, Nintendo Switch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Brand / Maker</label>
          <Input
            placeholder="e.g. Takara Tomy, Bandai, Sony, Apple..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>
      </div>

      <CategorySubSelect
        categories={categories}
        flow="expense"
        categoryId={categoryId}
        subCategoryId={subCategoryId}
        onCategoryChange={setCategoryId}
        onSubCategoryChange={setSubCategoryId}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Product / Collection Type</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none"
            value={productType}
            onChange={(e) => setProductType(e.target.value as ProductType)}
          >
            <option value="asset">Personal Collection (Collectible Asset)</option>
            <option value="preloved">Preloved (Used / Secondhand)</option>
            <option value="regular_inventory">Regular Inventory</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Physical Condition</label>
          <select
            className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
            value={condition}
            onChange={(e) => setCondition(e.target.value as AssetCondition)}
          >
            <option value="mint">Mint (Collector Quality)</option>
            <option value="good">Good (Very Good)</option>
            <option value="fair">Fair (Signs of Use)</option>
            <option value="needs_repair">Needs Repair</option>
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
          <label className="text-xs font-medium text-muted-foreground block mb-1">Est. Value (Rp)</label>
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
      <DialogContent className="max-w-lg sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Personal Asset' : 'Add Personal Asset'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit
              ? 'Update valuation, condition, or category for this item.'
              : 'Register hobby collections and personal gear to track net worth.'}
          </DialogDescription>
        </DialogHeader>
        {formElement}
      </DialogContent>
    </Dialog>
  );
}
