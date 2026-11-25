'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { resolveCategoryPair } from '@/lib/categories';
import { getLocalDateString } from '@/lib/date';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { generateCSV, generateExcelXML, downloadBlob } from '@/lib/data-exchange';

export function DataExportCard() {
  const { transactions, products, sales, categories, accounts } = useStore();
  const [dataset, setDataset] = useState<'transactions' | 'products' | 'sales'>('transactions');
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

  const handleExport = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const baseFilename = `mngmt_${dataset}_${getLocalDateString()}`;
    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

    if (dataset === 'transactions') {
      headers = ['ID', 'Date', 'Scope', 'Type', 'Category', 'Sub Category', 'Account', 'Description', 'Amount'];
      rows = transactions.map((t) => {
        const resolved = resolveCategoryPair(categories, t.categoryId, t.subCategoryId, '');
        return [
          t.id,
          t.date,
          t.scope,
          t.type,
          resolved.main ? resolved.mainName : t.sourceModule,
          resolved.subName || '',
          accountMap.get(t.accountId) || t.accountId,
          t.description,
          t.amount,
        ];
      });
    } else if (dataset === 'products') {
      headers = ['SKU', 'Name', 'Brand', 'Category', 'Sub Category', 'Type', 'Purchase Cost', 'Selling Price', 'Stock On Hand', 'Stock Sold'];
      rows = products.map((p) => {
        const resolved = resolveCategoryPair(categories, p.categoryId, p.subCategoryId, p.category || '');
        return [
          p.sku,
          p.name,
          p.brand || '',
          resolved.mainName,
          resolved.subName || '',
          p.productType,
          p.purchaseCost,
          p.sellingPrice,
          p.stockOnHand,
          p.stockSold,
        ];
      });
    } else if (dataset === 'sales') {
      headers = ['Order #', 'Date', 'Channel', 'Customer', 'Gross Sales', 'COGS', 'Fee', 'Net Profit', 'Payment Status', 'Order Status'];
      rows = sales.map((s) => [
        s.orderNumber,
        s.saleDate,
        s.channel,
        s.customerName || '',
        s.grossSales,
        s.cogsTotal,
        s.marketplaceFees,
        s.netProfit,
        s.paymentStatus,
        s.orderStatus,
      ]);
    }

    if (format === 'csv') {
      const content = generateCSV(headers, rows);
      downloadBlob(content, `${baseFilename}.csv`, 'text/csv;charset=utf-8;');
    } else {
      const content = generateExcelXML(dataset.toUpperCase(), headers, rows);
      downloadBlob(content, `${baseFilename}.xls`, 'application/vnd.ms-excel');
    }
  };

  return (
    <Card className="rounded-2xl border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-3.5">
      <CardHeader className="p-0">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-foreground">Data Export Center</CardTitle>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Export your financial ledger, inventory, or sales to CSV or Excel-compatible spreadsheet.
        </p>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Select Dataset</label>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as 'transactions' | 'products' | 'sales')}
              className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none"
            >
              <option value="transactions">Transactions Ledger ({transactions.length} rows)</option>
              <option value="products">Inventory Products ({products.length} items)</option>
              <option value="sales">Sales Orders ({sales.length} orders)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'csv' | 'xlsx')}
              className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none"
            >
              <option value="csv">Standard CSV (.csv UTF-8)</option>
              <option value="xlsx">Excel Spreadsheet (.xls / XML)</option>
            </select>
          </div>
        </div>

        <Button onClick={handleExport} size="sm" className="w-full h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-medium">
          <Download className="size-3.5" />
          <span>Export {dataset.charAt(0).toUpperCase() + dataset.slice(1)} ({format.toUpperCase()})</span>
        </Button>
      </CardContent>
    </Card>
  );
}
