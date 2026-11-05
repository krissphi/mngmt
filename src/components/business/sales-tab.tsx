'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Plus, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/shared/table-pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Sale } from '@/types';
import { SalesTable } from './sales-table';

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
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'revenue_desc' | 'profit_desc'>('date_desc');

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
    selectedMonth !== 'all' ||
    sortBy !== 'date_desc';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedChannel('all');
    setSelectedStatus('all');
    setSelectedMonth('all');
    setSortBy('date_desc');
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
        if (sortBy === 'date_desc') return b.saleDate.localeCompare(a.saleDate);
        if (sortBy === 'date_asc') return a.saleDate.localeCompare(b.saleDate);
        if (sortBy === 'revenue_desc') return b.grossSales - a.grossSales;
        if (sortBy === 'profit_desc') return b.netProfit - a.netProfit;
        return 0;
      });
  }, [sales, searchQuery, selectedChannel, selectedStatus, selectedMonth, sortBy]);

  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedSales = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, safeCurrentPage, pageSize]);

  return (
    <div className="space-y-4">
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

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as 'date_desc' | 'date_asc' | 'revenue_desc' | 'profit_desc');
              setCurrentPage(1);
            }}
            className="h-8 text-xs bg-card border border-border rounded-md px-2.5 font-medium text-foreground focus-visible:outline-none"
          >
            <option value="date_desc">Newest Order</option>
            <option value="date_asc">Oldest Order</option>
            <option value="revenue_desc">Highest Revenue</option>
            <option value="profit_desc">Highest Profit</option>
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

        <div className="flex items-center gap-3 self-end md:self-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Found <b className="text-foreground">{filteredSales.length}</b> orders
          </span>
          <Button
            onClick={onOpenAddSale}
            size="sm"
            className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Record Sale</span>
          </Button>
        </div>
      </div>

      <SalesTable
        sales={paginatedSales}
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        isFiltered={isFiltered}
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
