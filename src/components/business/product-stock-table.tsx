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
import { Pencil, Trash2, SlidersHorizontal, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { TablePagination } from '@/components/shared/table-pagination';

export type ProductSortField = 'name' | 'cost' | 'price' | 'stock' | 'available' | 'sold';
export type SortDirection = 'asc' | 'desc';
export interface ProductSortState {
  field: ProductSortField;
  direction: SortDirection;
}

interface ProductStockTableProps {
  products: Product[];
  categories: Category[];
  sortState?: ProductSortState;
  onSort?: (field: ProductSortField) => void;
  onOpenAdjust: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductStockTable({
  products,
  categories,
  sortState,
  onSort,
  onOpenAdjust,
  onEdit,
  onDelete,
}: ProductStockTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const renderSortIcon = (field: ProductSortField) => {
    if (!sortState) return null;
    const isField = sortState.field === field;
    if (isField && sortState.direction === 'asc') {
      return <ArrowUp className="size-3 text-primary ml-1 inline shrink-0" />;
    }
    if (isField && sortState.direction === 'desc') {
      return <ArrowDown className="size-3 text-primary ml-1 inline shrink-0" />;
    }
    return <ArrowUpDown className="size-3 text-muted-foreground/40 ml-1 inline shrink-0 group-hover:text-muted-foreground" />;
  };

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
                <button
                  type="button"
                  onClick={() => onSort?.('name')}
                  className="group inline-flex items-center hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>Product</span>
                  {renderSortIcon('name')}
                </button>
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                SKU / Cat
              </TableHead>
              <TableHead className="text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                <button
                  type="button"
                  onClick={() => onSort?.('cost')}
                  className="group inline-flex items-center ml-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>Cost</span>
                  {renderSortIcon('cost')}
                </button>
              </TableHead>
              <TableHead className="text-right whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                <button
                  type="button"
                  onClick={() => onSort?.('price')}
                  className="group inline-flex items-center ml-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>Selling Price</span>
                  {renderSortIcon('price')}
                </button>
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                <button
                  type="button"
                  onClick={() => onSort?.('stock')}
                  className="group inline-flex items-center mx-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>On Hand</span>
                  {renderSortIcon('stock')}
                </button>
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                Reserved
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                <button
                  type="button"
                  onClick={() => onSort?.('available')}
                  className="group inline-flex items-center mx-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>Available</span>
                  {renderSortIcon('available')}
                </button>
              </TableHead>
              <TableHead className="text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase py-3 px-4">
                <button
                  type="button"
                  onClick={() => onSort?.('sold')}
                  className="group inline-flex items-center mx-auto hover:text-foreground font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>Sold</span>
                  {renderSortIcon('sold')}
                </button>
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
                    <div>{p.purchaseCost > 0 ? formatIDR(p.purchaseCost) : '-'}</div>
                    {p.stockOnHand > 0 && p.purchaseCost > 0 && (
                      <div className="text-[10px] text-muted-foreground/70" title="Total purchase cost of remaining stock">
                        Stock: {formatIDR(p.purchaseCost * p.stockOnHand)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground tabular-nums whitespace-nowrap py-3 px-4">
                    <div>{formatIDR(p.sellingPrice)}</div>
                    {p.stockOnHand > 0 && (
                      <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400" title="Total sales value of remaining stock">
                        Stock: {formatIDR(p.sellingPrice * p.stockOnHand)}
                      </div>
                    )}
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
