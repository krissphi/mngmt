'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { SummaryBanner } from '@/components/shared/summary-banner';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isFiltered = searchQuery !== '' || typeFilter !== 'all';

  const filteredMovements = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return inventoryMovements.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (!q) return true;
      const prod = products.find((p) => p.id === m.productId);
      const prodName = prod?.name.toLowerCase() || '';
      const notes = (m.notes || '').toLowerCase();
      const type = m.type.toLowerCase();
      return prodName.includes(q) || notes.includes(q) || type.includes(q);
    });
  }, [inventoryMovements, products, searchQuery, typeFilter]);

  const { restockCount, saleOutCount, adjustCount } = useMemo(() => {
    let restocks = 0;
    let salesOut = 0;
    let adj = 0;
    for (const m of filteredMovements) {
      if (m.type === 'purchase_in') restocks++;
      else if (m.type === 'sale_out' || m.type === 'reserved') salesOut++;
      else adj++;
    }
    return { restockCount: restocks, saleOutCount: salesOut, adjustCount: adj };
  }, [filteredMovements]);

  const totalPages = Math.ceil(filteredMovements.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMovements = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-5">
      <SummaryBanner
        label="Stock Movement Audit"
        value={`${filteredMovements.length} ${filteredMovements.length === 1 ? 'Log' : 'Logs'}`}
        meta={[
          `${restockCount} Restocks`,
          `${saleOutCount} Fulfillments`,
          `${adjustCount} Adjustments & Returns`,
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search audit trail or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8.5 h-8.5 text-xs bg-card/50 border-border/60 rounded-xl"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-8.5 rounded-xl border border-border/60 bg-card/50 px-2.5 text-xs text-foreground focus-visible:outline-none"
          aria-label="Filter by movement type"
        >
          <option value="all">All Movement Types</option>
          <option value="purchase_in">Purchase In (Restock)</option>
          <option value="sale_out">Sale Out</option>
          <option value="reserved">Reserved</option>
          <option value="unreserved">Unreserved</option>
          <option value="return_in">Return In</option>
          <option value="adjustment_in">Adjustment In</option>
          <option value="adjustment_out">Adjustment Out</option>
          <option value="damaged">Damaged</option>
        </select>

        {isFiltered && (
          <Button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setCurrentPage(1);
            }}
            variant="ghost"
            size="sm"
            className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-xl"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {filteredMovements.length === 0 ? (
        isFiltered ? (
          <NoSearchResultState
            query={searchQuery || typeFilter}
            onReset={() => {
              setSearchQuery('');
              setTypeFilter('all');
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
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
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
                  const rowNumber = (safeCurrentPage - 1) * pageSize + idx + 1;
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
