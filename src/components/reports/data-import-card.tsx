'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/context/store-context';
import { TransactionScope, TransactionType } from '@/types';
import { getLocalDateString } from '@/lib/date';
import { Upload, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { parseCSV, generateCSV, downloadBlob, findColumnIndex } from '@/lib/data-exchange';

interface ColumnMapping {
  date: number;
  description: number;
  amount: number;
  type: number;
  scope: number;
  category: number;
  subCategory: number;
  account: number;
}

interface ProductColumnMapping {
  sku: number;
  name: number;
  brand: number;
  category: number;
  subCategory: number;
  cost: number;
  price: number;
  stock: number;
}

export function DataImportCard() {
  const { addTransactionsBatch, addProductsBatch, accounts, categories } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importType, setImportType] = useState<'transactions' | 'products'>('transactions');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const [trxMap, setTrxMap] = useState<ColumnMapping>({
    date: 1,
    description: 7,
    amount: 8,
    type: 3,
    scope: 2,
    category: 4,
    subCategory: 5,
    account: 6,
  });

  const [prodMap, setProdMap] = useState<ProductColumnMapping>({
    sku: 0,
    name: 1,
    brand: 2,
    category: 3,
    subCategory: 4,
    cost: 6,
    price: 7,
    stock: 8,
  });

  const handleDownloadTemplate = () => {
    if (importType === 'transactions') {
      const csv = generateCSV(
        ['Date', 'Scope', 'Type', 'Category', 'Sub Category', 'Account', 'Description', 'Amount'],
        [
          [getLocalDateString(), 'personal', 'expense', 'Food & Dining', 'Coffee & Snacks', accounts[0]?.name || 'Cash', 'Morning Coffee', 35000],
          [getLocalDateString(), 'personal', 'income', 'Income', 'Freelance Projects', accounts[0]?.name || 'Bank', 'Client Payment', 1500000],
        ]
      );
      downloadBlob(csv, 'mngmt_transactions_template.csv', 'text/csv;charset=utf-8;');
    } else {
      const csv = generateCSV(
        ['SKU', 'Name', 'Brand', 'Category', 'Sub Category', 'Purchase Cost', 'Selling Price', 'Stock On Hand'],
        [['SKU-DEMO-01', 'Sample Action Figure', 'Bandai', 'Toys & Figures', 'Action Figures', 250000, 395000, 5]]
      );
      downloadBlob(csv, 'mngmt_products_template.csv', 'text/csv;charset=utf-8;');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const { headers: hdrs, rows } = parseCSV(content);
      setHeaders(hdrs);
      setParsedRows(rows);

      if (importType === 'transactions') {
        setTrxMap({
          date: Math.max(0, findColumnIndex(hdrs, ['date', 'tanggal'])),
          description: Math.max(0, findColumnIndex(hdrs, ['description', 'desc', 'keterangan', 'note', 'memo'])),
          amount: Math.max(0, findColumnIndex(hdrs, ['amount', 'nominal', 'total', 'nilai'])),
          type: findColumnIndex(hdrs, ['type', 'jenis']),
          scope: findColumnIndex(hdrs, ['scope']),
          category: findColumnIndex(hdrs, ['category', 'kategori']),
          subCategory: findColumnIndex(hdrs, ['sub category', 'subcategory', 'subkategori']),
          account: findColumnIndex(hdrs, ['account', 'pocket', 'rekening', 'dompet']),
        });
      } else {
        setProdMap({
          sku: Math.max(0, findColumnIndex(hdrs, ['sku', 'kode'])),
          name: Math.max(0, findColumnIndex(hdrs, ['name', 'nama', 'product'])),
          brand: findColumnIndex(hdrs, ['brand', 'merk']),
          category: findColumnIndex(hdrs, ['category', 'kategori']),
          subCategory: findColumnIndex(hdrs, ['sub category', 'subcategory', 'subkategori']),
          cost: Math.max(0, findColumnIndex(hdrs, ['purchase cost', 'cost', 'hpp', 'modal'])),
          price: Math.max(0, findColumnIndex(hdrs, ['selling price', 'price', 'harga'])),
          stock: Math.max(0, findColumnIndex(hdrs, ['stock', 'stok', 'qty'])),
        });
      }
    };
    reader.readAsText(file);
  };

  const resolveIdsByNames = (mainName?: string, subName?: string) => {
    const mainClean = mainName?.trim().toLowerCase();
    const subClean = subName?.trim().toLowerCase();
    const mainMatch = mainClean
      ? categories.find((c) => !c.parentId && c.name.toLowerCase() === mainClean)
      : undefined;
    const subMatch = subClean
      ? categories.find(
          (c) =>
            Boolean(c.parentId) &&
            c.name.toLowerCase() === subClean &&
            (!mainMatch || c.parentId === mainMatch.id)
        )
      : undefined;
    return {
      categoryId: mainMatch?.id || subMatch?.parentId,
      subCategoryId: subMatch?.id,
    };
  };

  const handleImport = () => {
    if (parsedRows.length === 0) {
      setStatusMessage({ text: 'No valid rows found in selected CSV file.', isError: true });
      return;
    }

    const defaultAccountId = accounts[0]?.id || 'acc-1';
    const today = getLocalDateString();

    if (importType === 'transactions') {
      const toImport: Parameters<typeof addTransactionsBatch>[0] = [];
      parsedRows.forEach((row) => {
        const rawDate = row[trxMap.date] || today;
        const date = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : today;
        const scopeRaw = trxMap.scope >= 0 ? row[trxMap.scope]?.toLowerCase() : '';
        const scope: TransactionScope = scopeRaw === 'business' ? 'business' : 'personal';
        const typeRaw = trxMap.type >= 0 ? row[trxMap.type]?.toLowerCase() : '';
        const type: TransactionType = typeRaw === 'income' || typeRaw === 'transfer' ? typeRaw : 'expense';
        const desc = row[trxMap.description] || 'Imported Transaction';
        const rawAmt = String(row[trxMap.amount] || '0').replace(/[^0-9.-]+/g, '');
        const amount = Math.abs(Number(rawAmt) || 0);

        const accCell = trxMap.account >= 0 ? row[trxMap.account]?.trim().toLowerCase() : '';
        const matchedAcc = accCell
          ? accounts.find((a) => a.name.toLowerCase() === accCell || a.id.toLowerCase() === accCell)
          : undefined;

        const { categoryId, subCategoryId } = resolveIdsByNames(
          trxMap.category >= 0 ? row[trxMap.category] : undefined,
          trxMap.subCategory >= 0 ? row[trxMap.subCategory] : undefined
        );

        if (amount > 0) {
          toImport.push({
            date,
            scope,
            type,
            amount,
            accountId: matchedAcc?.id || defaultAccountId,
            categoryId,
            subCategoryId,
            sourceModule: scope === 'business' ? 'business_expense' : type === 'income' ? 'personal_income' : 'personal_expense',
            description: desc,
          });
        }
      });

      if (toImport.length > 0) {
        addTransactionsBatch(toImport);
      }
      setStatusMessage({ text: `Successfully imported ${toImport.length} transactions!` });
    } else {
      const toImport: Parameters<typeof addProductsBatch>[0] = [];
      parsedRows.forEach((row, idx) => {
        const name = row[prodMap.name] || row[prodMap.sku] || 'Imported Product';
        const cost = Number(String(row[prodMap.cost] || 0).replace(/[^0-9.-]+/g, '')) || 0;
        const price = Number(String(row[prodMap.price] || cost * 1.3).replace(/[^0-9.-]+/g, '')) || cost;
        const stock = Math.max(0, Number(String(row[prodMap.stock] || 0).replace(/[^0-9.-]+/g, '')) || 0);

        const { categoryId, subCategoryId } = resolveIdsByNames(
          prodMap.category >= 0 ? row[prodMap.category] : undefined,
          prodMap.subCategory >= 0 ? row[prodMap.subCategory] : undefined
        );

        toImport.push({
          name,
          sku: row[prodMap.sku] || `SKU-${Date.now().toString().slice(-4)}-${idx + 1}`,
          brand: prodMap.brand >= 0 ? row[prodMap.brand] || 'Generic' : 'Generic',
          categoryId,
          subCategoryId,
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
      setStatusMessage({ text: `Successfully imported ${toImport.length} products!` });
    }

    setParsedRows([]);
    setHeaders([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="rounded-2xl border-border/50 bg-card/60 backdrop-blur-xs p-5 space-y-3.5">
      <CardHeader className="p-0 flex flex-row items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Upload className="size-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-sm font-semibold text-foreground">Data Import Center</CardTitle>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Import transactions or product inventory from CSV with automatic column mapping.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDownloadTemplate}
          className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground shrink-0"
          title="Download sample CSV template"
        >
          <Download className="size-3" />
          <span>Template</span>
        </Button>
      </CardHeader>

      <CardContent className="p-0 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Target Entity</label>
            <select
              value={importType}
              onChange={(e) => {
                setImportType(e.target.value as 'transactions' | 'products');
                setParsedRows([]);
                setHeaders([]);
                setFileName('');
              }}
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

        {fileName && headers.length > 0 && (
          <div className="p-2.5 rounded-lg bg-muted/30 text-xs border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <FileText className="size-3.5 text-primary shrink-0" />
                <b className="truncate">{fileName}</b>
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                {parsedRows.length} rows detected
              </span>
            </div>

            {importType === 'transactions' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {(['date', 'description', 'amount', 'type'] as const).map((field) => (
                  <div key={field}>
                    <label className="text-[10px] uppercase text-muted-foreground block mb-0.5">{field}</label>
                    <select
                      value={trxMap[field]}
                      onChange={(e) => setTrxMap((prev) => ({ ...prev, [field]: Number(e.target.value) }))}
                      className="w-full h-7 rounded border border-input bg-card px-1.5 text-[11px]"
                    >
                      {headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h || `Col ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {(['sku', 'name', 'cost', 'price'] as const).map((field) => (
                  <div key={field}>
                    <label className="text-[10px] uppercase text-muted-foreground block mb-0.5">{field}</label>
                    <select
                      value={prodMap[field]}
                      onChange={(e) => setProdMap((prev) => ({ ...prev, [field]: Number(e.target.value) }))}
                      className="w-full h-7 rounded border border-input bg-card px-1.5 text-[11px]"
                    >
                      {headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h || `Col ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
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
