'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Asset, AssetCondition } from '@/types';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { AssetCard } from '@/components/assets/asset-card';
import { AssetFormSection } from '@/components/assets/asset-form';
import { AssetsTable } from './assets-table';
import { TablePagination } from '@/components/shared/table-pagination';
import {
  Gem,
  Plus,
  Search,
  ArrowRightLeft,
  LayoutGrid,
  List,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState, NoSearchResultState } from '@/components/states/state-views';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface AssetsTabProps {
  showAddForm?: boolean;
  setShowAddForm?: (v: boolean) => void;
}

type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'value_desc'
  | 'value_asc'
  | 'cost_desc'
  | 'cost_asc'
  | 'gain_desc'
  | 'gain_asc';
type ViewMode = 'table' | 'grid';

export function AssetsTab({ showAddForm, setShowAddForm }: AssetsTabProps) {
  const { assets, deleteAsset, updateProduct, categories } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [transferringAsset, setTransferringAsset] = useState<Asset | null>(null);
  const [transferPrice, setTransferPrice] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isFormOpen = showAddForm !== undefined ? showAddForm : internalAddOpen;
  const setFormOpen = setShowAddForm || setInternalAddOpen;

  const categoryNameMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  }, [categories]);

  // Extract unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    categories.filter((c) => c.type === 'product').forEach((c) => set.add(c.name));
    assets.forEach((a) => {
      const catName = a.categoryId ? categories.find((c) => c.id === a.categoryId)?.name : a.category;
      if (catName) set.add(catName);
    });
    return Array.from(set).sort();
  }, [assets, categories]);

  const isFiltered =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedCondition !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setSortBy('name_asc');
    setCurrentPage(1);
  };

  // Filtered and sorted assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        const q = searchQuery.toLowerCase().trim();
        const catName = (a.categoryId ? categoryNameMap.get(a.categoryId) : undefined) || (a.category ? a.category.toLowerCase() : '');
        const brandStr = a.brand ? a.brand.toLowerCase() : '';
        const matchesQuery =
          !q ||
          a.name.toLowerCase().includes(q) ||
          brandStr.includes(q) ||
          catName.includes(q) ||
          (a.notes && a.notes.toLowerCase().includes(q));

        const assetCatName = (a.categoryId ? categories.find((c) => c.id === a.categoryId)?.name : undefined) || a.category || '';
        const matchesCategory = selectedCategory === 'all' || assetCatName === selectedCategory;
        const matchesCondition = selectedCondition === 'all' || a.condition === selectedCondition;

        return matchesQuery && matchesCategory && matchesCondition;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'value_desc') return (b.currentEstimatedValue || 0) - (a.currentEstimatedValue || 0);
        if (sortBy === 'value_asc') return (a.currentEstimatedValue || 0) - (b.currentEstimatedValue || 0);
        if (sortBy === 'cost_desc') return (b.purchasePrice || 0) - (a.purchasePrice || 0);
        if (sortBy === 'cost_asc') return (a.purchasePrice || 0) - (b.purchasePrice || 0);
        if (sortBy === 'gain_desc') {
          const gainA = (a.currentEstimatedValue || 0) - (a.purchasePrice || 0);
          const gainB = (b.currentEstimatedValue || 0) - (b.purchasePrice || 0);
          return gainB - gainA;
        }
        if (sortBy === 'gain_asc') {
          const gainA = (a.currentEstimatedValue || 0) - (a.purchasePrice || 0);
          const gainB = (b.currentEstimatedValue || 0) - (b.purchasePrice || 0);
          return gainA - gainB;
        }
        return 0;
      });
  }, [assets, searchQuery, selectedCategory, selectedCondition, sortBy, categoryNameMap, categories]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAssets = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, safeCurrentPage, pageSize]);

  // Overall Portfolio Valuation Metrics: Comparison of Total Purchased Cost vs Total Estimated
  const { totalEstimatedValue, totalPurchaseCost, totalGainLoss, gainPercent } = useMemo(() => {
    let est = 0;
    let cost = 0;
    for (const a of assets) {
      est += a.currentEstimatedValue || a.sellingPrice || 0;
      cost += a.purchasePrice || a.purchaseCost || 0;
    }
    const diff = est - cost;
    const pct = cost > 0 ? ((diff / cost) * 100).toFixed(1) : '0';
    return {
      totalEstimatedValue: est,
      totalPurchaseCost: cost,
      totalGainLoss: diff,
      gainPercent: pct,
    };
  }, [assets]);

  const handleUpdateCondition = (assetId: string, newCondition: AssetCondition) => {
    updateProduct(assetId, { condition: newCondition });
  };

  const handleStartTransfer = (asset: Asset) => {
    setTransferringAsset(asset);
    setTransferPrice(String(asset.currentEstimatedValue || asset.sellingPrice || 0));
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringAsset) return;

    updateProduct(transferringAsset.id, {
      productType: 'preloved',
      sellingPrice: Number(transferPrice) || transferringAsset.sellingPrice || transferringAsset.currentEstimatedValue,
    });

    setTransferringAsset(null);
  };

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setFormOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormOpen(true);
  };

  const assetToDelete = assets.find((a) => a.id === deletingId);

  const formattedGainLoss = formatSignedIDR(totalGainLoss);
  const formattedPct = totalGainLoss > 0 ? `+${gainPercent}%` : `${gainPercent}%`;

  return (
    <div className="space-y-4">
      {/* Clean Tab Header with Text Summary (No Boxes) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-medium flex flex-wrap items-center gap-1.5">
          <span>Estimated Assets Total: <b className="text-foreground">{formatIDR(totalEstimatedValue)}</b></span>
          <span>(Cost: {formatIDR(totalPurchaseCost)})</span>
          <span className="text-muted-foreground/60">•</span>
          <span className={totalGainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
            {formattedGainLoss} ({formattedPct})
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span>{assets.length} {assets.length === 1 ? 'item' : 'items'} recorded</span>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center border border-border/80 rounded-md p-0.5 bg-card">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid / Card View"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>

          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add Asset</span>
          </Button>
        </div>
      </div>

      {/* Comprehensive Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/50">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search asset, category, notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 h-8 text-xs bg-card"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="h-8 text-xs bg-card border border-border rounded-md px-2.5 font-medium text-foreground focus-visible:outline-none"
        >
          <option value="all">All Categories</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Condition Filter */}
        <select
          value={selectedCondition}
          onChange={(e) => {
            setSelectedCondition(e.target.value);
            setCurrentPage(1);
          }}
          className="h-8 text-xs bg-card border border-border rounded-md px-2.5 font-medium text-foreground focus-visible:outline-none"
        >
          <option value="all">All Conditions</option>
          <option value="mint">Mint</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="needs_repair">Needs Repair</option>
        </select>

        {isFiltered && (
          <Button
            onClick={resetFilters}
            variant="ghost"
            size="sm"
            className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Main Content: Table or Grid */}
      {filteredAssets.length === 0 ? (
        searchQuery || isFiltered ? (
          <NoSearchResultState query={searchQuery || 'selected filters'} onReset={resetFilters} />
        ) : (
          <EmptyState
            icon={<Gem className="size-8" />}
            title="No Personal Assets Found"
            description="Track personal collectibles, electronics, and valuable gear."
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="size-3.5 mr-1" />
                Add New Asset
              </Button>
            }
          />
        )
      ) : viewMode === 'table' ? (
        <>
          <AssetsTable
            assets={paginatedAssets}
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            isFiltered={isFiltered}
            sortBy={sortBy}
            onSortChange={(sort) => {
              setSortBy(sort);
              setCurrentPage(1);
            }}
            onUpdateCondition={handleUpdateCondition}
            onEdit={handleEdit}
            onTransferToProduct={handleStartTransfer}
            onDelete={(id) => setDeletingId(id)}
          />

          <TablePagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredAssets.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50]}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={handleEdit}
                onTransferToProduct={handleStartTransfer}
                onDelete={(id) => setDeletingId(id)}
              />
            ))}
          </div>

          <TablePagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredAssets.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[12, 24, 48]}
          />
        </>
      )}

      {/* Asset Form Dialog */}
      <AssetFormSection
        open={isFormOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingAsset(null);
        }}
        initialData={editingAsset}
      />

      {/* Transfer to Sales Catalog Dialog */}
      <Dialog open={!!transferringAsset} onOpenChange={(open) => !open && setTransferringAsset(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRightLeft className="size-4 text-primary" />
              <span>Transfer Asset to Sales Catalog</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              This asset will be transferred to your active business inventory as 1 ready-to-sell unit.
            </DialogDescription>
          </DialogHeader>

          {transferringAsset && (
            <form onSubmit={handleConfirmTransfer} className="space-y-3 pt-2">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1">
                <div className="font-semibold text-foreground line-clamp-1">{transferringAsset.name}</div>
                <div className="text-muted-foreground flex justify-between">
                  <span>Original Purchase Cost:</span>
                  <span className="font-medium text-foreground">{formatIDR(transferringAsset.purchasePrice)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Set Selling Price in Store (Rp)
                </label>
                <Input
                  type="number"
                  value={transferPrice}
                  onChange={(e) => setTransferPrice(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setTransferringAsset(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
                  Transfer Now
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Personal Asset?"
        description={`Are you sure you want to remove "${assetToDelete?.name}" from your personal assets?`}
        confirmText="Delete Asset"
        cancelText="Cancel"
        onConfirm={() => {
          if (deletingId) {
            deleteAsset(deletingId);
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
}
