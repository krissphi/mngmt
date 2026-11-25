'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Product } from '@/types';
import { formatIDR } from '@/lib/currency';
import { getAvailableStock, isSellableProduct } from '@/lib/calculations';
import { getMainCategories, resolveCategoryPair } from '@/lib/categories';
import { SummaryBanner } from '@/components/shared/summary-banner';
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
  onOpenRestock: (productId: string) => void;
}

export function ProductsTab({ onOpenAddProduct, onOpenAdjust, onOpenRestock }: ProductsTabProps) {
  const { products, categories, deleteProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortState, setSortState] = useState<ProductSortState>({ field: 'name', direction: 'asc' });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const saleProducts = useMemo(() => products.filter(isSellableProduct), [products]);
  const mainProductCategories = useMemo(
    () => getMainCategories(categories, ['product']),
    [categories]
  );

  const { totalOnHand, totalStockSellingValue, totalStockPurchaseCost, lowStockCount } = useMemo(() => {
    let units = 0;
    let sellingVal = 0;
    let purchaseCostVal = 0;
    let lowCount = 0;

    for (const p of saleProducts) {
      units += p.stockOnHand;
      if (p.stockOnHand > 0) {
        sellingVal += p.stockOnHand * (p.sellingPrice || 0);
        purchaseCostVal += p.stockOnHand * (p.purchaseCost || 0);
      }
      if (p.status === 'active' && p.stockOnHand <= p.minStockAlert) {
        lowCount++;
      }
    }

    return {
      totalOnHand: units,
      totalStockSellingValue: sellingVal,
      totalStockPurchaseCost: purchaseCostVal,
      lowStockCount: lowCount,
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

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return saleProducts
      .filter((p) => {
        const resolved = resolveCategoryPair(categories, p.categoryId, p.subCategoryId, '');
        const catText = resolved.fullName.toLowerCase();
        const matchesQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          catText.includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q));

        const matchesCat =
          selectedCategory === 'all' ||
          resolved.mainId === selectedCategory ||
          p.categoryId === selectedCategory;

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
  }, [saleProducts, categories, searchQuery, selectedCategory, stockStatus, sortState]);

  return (
    <div className="space-y-5">
      <SummaryBanner
        label="Total Inventory Retail Value"
        value={formatIDR(totalStockSellingValue)}
        meta={[
          `${saleProducts.length} ${saleProducts.length === 1 ? 'SKU' : 'SKUs'}`,
          `${totalOnHand} Units On Hand`,
          `${lowStockCount} Low Stock`,
          `Cost ${formatIDR(totalStockPurchaseCost)}`,
        ]}
        actions={
          <Button
            onClick={onOpenAddProduct}
            size="sm"
            className="text-xs h-8.5 px-3 rounded-lg gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Add Product</span>
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search product, SKU, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-8.5 text-xs bg-card/50 border-border/60 rounded-xl"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none"
          aria-label="Filter by product category"
        >
          <option value="all">All Categories</option>
          {mainProductCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')}
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none"
          aria-label="Filter by stock status"
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
            className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-xl"
            title="Reset all filters"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        )}
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
          onOpenRestock={onOpenRestock}
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
