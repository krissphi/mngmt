'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { getAvailableStock } from '@/lib/calculations';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShoppingBag, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickActionModal } from '@/components/shared/quick-action-modal';

export function BusinessSummaryTab() {
  const { sales, products, assets } = useStore();
  const [currentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [quickModalOpen, setQuickModalOpen] = useState(false);

  const { revenue, netProfit } = useMemo(() => {
    const monthSales = sales.filter((s) => s.saleDate.startsWith(currentMonth));
    const targetSales = monthSales.length > 0 ? monthSales : sales;
    const rev = targetSales.reduce((sum, s) => sum + s.grossSales, 0);
    const profit = targetSales.reduce((sum, s) => sum + s.netProfit, 0);
    return { revenue: rev, netProfit: profit };
  }, [sales, currentMonth]);

  const availableStockCount = useMemo(() => {
    return products.reduce((sum, p) => sum + getAvailableStock(p), 0);
  }, [products]);

  const collectionValuation = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.currentEstimatedValue, 0);
  }, [assets]);

  const channelBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => {
      map.set(s.channel, (map.get(s.channel) || 0) + s.grossSales);
    });
    return Array.from(map.entries()).map(([channel, total]) => ({ channel, total }));
  }, [sales]);

  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.stockOnHand <= p.minStockAlert);
  }, [products]);

  return (
    <div className="space-y-4">
      {/* Standard Tab Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground font-medium">
          Sales Performance, Inventory Health & Asset Valuations
        </div>

        <Button
          onClick={() => setQuickModalOpen(true)}
          size="sm"
          className="text-xs h-8 gap-1.5 self-start sm:self-auto bg-primary text-primary-foreground font-medium"
        >
          <Plus className="size-3.5" />
          <span>Record Sale</span>
        </Button>
      </div>

      {/* 4 Business & Assets KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Gross Sales Revenue" value={formatIDR(revenue)} />
        <StatCard title="Estimated Net Profit" value={formatIDR(netProfit)} />
        <StatCard title="Available Stock" value={`${availableStockCount} units`} />
        <StatCard title="Personal Assets Valuation" value={formatIDR(collectionValuation)} />
      </div>

      {/* Channel Breakdown & Low Stock Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/60 bg-card">
          <CardHeader className="py-3.5 px-5 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-foreground">Revenue by Sales Channel</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {channelBreakdown.map((item) => {
              const pct = revenue > 0 ? Math.round((item.total / revenue) * 100) : 0;

              return (
                <div key={item.channel} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="size-3.5 text-muted-foreground" />
                      <span className="font-semibold uppercase text-foreground">{item.channel}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground">{formatIDR(item.total)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card">
          <CardHeader className="py-3.5 px-5 border-b border-border/60 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">Low Stock Warnings</CardTitle>
            <span className="text-xs text-muted-foreground font-normal">
              {lowStockItems.length} items low
            </span>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">All product stocks are at healthy levels.</p>
            ) : (
              lowStockItems.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground line-clamp-1">{p.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{p.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-600 dark:text-amber-400">{p.stockOnHand} pcs remaining</span>
                    <div className="text-[10px] text-muted-foreground">Min Alert: {p.minStockAlert}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <QuickActionModal
        open={quickModalOpen}
        onOpenChange={setQuickModalOpen}
        defaultTab="sale"
      />
    </div>
  );
}
