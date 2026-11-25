'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Product } from '@/types';
import { formatIDR } from '@/lib/currency';
import { getAvailableStock, isSellableProduct } from '@/lib/calculations';
import { getMainCategories, resolveCategoryPair } from '@/lib/categories';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Search, Plus, RotateCcw, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductEditDialog } from './product-edit-dialog';
import { ProductStockTable, ProductSortField, ProductSortState } from './product-stock-table';
import { EmptyState, NoSearchResultState } from '@/components/states/state-views';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

export type ProductCatalogTab = 'ready' | 'archived' | 'all';

interface ProductsTabProps {
  onOpenAddProduct: () => void;
  onOpenAdjust: (productId: string) => void;
  onOpenRestock: (productId: string) => void;
}

export function ProductsTab({ onOpenAddProduct, onOpenAdjust, onOpenRestock }: ProductsTabProps) {
  const {
    products,
    categories,
    deleteProduct,
    archiveProduct,
    unarchiveProduct,
    archiveOutOfStockProducts,
    transferProductToCollection,
  } = useStore();

  const [catalogTab, setCatalogTab] = useState<ProductCatalogTab>('ready');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortState, setSortState] = useState<ProductSortState>({ field: 'name', direction: 'asc' });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [archivingProduct, setArchivingProduct] = useState<Product | null>(null);
  const [transferringProduct, setTransferringProduct] = useState<Product | null>(null);
  const [showArchiveOutOfStockConfirm, setShowArchiveOutOfStockConfirm] = useState(false);

  const saleProducts = useMemo(() => products.filter(isSellableProduct), [products]);
  const mainProductCategories = useMemo(
    () => getMainCategories(categories, { flow: 'expense' }),
    [categories]
  );

  const {
    readyProducts,
    archivedProducts,
    allActiveProducts,
    outOfStockActiveProducts,
    readyUnits,
    readySellingVal,
    readyCostVal,
    archivedSellingVal,
    archivedCostVal,
    totalOnHand,
    totalStockSellingValue,
    totalStockPurchaseCost,
    lowStockCount,
  } = useMemo(() => {
    const ready: Product[] = [];
    const archived: Product[] = [];
    const active: Product[] = [];
    const outOfStock: Product[] = [];

    let rUnits = 0;
    let rSellVal = 0;
    let rCostVal = 0;

    let aSellVal = 0;
    let aCostVal = 0;

    let totUnits = 0;
    let totSellVal = 0;
    let totCostVal = 0;
    let lowCount = 0;

    for (const p of saleProducts) {
      if (p.status === 'archived') {
        archived.push(p);
        if (p.stockOnHand > 0) {
          aSellVal += p.stockOnHand * (p.sellingPrice || 0);
          aCostVal += p.stockOnHand * (p.purchaseCost || 0);
        }
      } else {
        // active or default
        active.push(p);
        totUnits += p.stockOnHand;
        if (p.stockOnHand > 0) {
          totSellVal += p.stockOnHand * (p.sellingPrice || 0);
          totCostVal += p.stockOnHand * (p.purchaseCost || 0);
        }
        if (p.stockOnHand > 0) {
          ready.push(p);
          rUnits += p.stockOnHand;
          rSellVal += p.stockOnHand * (p.sellingPrice || 0);
          rCostVal += p.stockOnHand * (p.purchaseCost || 0);
        } else {
          outOfStock.push(p);
        }
        if (p.stockOnHand <= p.minStockAlert) {
          lowCount++;
        }
      }
    }

    return {
      readyProducts: ready,
      archivedProducts: archived,
      allActiveProducts: active,
      outOfStockActiveProducts: outOfStock,
      readyUnits: rUnits,
      readySellingVal: rSellVal,
      readyCostVal: rCostVal,
      archivedSellingVal: aSellVal,
      archivedCostVal: aCostVal,
      totalOnHand: totUnits,
      totalStockSellingValue: totSellVal,
      totalStockPurchaseCost: totCostVal,
      lowStockCount: lowCount,
    };
  }, [saleProducts]);

  const baseProducts = useMemo(() => {
    if (catalogTab === 'ready') return readyProducts;
    if (catalogTab === 'archived') return archivedProducts;
    return allActiveProducts;
  }, [catalogTab, readyProducts, archivedProducts, allActiveProducts]);

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
    return baseProducts
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
  }, [baseProducts, categories, searchQuery, selectedCategory, stockStatus, sortState]);

  const bannerData = useMemo(() => {
    if (catalogTab === 'ready') {
      return {
        label: 'Ready Stock Retail Value',
        value: formatIDR(readySellingVal),
        meta: [
          `${readyProducts.length} ${readyProducts.length === 1 ? 'SKU' : 'SKUs'} Ready`,
          `${readyUnits} Units Available`,
          `${lowStockCount} Low Stock`,
          `Cost ${formatIDR(readyCostVal)}`,
        ],
      };
    }
    if (catalogTab === 'archived') {
      return {
        label: 'Archived Products Value',
        value: formatIDR(archivedSellingVal),
        meta: [
          `${archivedProducts.length} ${archivedProducts.length === 1 ? 'SKU' : 'SKUs'} Archived`,
          `Estimated Cost ${formatIDR(archivedCostVal)}`,
        ],
      };
    }
    return {
      label: 'Total Inventory Retail Value',
      value: formatIDR(totalStockSellingValue),
      meta: [
        `${allActiveProducts.length} ${allActiveProducts.length === 1 ? 'SKU' : 'SKUs'} Active`,
        `${totalOnHand} Units On Hand`,
        `${outOfStockActiveProducts.length} Out of Stock`,
        `Cost ${formatIDR(totalStockPurchaseCost)}`,
      ],
    };
  }, [
    catalogTab,
    readySellingVal,
    readyProducts.length,
    readyUnits,
    lowStockCount,
    readyCostVal,
    archivedSellingVal,
    archivedProducts.length,
    archivedCostVal,
    totalStockSellingValue,
    allActiveProducts.length,
    totalOnHand,
    outOfStockActiveProducts.length,
    totalStockPurchaseCost,
  ]);

  return (
    <div className="space-y-5">
      <SummaryBanner
        label={bannerData.label}
        value={bannerData.value}
        meta={bannerData.meta}
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

      {/* Catalog View Tabs & Quick Archive Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setCatalogTab('ready')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              catalogTab === 'ready'
                ? 'bg-zinc-800 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Ready</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                catalogTab === 'ready'
                  ? 'bg-zinc-700/80 text-foreground font-semibold'
                  : 'bg-zinc-800 text-muted-foreground'
              }`}
            >
              {readyProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCatalogTab('archived')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              catalogTab === 'archived'
                ? 'bg-zinc-800 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Archived</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                catalogTab === 'archived'
                  ? 'bg-zinc-700/80 text-foreground font-semibold'
                  : 'bg-zinc-800 text-muted-foreground'
              }`}
            >
              {archivedProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCatalogTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              catalogTab === 'all'
                ? 'bg-zinc-800 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                catalogTab === 'all'
                  ? 'bg-zinc-700/80 text-foreground font-semibold'
                  : 'bg-zinc-800 text-muted-foreground'
              }`}
            >
              {allActiveProducts.length}
            </span>
          </button>
        </div>

        {outOfStockActiveProducts.length > 0 && catalogTab !== 'archived' && (
          <Button
            onClick={() => setShowArchiveOutOfStockConfirm(true)}
            variant="outline"
            size="sm"
            className="h-8.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5 rounded-xl transition-colors font-medium"
            title="Move all out-of-stock items to the Archived tab"
          >
            <Archive className="size-3.5" />
            <span>Archive Out-of-Stock ({outOfStockActiveProducts.length})</span>
          </Button>
        )}
      </div>

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

        {catalogTab !== 'ready' && (
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
        )}

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
        ) : catalogTab === 'archived' ? (
          <EmptyState
            title="No Archived Products"
            description="Out-of-stock or inactive products you archive will appear here to keep your ready stock list clean and focused."
          />
        ) : catalogTab === 'ready' ? (
          <EmptyState
            title="No Products in Ready Stock"
            description="All products are either currently out of stock or archived. Restock your catalog or add a new product."
            action={
              <Button onClick={onOpenAddProduct} size="sm" className="text-xs h-8 bg-primary text-primary-foreground font-medium">
                + Add New Product
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Product Catalog is Empty"
            description="No active products registered yet. Add a new product to start tracking inventory and sales."
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
          onOpenRestock={catalogTab === 'archived' ? undefined : onOpenRestock}
          onOpenAdjust={onOpenAdjust}
          onEdit={(p) => {
            setEditingProduct(p);
            setShowEditDialog(true);
          }}
          onDelete={setDeletingProduct}
          onArchive={setArchivingProduct}
          onUnarchive={(p) => unarchiveProduct(p.id)}
          onTransferToCollection={setTransferringProduct}
        />
      )}

      <ProductEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        product={editingProduct}
      />

      {/* Transfer to Collection Confirmation */}
      <ConfirmDialog
        open={!!transferringProduct}
        onOpenChange={(open) => !open && setTransferringProduct(null)}
        title="Transfer Product to Personal Collection?"
        description={`Move 1 unit of "${transferringProduct?.name}" (${transferringProduct?.sku}) to your Personal Collection? It will become a trackable personal asset in your Collection menu.`}
        confirmText="Transfer to Collection"
        cancelText="Cancel"
        variant="primary"
        icon="transfer"
        onConfirm={() => {
          if (transferringProduct) {
            transferProductToCollection(transferringProduct.id);
            setTransferringProduct(null);
          }
        }}
      />

      {/* Archive Single Product Confirmation */}
      <ConfirmDialog
        open={!!archivingProduct}
        onOpenChange={(open) => !open && setArchivingProduct(null)}
        title="Archive Product?"
        description={`Move "${archivingProduct?.name}" (${archivingProduct?.sku}) to the Archived list? It will be hidden from the Ready Stock list and sales orders until restored.`}
        confirmText="Archive Product"
        cancelText="Cancel"
        variant="warning"
        icon="warning"
        onConfirm={() => {
          if (archivingProduct) {
            archiveProduct(archivingProduct.id);
            setArchivingProduct(null);
          }
        }}
      />

      {/* Bulk Archive Out-of-Stock Confirmation */}
      <ConfirmDialog
        open={showArchiveOutOfStockConfirm}
        onOpenChange={setShowArchiveOutOfStockConfirm}
        title="Archive Out-of-Stock Items?"
        description={`This will move ${outOfStockActiveProducts.length} out-of-stock product${
          outOfStockActiveProducts.length > 1 ? 's' : ''
        } to the Archived list so your Ready Stock catalog only shows items currently available for sale. You can restore them anytime.`}
        confirmText={`Archive ${outOfStockActiveProducts.length} Product${
          outOfStockActiveProducts.length > 1 ? 's' : ''
        }`}
        cancelText="Cancel"
        variant="warning"
        icon="warning"
        onConfirm={() => {
          archiveOutOfStockProducts();
          setShowArchiveOutOfStockConfirm(false);
        }}
      />

      {/* Delete Product Confirmation */}
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
