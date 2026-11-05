'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { WishlistItem } from '@/types';
import { formatIDR } from '@/lib/currency';
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

  // Filtered items
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

  // Overall metric totals
  const { plannedCost, purchasedCount, plannedCount } = useMemo(() => {
    let planned = 0;
    let purchased = 0;
    let unpurchased = 0;

    for (const item of wishlist) {
      if (item.isPurchased) {
        purchased++;
      } else {
        planned += item.estimatedPrice;
        unpurchased++;
      }
    }

    return {
      plannedCost: planned,
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
    <div className="space-y-4">
      {/* Standard Tab Toolbar with Text Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-medium">
          Estimated Wishlist Total: <b className="text-foreground">{formatIDR(plannedCost)}</b> ({plannedCount} planned, {purchasedCount} purchased)
        </div>

        <Button
          onClick={() => {
            setEditingItem(null);
            setAddOpen(true);
          }}
          size="sm"
          className="text-xs h-8 gap-1.5 self-start sm:self-auto bg-primary text-primary-foreground font-medium shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Add Item</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="relative max-w-xs w-full">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search wishlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 border border-border/60 rounded-md p-0.5 bg-muted/20 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              statusFilter === 'all'
                ? 'bg-card text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('planned')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              statusFilter === 'planned'
                ? 'bg-card text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Planned ({plannedCount})
          </button>
          <button
            onClick={() => setStatusFilter('purchased')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              statusFilter === 'purchased'
                ? 'bg-card text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Purchased ({purchasedCount})
          </button>
        </div>
      </div>

      {/* Items Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border bg-card transition-all flex flex-col justify-between space-y-2.5 ${
                item.isPurchased
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border/60 hover:border-border'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`font-semibold text-sm leading-snug line-clamp-1 ${
                      item.isPurchased ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {item.name}
                  </h4>
                  {item.isPurchased ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-semibold shrink-0">
                      <CheckCircle2 className="size-3.5" /> Purchased
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[11px] shrink-0">
                      Planned
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-0.5">
                  <span className="font-bold text-base text-foreground tabular-nums">
                    {formatIDR(item.estimatedPrice)}
                  </span>
                  {item.targetDate && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="size-3 text-muted-foreground" />
                      {item.targetDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5">
                <Button
                  size="sm"
                  variant={item.isPurchased ? 'outline' : 'secondary'}
                  onClick={() => handleTogglePurchased(item)}
                  className="h-7 text-xs px-2.5 gap-1.5 flex-1 font-medium"
                >
                  {item.isPurchased ? (
                    <>
                      <Circle className="size-3" />
                      <span>Mark as Planned</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Mark as Purchased</span>
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setEditingItem(item)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                  title="Edit item"
                >
                  <Pencil className="size-3.5" />
                </button>

                <button
                  onClick={() => setDeletingItem(item)}
                  className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
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

      {/* Delete Confirmation */}
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
