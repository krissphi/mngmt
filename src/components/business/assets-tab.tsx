'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Asset } from '@/types';
import { formatIDR } from '@/lib/currency';
import { AssetCard } from '@/components/assets/asset-card';
import { AssetFormSection } from '@/components/assets/asset-form';
import { Gem, Plus, Search, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { EmptyState, NoSearchResultState } from '@/components/states/state-views';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface AssetsTabProps {
  showAddForm?: boolean;
  setShowAddForm?: (v: boolean) => void;
}

export function AssetsTab({ showAddForm, setShowAddForm }: AssetsTabProps) {
  const { assets, deleteAsset, addProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [transferringAsset, setTransferringAsset] = useState<Asset | null>(null);
  const [transferPrice, setTransferPrice] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isFormOpen = showAddForm !== undefined ? showAddForm : internalAddOpen;
  const setFormOpen = setShowAddForm || setInternalAddOpen;

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q))
    );
  }, [assets, searchQuery]);

  const handleStartTransfer = (asset: Asset) => {
    setTransferringAsset(asset);
    setTransferPrice(String(asset.currentEstimatedValue));
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringAsset) return;

    const sku = `KOL-${transferringAsset.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    addProduct({
      name: transferringAsset.name,
      sku,
      productType: 'personal_collection',
      purchaseCost: transferringAsset.purchasePrice,
      sellingPrice: Number(transferPrice) || transferringAsset.currentEstimatedValue,
      stockOnHand: 1,
      minStockAlert: 0,
      status: 'active',
      description: `Personal asset (Condition: ${transferringAsset.condition}). ${transferringAsset.notes || ''}`,
    });

    deleteAsset(transferringAsset.id);
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

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search personal assets or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-8.5 text-xs"
          />
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="text-xs h-8 gap-1.5 self-start sm:self-auto bg-primary text-primary-foreground font-medium"
        >
          <Plus className="size-3.5" />
          <span>Add Asset</span>
        </Button>
      </div>

      <AssetFormSection
        open={isFormOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingAsset(null);
        }}
        initialData={editingAsset}
      />

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        searchQuery ? (
          <NoSearchResultState query={searchQuery} onReset={() => setSearchQuery('')} />
        ) : (
          <EmptyState
            icon={<Gem className="size-8" />}
            title="No Personal Assets Found"
            description="Track personal collectibles, hobby figures, and high-value gear."
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="size-3.5 mr-1" />
                Add New Asset
              </Button>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onEdit={handleEdit}
              onTransferToProduct={handleStartTransfer}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

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
