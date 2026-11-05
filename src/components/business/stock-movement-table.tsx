'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState, NoSearchResultState } from '@/components/states/state-views';
import { TablePagination } from '@/components/shared/table-pagination';

export function StockMovementTable() {
  const { inventoryMovements, products } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredMovements = useMemo(() => {
    return inventoryMovements.filter((m) => {
      const q = searchQuery.toLowerCase();
      const prod = products.find((p) => p.id === m.productId);
      const prodName = prod?.name.toLowerCase() || '';
      const notes = (m.notes || '').toLowerCase();
      const type = m.type.toLowerCase();
      return prodName.includes(q) || notes.includes(q) || type.includes(q);
    });
  }, [inventoryMovements, products, searchQuery]);

  const totalPages = Math.ceil(filteredMovements.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMovements = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search audit trail or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8.5 h-8 text-xs"
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {filteredMovements.length} logged movement{filteredMovements.length === 1 ? '' : 's'}
        </span>
      </div>

      {filteredMovements.length === 0 ? (
        searchQuery ? (
          <NoSearchResultState
            query={searchQuery}
            onReset={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
          />
        ) : (
          <EmptyState
            title="No Stock Movements Recorded"
            description="All stock additions, sales fulfillments, and manual adjustments will appear here automatically."
          />
        )
      ) : (
        <>
          <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-3">
                    #
                  </TableHead>
                  <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
                    Timestamp
                  </TableHead>
                  <TableHead className="py-3 px-4 min-w-[180px] text-xs font-semibold text-muted-foreground uppercase">
                    Product
                  </TableHead>
                  <TableHead className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
                    Movement Type
                  </TableHead>
                  <TableHead className="py-3 px-4 text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
                    Change
                  </TableHead>
                  <TableHead className="py-3 px-4 text-center whitespace-nowrap text-xs font-semibold text-muted-foreground uppercase">
                    Ending Stock
                  </TableHead>
                  <TableHead className="py-3 px-4 min-w-[200px] text-xs font-semibold text-muted-foreground uppercase">
                    Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedMovements.map((m, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const prod = products.find((p) => p.id === m.productId);

                  return (
                    <TableRow key={`${m.id}-${idx}`} className="text-xs hover:bg-muted/20 transition-colors">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-3">
                        {rowNumber}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                        {m.createdAt.slice(0, 16)}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-medium text-foreground min-w-[180px]">
                        {prod?.name || m.productId}
                      </TableCell>
                      <TableCell className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold h-5 px-1.5 py-0 bg-muted/60">
                          {m.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`py-3 px-4 text-center font-semibold tabular-nums whitespace-nowrap ${
                          m.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center font-semibold tabular-nums whitespace-nowrap">
                        {m.newStock}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-muted-foreground min-w-[200px]">
                        {m.notes || '-'}
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
            totalItems={filteredMovements.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50]}
          />
        </>
      )}
    </div>
  );
}
