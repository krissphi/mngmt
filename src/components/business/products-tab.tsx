'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Product } from '@/types';
import { Search, Plus, History, Package, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductEditDialog } from './product-edit-dialog';
import { ProductStockTable } from './product-stock-table';
import { StockMovementTable } from './stock-movement-table';
import { EmptyState, NoSearchResultState } from '@/components/states/state-views';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface ProductsTabProps {
  onOpenAddProduct: () => void;
  onOpenAdjust: (productId: string) => void;
}

export function ProductsTab({ onOpenAddProduct, onOpenAdjust }: ProductsTabProps) {
  const { products, categories, deleteProduct, inventoryMovements } = useStore();
  const [subView, setSubView] = useState<'catalog' | 'movements'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock_desc' | 'stock_asc' | 'price_desc' | 'price_asc'>('name');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const saleProducts = useMemo(() => {
    return products.filter((p) => p.productType !== 'asset' && p.productType !== 'personal_collection');
  }, [products]);

  const totalOnHand = useMemo(() => saleProducts.reduce((acc, p) => acc + p.stockOnHand, 0), [saleProducts]);
  const lowStockCount = useMemo(() => saleProducts.filter((p) => p.stockOnHand <= p.minStockAlert).length, [saleProducts]);

  const isFiltered = searchQuery !== '' || selectedCategory !== 'all' || stockStatus !== 'all' || sortBy !== 'name';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStockStatus('all');
    setSortBy('name');
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
        if (sortBy === 'stock_desc') return b.stockOnHand - a.stockOnHand;
        if (sortBy === 'stock_asc') return a.stockOnHand - b.stockOnHand;
        if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
        if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
        return a.name.localeCompare(b.name);
      });
  }, [saleProducts, categoryNameMap, searchQuery, selectedCategory, stockStatus, sortBy]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubView('catalog')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              subView === 'catalog' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Package className="size-3.5" />
            <span>Products & Stock</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-bold">{products.length}</span>
          </button>
          <button
            onClick={() => setSubView('movements')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              subView === 'movements' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <History className="size-3.5" />
            <span>Stock Movements</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-bold">{inventoryMovements.length}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Total Units: <strong className="text-foreground">{totalOnHand}</strong></span>
          <span>•</span>
          <span>Low Stock: <strong className={lowStockCount > 0 ? 'text-amber-600' : 'text-foreground'}>{lowStockCount}</strong></span>
        </div>
      </div>

      {subView === 'movements' ? (
        <StockMovementTable />
      ) : (
        <>
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

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'stock_desc' | 'stock_asc' | 'price_desc' | 'price_asc')}
                className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="stock_desc">Sort: Stock (High-Low)</option>
                <option value="stock_asc">Sort: Stock (Low-High)</option>
                <option value="price_desc">Sort: Price (High-Low)</option>
                <option value="price_asc">Sort: Price (Low-High)</option>
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

            <div className="flex items-center gap-2.5 self-end md:self-auto">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                Showing <b>{filteredProducts.length}</b> of {products.length}
              </span>
              <Button
                onClick={onOpenAddProduct}
                size="sm"
                className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium shrink-0"
              >
                <Plus className="size-3.5" />
                <span>Add Product</span>
              </Button>
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
              onOpenAdjust={onOpenAdjust}
              onEdit={(p) => {
                setEditingProduct(p);
                setShowEditDialog(true);
              }}
              onDelete={setDeletingProduct}
            />
          )}
        </>
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
