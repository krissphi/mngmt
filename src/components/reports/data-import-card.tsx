'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/context/store-context';
import { TransactionScope, TransactionType } from '@/types';
import { Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { parseCSV } from '@/lib/data-exchange';

export function DataImportCard() {
  const { addTransactionsBatch, addProductsBatch, accounts } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importType, setImportType] = useState<'transactions' | 'products'>('transactions');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const { rows } = parseCSV(content);
      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (parsedRows.length === 0) {
      setStatusMessage({ text: 'No valid rows found in selected CSV file.', isError: true });
      return;
    }

    const defaultAccountId = accounts[0]?.id || 'acc-1';

    if (importType === 'transactions') {
      const toImport: Parameters<typeof addTransactionsBatch>[0] = [];
      parsedRows.forEach((row) => {
        // Expected or fallback order: Date, Scope, Type, Category, Account, Description, Amount
        const date = row[1] || row[0] || new Date().toISOString().split('T')[0];
        const scope: TransactionScope = row[2]?.toLowerCase() === 'business' ? 'business' : 'personal';
        const typeRaw = row[3]?.toLowerCase();
        const type: TransactionType = typeRaw === 'income' || typeRaw === 'transfer' ? typeRaw : 'expense';
        const desc = row[6] || row[5] || row[1] || 'Imported Transaction';
        const amount = Math.abs(Number(String(row[7] || row[row.length - 1]).replace(/[^0-9.-]+/g, '')) || 0);

        if (amount > 0) {
          toImport.push({
            date,
            scope,
            type,
            amount,
            accountId: defaultAccountId,
            sourceModule: scope === 'business' ? 'business_expense' : 'personal_expense',
            description: desc,
          });
        }
      });

      if (toImport.length > 0) {
        addTransactionsBatch(toImport);
      }
      setStatusMessage({ text: `Successfully imported ${toImport.length} transactions in one batch!` });
    } else if (importType === 'products') {
      const toImport: Parameters<typeof addProductsBatch>[0] = [];
      parsedRows.forEach((row, idx) => {
        // Expected: SKU, Name, Brand, Category, Purchase Cost, Selling Price, Stock
        const name = row[1] || row[0] || 'Imported Product';
        const cost = Number(String(row[4] || 0).replace(/[^0-9.-]+/g, '')) || 0;
        const price = Number(String(row[5] || cost * 1.3).replace(/[^0-9.-]+/g, '')) || cost;
        const stock = Number(String(row[6] || 10).replace(/[^0-9.-]+/g, '')) || 0;

        toImport.push({
          name,
          sku: row[0] || `SKU-${Date.now().toString().slice(-4)}-${idx + 1}`,
          brand: row[2] || 'Generic',
          productType: 'regular_inventory',
          purchaseCost: cost,
          sellingPrice: price,
          stockOnHand: stock,
          minStockAlert: 2,
          status: 'active',
        });
      });

      if (toImport.length > 0) {
        addProductsBatch(toImport);
      }
      setStatusMessage({ text: `Successfully imported ${toImport.length} products in one batch!` });
    }
    setParsedRows([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="border-border/60 bg-card p-4 space-y-3.5">
      <CardHeader className="p-0">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-sm font-semibold text-foreground">Data Import Center</CardTitle>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Import transactions or product inventory directly from your local CSV files.
        </p>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Target Entity</label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as 'transactions' | 'products')}
              className="w-full h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none"
            >
              <option value="transactions">Transactions (Ledger)</option>
              <option value="products">Inventory (Products)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full h-8 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-muted file:text-foreground cursor-pointer text-muted-foreground"
            />
          </div>
        </div>

        {fileName && (
          <div className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs border border-border/50">
            <span className="flex items-center gap-1.5 truncate">
              <FileText className="size-3.5 text-primary shrink-0" />
              <b className="truncate">{fileName}</b>
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
              {parsedRows.length} rows ready
            </span>
          </div>
        )}

        {statusMessage && (
          <div className={`p-2 rounded text-xs flex items-center gap-1.5 ${
            statusMessage.isError ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {statusMessage.isError ? <AlertCircle className="size-3.5 shrink-0" /> : <CheckCircle2 className="size-3.5 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={parsedRows.length === 0}
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs gap-1.5 font-medium"
        >
          <Upload className="size-3.5" />
          <span>Import Data ({parsedRows.length} rows)</span>
        </Button>
      </CardContent>
    </Card>
  );
}
