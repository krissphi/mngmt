'use client';

import React from 'react';
import { Asset, AssetCondition } from '@/types';
import { useStore } from '@/context/store-context';
import { formatIDR, formatSignedIDR } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export type AssetSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'value_desc'
  | 'value_asc'
  | 'cost_desc'
  | 'cost_asc'
  | 'gain_desc'
  | 'gain_asc';

interface AssetsTableProps {
  assets: Asset[];
  currentPage: number;
  pageSize: number;
  isFiltered: boolean;
  sortBy?: AssetSortOption;
  onSortChange?: (sort: AssetSortOption) => void;
  onUpdateCondition?: (assetId: string, newCondition: AssetCondition) => void;
  onEdit: (asset: Asset) => void;
  onTransferToProduct: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export function AssetsTable({
  assets,
  currentPage,
  pageSize,
  isFiltered,
  sortBy,
  onSortChange,
  onUpdateCondition,
  onEdit,
  onTransferToProduct,
  onDelete,
}: AssetsTableProps) {
  const { categories } = useStore();

  const handleHeaderSort = (field: 'name' | 'cost' | 'value' | 'gain') => {
    if (!onSortChange) return;

    if (field === 'name') {
      onSortChange(sortBy === 'name_asc' ? 'name_desc' : 'name_asc');
    } else if (field === 'cost') {
      onSortChange(sortBy === 'cost_desc' ? 'cost_asc' : 'cost_desc');
    } else if (field === 'value') {
      onSortChange(sortBy === 'value_desc' ? 'value_asc' : 'value_desc');
    } else if (field === 'gain') {
      onSortChange(sortBy === 'gain_desc' ? 'gain_asc' : 'gain_desc');
    }
  };

  const renderSortIcon = (field: 'name' | 'cost' | 'value' | 'gain') => {
    const isAsc = sortBy === `${field}_asc`;
    const isDesc = sortBy === `${field}_desc`;

    if (isAsc) return <ArrowUp className="size-3 text-primary ml-1 inline shrink-0" />;
    if (isDesc) return <ArrowDown className="size-3 text-primary ml-1 inline shrink-0" />;
    return <ArrowUpDown className="size-3 text-muted-foreground/40 ml-1 inline shrink-0 group-hover:text-muted-foreground" />;
  };

  const getConditionColor = (condition?: AssetCondition) => {
    switch (condition) {
      case 'mint':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'good':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'fair':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'needs_repair':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="w-10 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-2">
              #
            </TableHead>
            <TableHead className="py-3 px-4 min-w-[200px] text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => handleHeaderSort('name')}
                className="group inline-flex items-center hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Asset Name</span>
                {renderSortIcon('name')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-3 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Category
            </TableHead>
            <TableHead className="py-3 px-3 whitespace-nowrap text-center text-xs font-semibold text-muted-foreground uppercase">
              Condition
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => handleHeaderSort('cost')}
                className="group inline-flex items-center ml-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Purchase Cost</span>
                {renderSortIcon('cost')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => handleHeaderSort('value')}
                className="group inline-flex items-center ml-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Est. Value</span>
                {renderSortIcon('value')}
              </button>
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              <button
                type="button"
                onClick={() => handleHeaderSort('gain')}
                className="group inline-flex items-center ml-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
              >
                <span>Gain / Loss</span>
                {renderSortIcon('gain')}
              </button>
            </TableHead>
            <TableHead className="w-24 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-2">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60">
          {assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                {isFiltered ? 'No personal assets match your filter criteria.' : 'No personal assets recorded yet.'}
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset, idx) => {
              const rowNumber = (currentPage - 1) * pageSize + idx + 1;
              const cost = asset.purchasePrice ?? asset.purchaseCost ?? 0;
              const estVal = asset.currentEstimatedValue ?? asset.sellingPrice ?? 0;
              const diff = estVal - cost;
              const pct = cost > 0 ? ((diff / cost) * 100).toFixed(0) : '0';
              const catName = (asset.categoryId ? categories.find((c) => c.id === asset.categoryId)?.name : undefined) || asset.category || 'Product';

              return (
                <TableRow key={asset.id} className="text-xs hover:bg-muted/20 transition-colors">
                  <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-2">
                    {rowNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 min-w-[190px]">
                    <div className="font-semibold text-foreground line-clamp-1">{asset.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{asset.brand || 'No Brand'}</div>
                  </TableCell>
                  <TableCell className="py-3 px-3 whitespace-nowrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold h-5 px-1.5 py-0 bg-muted/60">
                      {catName}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-3 whitespace-nowrap text-center">
                    {/* Inline Condition Dropdown */}
                    <select
                      value={asset.condition || 'good'}
                      onChange={(e) => onUpdateCondition?.(asset.id, e.target.value as AssetCondition)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${getConditionColor(
                        asset.condition
                      )}`}
                      title="Click to change condition instantly"
                    >
                      <option value="mint" className="bg-popover text-popover-foreground">Mint</option>
                      <option value="good" className="bg-popover text-popover-foreground">Good</option>
                      <option value="fair" className="bg-popover text-popover-foreground">Fair</option>
                      <option value="needs_repair" className="bg-popover text-popover-foreground">Repair</option>
                    </select>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatIDR(cost)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right whitespace-nowrap tabular-nums font-semibold text-foreground">
                    {formatIDR(estVal)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right whitespace-nowrap tabular-nums font-medium">
                    <span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {formatSignedIDR(diff)}
                      <span className="text-[10px] ml-1 opacity-80">({diff > 0 ? '+' : ''}{pct}%)</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onTransferToProduct(asset)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded transition-colors"
                        title="Transfer to Store Inventory (Sell)"
                      >
                        <ArrowRightLeft className="size-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(asset)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Edit Asset"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(asset.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
