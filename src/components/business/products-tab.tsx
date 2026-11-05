'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Product } from '@/types';
import { formatIDR } from '@/lib/currency';
import { getAvailableStock } from '@/lib/calculations';
import { Search, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductEditDialog } from './product-edit-dialog';
import { ProductStockTable, ProductSortField, ProductSortState } from './product-stock-table';
import { EmptyState, NoSearchResultState } from '@/components/states/state-views';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface ProductsTabProps {
  onOpenAddProduct: () => void;
  onOpenAdjust: (productId: string) => void;
}

export function ProductsTab({ onOpenAddProduct, onOpenAdjust }: ProductsTabProps) {
  const { products, categories, deleteProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortState, setSortState] = useState<ProductSortState>({ field: 'name', direction: 'asc' });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const saleProducts = useMemo(() => {
    return products.filter((p) => p.productType !== 'asset' && p.productType !== 'personal_collection');
  }, [products]);

  const { totalOnHand, totalStockSellingValue, totalStockPurchaseCost } = useMemo(() => {
    let units = 0;
    let sellingVal = 0;
    let purchaseCostVal = 0;

    for (const p of saleProducts) {
      units += p.stockOnHand;
      if (p.stockOnHand > 0) {
        sellingVal += p.stockOnHand * (p.sellingPrice || 0);
        purchaseCostVal += p.stockOnHand * (p.purchaseCost || 0);
      }
    }

    return {
      totalOnHand: units,
      totalStockSellingValue: sellingVal,
      totalStockPurchaseCost: purchaseCostVal,
    };
  }, [saleProducts]);

  const isFiltered = searchQuery !== '' || selectedCategory !== 'all' || stockStatus !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStockStatus('all');
    setSortState({ field: 'name', direction: 'asc' });
  };

  const handleSort = (field: ProductSortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  };

  const categoryNameMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return saleProducts
      .filter((p) => {
        const catName = p.categoryId ? categoryNameMap.get(p.categoryId) || '' : '';
        const matchesQuery = !q || (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          catName.includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
        );

        const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;

        let matchesStock = true;
        if (stockStatus === 'in_stock') matchesStock = p.stockOnHand > 0;
        else if (stockStatus === 'low_stock') matchesStock = p.stockOnHand > 0 && p.stockOnHand <= p.minStockAlert;
        else if (stockStatus === 'out_of_stock') matchesStock = p.stockOnHand === 0;

        return matchesQuery && matchesCat && matchesStock;
      })
      .sort((a, b) => {
        const { field, direction } = sortState;
        const dir = direction === 'asc' ? 1 : -1;
        if (field === 'name') return dir * a.name.localeCompare(b.name);
        if (field === 'cost') return dir * ((a.purchaseCost || 0) - (b.purchaseCost || 0));
        if (field === 'price') return dir * (a.sellingPrice - b.sellingPrice);
        if (field === 'stock') return dir * (a.stockOnHand - b.stockOnHand);
        if (field === 'available') return dir * (getAvailableStock(a) - getAvailableStock(b));
        if (field === 'sold') return dir * ((a.stockSold || 0) - (b.stockSold || 0));
        return 0;
      });
  }, [saleProducts, categoryNameMap, searchQuery, selectedCategory, stockStatus, sortState]);

  return (
    <div className="space-y-4">
      {/* Clean Tab Header with Text Summary & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground font-medium">
          <span>In-Stock: <strong className="text-foreground">{totalOnHand}</strong> units</span>
          <span>•</span>
          <span>
            Total Stock Value: <strong className="text-foreground font-semibold">{formatIDR(totalStockSellingValue)}</strong>
            {totalStockPurchaseCost > 0 && (
              <span className="text-[11px] text-muted-foreground ml-1 font-normal">
                (Cost: {formatIDR(totalStockPurchaseCost)})
              </span>
            )}
          </span>
        </div>

        <Button
          onClick={onOpenAddProduct}
          size="sm"
          className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Table Filters & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-lg border border-border/50">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search product, SKU, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-8 text-xs bg-card"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {categories
              .filter((c) => c.type === 'product')
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>

          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')}
            className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock (&gt; 0)</option>
            <option value="low_stock">Low Stock (Alert)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {isFiltered && (
            <Button
              onClick={resetFilters}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              title="Reset all filters"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        isFiltered ? (
          <NoSearchResultState query={searchQuery || 'selected filters'} onReset={resetFilters} />
        ) : (
          <EmptyState
            title="Product Catalog is Empty"
            description="No products registered yet. Add a new product to start tracking inventory and sales."
            action={
              <Button onClick={onOpenAddProduct} size="sm" className="text-xs h-8 bg-primary text-primary-foreground font-medium">
                + Add New Product
              </Button>
            }
          />
        )
      ) : (
        <ProductStockTable
          products={filteredProducts}
          categories={categories}
          sortState={sortState}
          onSort={handleSort}
          onOpenAdjust={onOpenAdjust}
          onEdit={(p) => {
            setEditingProduct(p);
            setShowEditDialog(true);
          }}
          onDelete={setDeletingProduct}
        />
      )}

      <ProductEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        product={editingProduct}
      />

      <ConfirmDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Remove Product from Catalog?"
        description={`Are you sure you want to remove "${deletingProduct?.name}" (${deletingProduct?.sku}) from the sales catalog? This action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="destructive"
        icon="trash"
        onConfirm={() => {
          if (deletingProduct) {
            deleteProduct(deletingProduct.id);
            setDeletingProduct(null);
          }
        }}
      />
    </div>
  );
}
