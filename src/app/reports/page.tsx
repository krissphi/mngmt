'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { formatIDR } from '@/lib/currency';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { DataExportCard } from '@/components/reports/data-export-card';
import { DataImportCard } from '@/components/reports/data-import-card';

export default function ReportsPage() {
  const { sales } = useStore();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => s.saleDate && set.add(s.saleDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (selectedMonth === 'all') return sales;
    return sales.filter((s) => s.saleDate.startsWith(selectedMonth));
  }, [sales, selectedMonth]);

  const channels = ['shopee', 'tiktok', 'tokopedia', 'direct', 'other'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Data Management"
        description="Export/Import financial data (CSV or Excel) and analyze multichannel sales."
        action={
          <Button onClick={() => window.print()} variant="outline" size="sm" className="text-xs h-8">
            <Printer className="size-3.5 mr-1" />
            <span>Print Report</span>
          </Button>
        }
      />

      {/* Unified Data Management: Export & Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataExportCard />
        <DataImportCard />
      </div>

      {/* Multichannel Performance Overview */}
      <Card className="border-border/60 bg-card overflow-hidden">
        <CardHeader className="py-3 px-5 border-b border-border/60 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            Multichannel Sales Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-7 rounded border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none"
            >
              <option value="all">All Time</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b border-border/60">
                <TableHead className="w-12 text-center text-xs font-semibold text-muted-foreground uppercase py-3 px-3">
                  #
                </TableHead>
                <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground uppercase">
                  Channel
                </TableHead>
                <TableHead className="py-3 px-5 text-center text-xs font-semibold text-muted-foreground uppercase">
                  Orders
                </TableHead>
                <TableHead className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Gross Sales
                </TableHead>
                <TableHead className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Marketplace Fees
                </TableHead>
                <TableHead className="py-3 px-5 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Net Profit
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {channels.map((ch, idx) => {
                const chSales = filteredSales.filter((s) => s.channel === ch);
                const orders = chSales.length;
                const omzet = chSales.reduce((sum, s) => sum + s.grossSales, 0);
                const fees = chSales.reduce((sum, s) => sum + s.marketplaceFees, 0);
                const profit = chSales.reduce((sum, s) => sum + s.netProfit, 0);

                return (
                  <TableRow key={ch} className="text-xs hover:bg-muted/20 transition-colors">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground py-3 px-3">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-5 py-3 font-semibold uppercase text-primary">
                      {ch === 'direct' ? 'Direct / Offline' : ch}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-center tabular-nums">
                      {orders}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right font-medium text-foreground tabular-nums">
                      {formatIDR(omzet)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right text-rose-600 font-medium tabular-nums">
                      -{formatIDR(fees)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatIDR(profit)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
