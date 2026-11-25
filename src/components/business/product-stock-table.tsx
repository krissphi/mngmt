'use client';

import React, { useState, useMemo } from 'react';
import { Product, Category } from '@/types';
import { getAvailableStock } from '@/lib/calculations';
import { formatIDR } from '@/lib/currency';
import { resolveCategoryPair } from '@/lib/categories';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Pencil,
  Trash2,
  SlidersHorizontal,
  PackagePlus,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Archive,
  ArchiveRestore,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
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
  onOpenRestock?: (productId: string) => void;
  onOpenAdjust: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onArchive?: (product: Product) => void;
  onUnarchive?: (product: Product) => void;
  onTransferToCollection?: (product: Product) => void;
}

export function ProductStockTable({
  products,
  categories,
  sortState,
  onSort,
  onOpenRestock,
  onOpenAdjust,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onTransferToCollection,
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
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
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
                Category
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
              const rowNumber = (safeCurrentPage - 1) * pageSize + idx + 1;
              const avail = getAvailableStock(p);
              const isLow = p.stockOnHand <= p.minStockAlert;
              const isOut = p.stockOnHand === 0;
              const resolvedCat = resolveCategoryPair(categories, p.categoryId, p.subCategoryId, '');

              return (
                <TableRow
                  key={`${p.id}-${idx}`}
                  className="text-xs hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-2">
                    {rowNumber}
                  </TableCell>
                  <TableCell className="min-w-[190px] py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-foreground line-clamp-1">{p.name}</span>
                      {p.status === 'archived' && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 border-zinc-700 text-zinc-400 bg-zinc-900/60 font-normal shrink-0">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.brand || 'No Brand'}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-3 px-4">
                    {resolvedCat.main ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 py-0 font-normal">
                          {resolvedCat.mainName}
                        </Badge>
                        {resolvedCat.subName && (
                          <span className="text-[10px] text-muted-foreground">/ {resolvedCat.subName}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Uncategorized</span>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer outline-none"
                        title="Product Actions"
                        aria-label={`Actions for ${p.name}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {p.status === 'archived' ? (
                          <>
                            {onUnarchive && (
                              <DropdownMenuItem
                                onClick={() => onUnarchive(p)}
                                className="text-sky-400"
                              >
                                <ArchiveRestore className="size-3.5" />
                                <span>Restore to Ready</span>
                              </DropdownMenuItem>
                            )}
                            {onUnarchive && <DropdownMenuSeparator />}
                            <DropdownMenuItem onClick={() => onEdit(p)}>
                              <Pencil className="size-3.5" />
                              <span>Edit Product</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onDelete(p)}
                            >
                              <Trash2 className="size-3.5" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            {onOpenRestock && (
                              <DropdownMenuItem
                                onClick={() => onOpenRestock(p.id)}
                                className="text-emerald-500"
                              >
                                <PackagePlus className="size-3.5" />
                                <span>Restock</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onOpenAdjust(p.id)}>
                              <SlidersHorizontal className="size-3.5" />
                              <span>Adjust Stock</span>
                            </DropdownMenuItem>
                            {onTransferToCollection && p.stockOnHand > 0 && (
                              <DropdownMenuItem
                                onClick={() => onTransferToCollection(p)}
                                className="text-purple-400"
                              >
                                <Sparkles className="size-3.5" />
                                <span>To Collection</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(p)}>
                              <Pencil className="size-3.5" />
                              <span>Edit Product</span>
                            </DropdownMenuItem>
                            {onArchive && (
                              <DropdownMenuItem
                                onClick={() => onArchive(p)}
                                className="text-amber-400"
                              >
                                <Archive className="size-3.5" />
                                <span>Archive</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onDelete(p)}
                            >
                              <Trash2 className="size-3.5" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
