'use client';

import React from 'react';
import { Asset, AssetCondition } from '@/types';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface AssetsTableProps {
  assets: Asset[];
  currentPage: number;
  pageSize: number;
  isFiltered: boolean;
  onEdit: (asset: Asset) => void;
  onTransferToProduct: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export function AssetsTable({
  assets,
  currentPage,
  pageSize,
  isFiltered,
  onEdit,
  onTransferToProduct,
  onDelete,
}: AssetsTableProps) {
  const { categories } = useStore();

  const getConditionBadge = (condition?: AssetCondition) => {
    switch (condition) {
      case 'mint':
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            Mint
          </Badge>
        );
      case 'good':
        return (
          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            Good
          </Badge>
        );
      case 'fair':
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Fair
          </Badge>
        );
      case 'needs_repair':
        return (
          <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
            Repair
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{condition}</Badge>;
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
              Asset Name
            </TableHead>
            <TableHead className="py-3 px-3 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Category
            </TableHead>
            <TableHead className="py-3 px-3 whitespace-nowrap text-center text-xs font-semibold text-muted-foreground uppercase">
              Condition
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Purchase Cost
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Est. Value
            </TableHead>
            <TableHead className="py-3 px-4 text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
              Gain / Loss
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
                    {getConditionBadge(asset.condition)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatIDR(cost)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right whitespace-nowrap tabular-nums font-semibold text-foreground">
                    {formatIDR(estVal)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right whitespace-nowrap tabular-nums font-medium">
                    <span className={diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {diff >= 0 ? '+' : ''}{formatIDR(diff)}
                      <span className="text-[10px] ml-1 opacity-80">({diff >= 0 ? '+' : ''}{pct}%)</span>
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
