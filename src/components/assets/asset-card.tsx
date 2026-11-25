'use client';

import React from 'react';
import { Asset } from '@/types';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { resolveCategoryPair } from '@/lib/categories';
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
  const resolvedCat = resolveCategoryPair(categories, asset.categoryId, asset.subCategoryId, asset.category || 'Collection');
  const catName = resolvedCat.fullName;
  const conditionStr = asset.condition ? asset.condition.replace('_', ' ') : 'good';

  return (
    <div className="group rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs p-5 hover:border-border/90 hover:bg-card/90 transition-all duration-200 flex flex-col justify-between space-y-4">
      {/* Top Header: Tag & Condition + Quick Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-md bg-muted/60 border border-border/40">
            {catName}
          </span>
          <span className="text-[11px] text-muted-foreground capitalize">
            {conditionStr}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(asset)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/60 transition-colors"
            title="Edit item"
          >
            <Pencil className="size-3.5" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(asset.id)}
              className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-accent/60 transition-colors"
              title="Delete item"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle: Item Name, Brand & Valuation */}
      <div>
        <h4 className="font-semibold text-sm text-foreground leading-snug break-words">{asset.name}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{asset.brand || 'No Brand'}</p>

        <div className="mt-3 flex items-baseline justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Est. Value</span>
            <div className="text-lg font-bold font-mono tabular-nums text-foreground mt-0.5">
              {formatIDR(estVal)}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-mono tabular-nums">
              Cost {formatIDR(cost)}
            </span>
            <div
              className={`text-xs font-mono font-semibold tabular-nums mt-0.5 ${
                diff >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {diff >= 0 ? '+' : ''}{formatIDR(diff)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="pt-2 border-t border-border/40">
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs gap-1.5 font-medium border-border/60 hover:bg-accent/60 rounded-lg"
          onClick={() => onTransferToProduct(asset)}
        >
          <ArrowRightLeft className="size-3.5 text-muted-foreground" />
          <span>Move to Store</span>
        </Button>
      </div>
    </div>
  );
}
