'use client';

import React from 'react';
import { Asset } from '@/types';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { Pencil, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onTransferToProduct: (asset: Asset) => void;
  onDelete?: (id: string) => void;
}

export function AssetCard({ asset, onEdit, onTransferToProduct, onDelete }: AssetCardProps) {
  const { categories } = useStore();
  const cost = asset.purchasePrice ?? asset.purchaseCost ?? 0;
  const estVal = asset.currentEstimatedValue ?? asset.sellingPrice ?? 0;
  const diff = estVal - cost;
  const catName = (asset.categoryId ? categories.find((c) => c.id === asset.categoryId)?.name : undefined) || asset.category || 'Product';
  const conditionStr = asset.condition ? asset.condition.replace('_', ' ') : 'good';

  return (
    <div className="p-4 rounded-xl border border-border/60 bg-card shadow-2xs hover:border-border transition-colors flex flex-col justify-between space-y-3">
      {/* 1. Header: Category, Condition & Optional Photo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold uppercase text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted">
            {catName}
          </span>
          <span className="text-muted-foreground capitalize text-[11px]">
            Condition: <b className="text-foreground">{conditionStr}</b>
          </span>
        </div>

        <div className="pt-1">
          <h4 className="font-semibold text-sm text-foreground line-clamp-1">{asset.name}</h4>
          <p className="text-[11px] text-muted-foreground font-medium">{asset.brand || 'No Brand'}</p>
        </div>
      </div>

      {/* 2. Market Valuation & Cost */}
      <div className="pt-2 border-t border-border/40 space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-muted-foreground">Market Estimate</span>
          <span className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">
            {formatIDR(estVal)}
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
          <span>Cost: {formatIDR(cost)}</span>
          <span
            className={`font-semibold tabular-nums whitespace-nowrap ${
              diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {diff >= 0 ? '+' : ''}{formatIDR(diff)}
          </span>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="pt-2 flex items-center gap-2 border-t border-border/40">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2.5 gap-1.5 flex-1 font-medium text-primary hover:text-primary hover:bg-primary/5"
          onClick={() => onTransferToProduct(asset)}
          title="Transfer this asset to Sales Catalog"
        >
          <ArrowRightLeft className="size-3" />
          <span>Move to Store</span>
        </Button>

        <button
          onClick={() => onEdit(asset)}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
          title="Edit asset details"
        >
          <Pencil className="size-3.5" />
        </button>

        {onDelete && (
          <button
            onClick={() => onDelete(asset.id)}
            className="p-1.5 text-muted-foreground hover:text-rose-600 rounded transition-colors"
            title="Delete asset"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
