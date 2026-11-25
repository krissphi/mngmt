'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { WishlistItem } from '@/types';
import { formatIDR } from '@/lib/currency';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Trash2,
  CheckCircle2,
  Search,
  Sparkles,
  Plus,
  Pencil,
  Calendar,
  Circle,
} from 'lucide-react';
import { WishlistDialog } from './wishlist-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState, NoSearchResultState } from '@/components/states/state-views';

interface WishlistTabProps {
  showAddDialog?: boolean;
  setShowAddDialog?: (v: boolean) => void;
}

type StatusFilter = 'all' | 'planned' | 'purchased';

export function WishlistTab({ showAddDialog, setShowAddDialog }: WishlistTabProps) {
  const { wishlist, updateWishlistItem, deleteWishlistItem } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WishlistItem | null>(null);

  const isAddOpen = showAddDialog !== undefined ? showAddDialog : internalAddOpen;
  const setAddOpen = setShowAddDialog || setInternalAddOpen;

  const filteredItems = useMemo(() => {
    return wishlist
      .filter((item) => {
        if (statusFilter === 'planned' && item.isPurchased) return false;
        if (statusFilter === 'purchased' && !item.isPurchased) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!item.name.toLowerCase().includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.isPurchased !== b.isPurchased) {
          return a.isPurchased ? 1 : -1;
        }
        return 0;
      });
  }, [wishlist, searchQuery, statusFilter]);

  const { plannedCost, purchasedCost, purchasedCount, plannedCount } = useMemo(() => {
    let planned = 0;
    let purchasedSum = 0;
    let purchased = 0;
    let unpurchased = 0;

    for (const item of wishlist) {
      if (item.isPurchased) {
        purchasedSum += item.estimatedPrice;
        purchased++;
      } else {
        planned += item.estimatedPrice;
        unpurchased++;
      }
    }

    return {
      plannedCost: planned,
      purchasedCost: purchasedSum,
      purchasedCount: purchased,
      plannedCount: unpurchased,
    };
  }, [wishlist]);

  const handleTogglePurchased = (item: WishlistItem) => {
    updateWishlistItem(item.id, {
      isPurchased: !item.isPurchased,
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteWishlistItem(deletingItem.id);
    setDeletingItem(null);
  };

  return (
    <div className="space-y-6">
      <SummaryBanner
        label="Planned Wishlist Total"
        value={formatIDR(plannedCost)}
        meta={[
          `${wishlist.length} ${wishlist.length === 1 ? 'Item' : 'Items'}`,
          `${plannedCount} Planned`,
          `${purchasedCount} Purchased`,
          ...(purchasedCost > 0 ? [`Acquired ${formatIDR(purchasedCost)}`] : []),
        ]}
        actions={
          <Button
            onClick={() => {
              setEditingItem(null);
              setAddOpen(true);
            }}
            size="sm"
            className="text-xs h-8.5 gap-1.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Add Item</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative max-w-sm w-full">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search wishlist items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-8.5 text-xs bg-card/50 border-border/60 rounded-xl"
          />
        </div>

        <div className="inline-flex p-0.5 bg-secondary/40 backdrop-blur-xs rounded-xl border border-border/40 gap-0.5 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({wishlist.length})
          </button>
          <button
            onClick={() => setStatusFilter('planned')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              statusFilter === 'planned'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Planned ({plannedCount})
          </button>
          <button
            onClick={() => setStatusFilter('purchased')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              statusFilter === 'purchased'
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Purchased ({purchasedCount})
          </button>
        </div>
      </div>

      {/* Modern Wishlist Grid */}
      {filteredItems.length === 0 ? (
        searchQuery || statusFilter !== 'all' ? (
          <NoSearchResultState
            query={searchQuery || statusFilter}
            onReset={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          />
        ) : (
          <EmptyState
            icon={<Sparkles className="size-8" />}
            title="Wishlist is Empty"
            description="Add items you plan to buy in the future."
            action={
              <Button onClick={() => setAddOpen(true)} size="sm">
                + Add First Item
              </Button>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group rounded-2xl border backdrop-blur-xs p-5 transition-all duration-200 flex flex-col justify-between space-y-4 ${
                item.isPurchased
                  ? 'border-emerald-500/30 bg-emerald-500/[0.04] hover:border-emerald-500/50'
                  : 'border-border/50 bg-card/60 hover:border-border/90 hover:bg-card/90'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.isPurchased
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}
                  >
                    {item.isPurchased ? (
                      <CheckCircle2 className="size-4.5" />
                    ) : (
                      <Sparkles className="size-4.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4
                      className={`font-semibold text-sm leading-snug break-words ${
                        item.isPurchased ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {item.name}
                    </h4>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span className={item.isPurchased ? 'text-emerald-500 font-medium' : ''}>
                        {item.isPurchased ? 'Purchased' : 'Planned'}
                      </span>
                      {item.targetDate && (
                        <>
                          <span>•</span>
                          <span className="font-mono inline-flex items-center gap-1">
                            <Calendar className="size-3" />
                            {item.targetDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
                    title="Edit item"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-accent/60 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Estimated Price */}
              <div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium block">
                  Estimated Price
                </span>
                <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-mono tabular-nums mt-0.5">
                  {formatIDR(item.estimatedPrice)}
                </div>
              </div>

              {/* Clean Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                <button
                  onClick={() => handleTogglePurchased(item)}
                  className={`flex items-center gap-1.5 font-medium py-0.5 transition-colors ${
                    item.isPurchased
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-emerald-500 hover:text-emerald-400'
                  }`}
                >
                  {item.isPurchased ? (
                    <>
                      <Circle className="size-3.5" />
                      <span>Move to Planned</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      <span>Mark Purchased</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <WishlistDialog
        open={isAddOpen || !!editingItem}
        onOpenChange={(v) => {
          if (!v) {
            setAddOpen(false);
            setEditingItem(null);
          }
        }}
        initialItem={editingItem}
      />

      <ConfirmDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete Wishlist Item?"
        description={`Are you sure you want to delete "${deletingItem?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
