'use client';

import React, { useState, useMemo } from 'react';
import { Product, Category } from '@/types';
import { getAvailableStock } from '@/lib/calculations';
import { formatIDR } from '@/lib/currency';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { TablePagination } from '@/components/shared/table-pagination';

interface ProductStockTableProps {
  products: Product[];
  categories: Category[];
  onOpenAdjust: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductStockTable({
  products,
  categories,
  onOpenAdjust,
  onEdit,
  onDelete,
}: ProductStockTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(products.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="w-10 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-2">
                #
              </TableHead>
              <TableHead className="min-w-[190px] text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                Product
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                SKU / Cat
              </TableHead>
              <TableHead className="text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                Cost
              </TableHead>
              <TableHead className="text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                Selling Price
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                On Hand
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                Reserved
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                Available
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                Sold
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {paginatedProducts.map((p, idx) => {
              const rowNumber = (currentPage - 1) * pageSize + idx + 1;
              const avail = getAvailableStock(p);
              const isLow = p.stockOnHand <= p.minStockAlert;
              const isOut = p.stockOnHand === 0;
              const cat = categories.find((c) => c.id === p.categoryId);

              return (
                <TableRow
                  key={`${p.id}-${idx}`}
                  className="text-xs hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-2">
                    {rowNumber}
                  </TableCell>
                  <TableCell className="min-w-[190px] py-3 px-4">
                    <div className="font-semibold text-foreground line-clamp-1">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.brand || 'No Brand'}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-3 px-4">
                    <div className="font-mono text-muted-foreground">{p.sku}</div>
                    {cat && (
                      <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 py-0 font-normal mt-0.5">
                        {cat.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums whitespace-nowrap py-3 px-4">
                    {p.purchaseCost > 0 ? formatIDR(p.purchaseCost) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground tabular-nums whitespace-nowrap py-3 px-4">
                    {formatIDR(p.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-center font-semibold tabular-nums whitespace-nowrap py-3 px-4">
                    <div className="inline-flex items-center gap-1 justify-center">
                      {isLow && !isOut && (
                        <span title="Low stock alert">
                          <AlertTriangle className="size-3 text-amber-500" />
                        </span>
                      )}
                      <span className={isOut ? 'text-rose-600 font-bold' : isLow ? 'text-amber-600 font-bold' : 'text-foreground'}>
                        {p.stockOnHand}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-amber-600 font-medium tabular-nums whitespace-nowrap py-3 px-4">
                    {p.stockReserved}
                  </TableCell>
                  <TableCell className="text-center text-emerald-600 font-semibold tabular-nums whitespace-nowrap py-3 px-4">
                    {avail}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground tabular-nums whitespace-nowrap py-3 px-4">
                    {p.stockSold}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap py-3 px-4">
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      <Button
                        onClick={() => onOpenAdjust(p.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                        title="Adjust Stock"
                      >
                        <SlidersHorizontal className="size-3" />
                        <span>Adjust</span>
                      </Button>
                      <button
                        onClick={() => onEdit(p)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                        title="Edit Product"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="p-1.5 text-muted-foreground hover:text-rose-600 rounded transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={products.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50]}
      />
    </div>
  );
}
