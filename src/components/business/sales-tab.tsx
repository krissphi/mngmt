'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { Plus, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/shared/table-pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Sale } from '@/types';
import { SalesTable, SaleSortField, SaleSortState } from './sales-table';

interface SalesTabProps {
  onOpenAddSale: () => void;
}

export function SalesTab({ onOpenAddSale }: SalesTabProps) {
  const { sales, updateSaleStatus, deleteSale } = useStore();
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortState, setSortState] = useState<SaleSortState>({ field: 'date', direction: 'desc' });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => s.saleDate && set.add(s.saleDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [sales]);

  const isFiltered =
    searchQuery !== '' ||
    selectedChannel !== 'all' ||
    selectedStatus !== 'all' ||
    selectedMonth !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedChannel('all');
    setSelectedStatus('all');
    setSelectedMonth('all');
    setSortState({ field: 'date', direction: 'desc' });
    setCurrentPage(1);
  };

  const handleSort = (field: SaleSortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          !searchQuery ||
          s.orderNumber.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          s.items.some((i) => i.productName.toLowerCase().includes(q));

        const matchesChannel = selectedChannel === 'all' || s.channel === selectedChannel;
        const matchesStatus = selectedStatus === 'all' || s.orderStatus === selectedStatus;
        const matchesMonth = selectedMonth === 'all' || (s.saleDate && s.saleDate.startsWith(selectedMonth));

        return matchesQuery && matchesChannel && matchesStatus && matchesMonth;
      })
      .sort((a, b) => {
        const { field, direction } = sortState;
        const dir = direction === 'asc' ? 1 : -1;
        if (field === 'date') return dir * a.saleDate.localeCompare(b.saleDate);
        if (field === 'orderNumber') return dir * a.orderNumber.localeCompare(b.orderNumber);
        if (field === 'channel') return dir * a.channel.localeCompare(b.channel);
        if (field === 'revenue') return dir * (a.grossSales - b.grossSales);
        if (field === 'profit') return dir * (a.netProfit - b.netProfit);
        if (field === 'status') return dir * a.orderStatus.localeCompare(b.orderStatus);
        return 0;
      });
  }, [sales, searchQuery, selectedChannel, selectedStatus, selectedMonth, sortState]);

  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedSales = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, safeCurrentPage, pageSize]);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const activeMonth = selectedMonth !== 'all' ? selectedMonth : currentMonthKey;

  const { monthTotal, monthCount, monthProfit } = useMemo(() => {
    let total = 0;
    let profit = 0;
    let count = 0;

    for (const s of sales) {
      if (s.orderStatus === 'cancelled' || s.orderStatus === 'returned') continue;
      if (s.saleDate && s.saleDate.startsWith(activeMonth)) {
        total += s.grossSales || 0;
        profit += s.netProfit || 0;
        count++;
      }
    }

    return {
      monthTotal: total,
      monthCount: count,
      monthProfit: profit,
    };
  }, [sales, activeMonth]);

  return (
    <div className="space-y-4">
      {/* Clean Tab Header with Text Summary & Record Sale Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-medium">
          {selectedMonth === 'all' ? 'Total Sales This Month' : `Total Sales (${selectedMonth})`}: <b className="text-foreground">{formatIDR(monthTotal)}</b> ({monthCount} {monthCount === 1 ? 'order' : 'orders'}{monthProfit > 0 ? `, Profit: +${formatIDR(monthProfit)}` : ''})
        </div>

        <Button
          onClick={onOpenAddSale}
          size="sm"
          className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Record Sale</span>
        </Button>
      </div>

      {/* Comprehensive Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-lg border border-border/50">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search order #, customer, item..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 h-8 text-xs bg-card"
            />
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 text-xs bg-card border border-border rounded-md px-2.5 font-medium text-foreground focus-visible:outline-none"
          >
            <option value="all">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={selectedChannel}
            onChange={(e) => {
              setSelectedChannel(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 text-xs bg-card border border-border rounded-md px-2.5 font-medium text-foreground focus-visible:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="shopee">Shopee</option>
            <option value="tiktok">TikTok Shop</option>
            <option value="tokopedia">Tokopedia</option>
            <option value="direct">Direct / Offline</option>
            <option value="other">Other</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 text-xs bg-card border border-border rounded-md px-2.5 font-medium text-foreground focus-visible:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>

          {isFiltered && (
            <Button
              onClick={resetFilters}
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      <SalesTable
        sales={paginatedSales}
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        isFiltered={isFiltered}
        sortState={sortState}
        onSort={handleSort}
        onStatusChange={updateSaleStatus}
        onDeleteSale={setDeletingSale}
      />

      <TablePagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredSales.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50]}
      />

      <ConfirmDialog
        open={!!deletingSale}
        onOpenChange={(open) => !open && setDeletingSale(null)}
        title="Delete Sales Order?"
        description={`Are you sure you want to delete order #${deletingSale?.orderNumber}? If this order was active, item stock will be restored to your inventory and any recorded payment transaction will be removed.`}
        confirmText="Delete Order"
        cancelText="Cancel"
        onConfirm={() => {
          if (deletingSale) {
            deleteSale(deletingSale.id);
            setDeletingSale(null);
          }
        }}
      />
    </div>
  );
}
