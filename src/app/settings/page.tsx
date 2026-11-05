'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/context/store-context';
import { useTheme } from '@/components/theme-provider';
import { usePwa } from '@/components/pwa/pwa-provider';
import { RefreshCw, Download, Upload, CheckCircle, AlertCircle, Smartphone, Wifi, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

export default function SettingsPage() {
  const store = useStore();
  const { resetToDemoData, deleteAllData, restoreFullBackup } = store;
  const { theme, setTheme } = useTheme();
  const { isInstallable, isInstalled, isOffline, installApp } = usePwa();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resetSuccess, setResetSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importErrorMessage, setImportErrorMessage] = useState('');

  const handleConfirmReset = () => {
    resetToDemoData();
    setShowResetConfirm(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  const handleConfirmDelete = () => {
    deleteAllData();
    setShowDeleteConfirm(false);
    setDeleteSuccess(true);
    setTimeout(() => setDeleteSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    const snapshot = {
      accounts: store.accounts,
      categories: store.categories,
      suppliers: store.suppliers,
      products: store.products,
      inventoryMovements: store.inventoryMovements,
      sales: store.sales,
      transactions: store.transactions,
      budgets: store.budgets,
      savingsGoals: store.savingsGoals,
      wishlist: store.wishlist,
      assets: store.assets,
      subscriptions: store.subscriptions,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mngmt_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 2500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const success = restoreFullBackup(parsed);
        if (success) {
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
        } else {
          setImportStatus('error');
          setImportErrorMessage('Invalid backup format. Required entity arrays not found.');
          setTimeout(() => setImportStatus('idle'), 4000);
        }
      } catch {
        setImportStatus('error');
        setImportErrorMessage('Failed to parse JSON file.');
        setTimeout(() => setImportStatus('idle'), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage application preferences, system appearance, and local data backups."
      />

      <div className="space-y-4">
        {/* 1. Data Backup */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="py-4 px-5 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-foreground">Data Storage & 1-Click Backup (IndexedDB)</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              All data and photos are stored locally in your browser using high-capacity IndexedDB storage. You can create a complete system snapshot JSON backup and restore it anytime without losing images or records.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleExportBackup} size="sm" variant="outline" className="text-xs h-8">
                <Download className="size-3.5 mr-1" />
                <span>Export Full JSON Backup</span>
              </Button>
              <label className="inline-flex items-center justify-center rounded-md border border-border bg-card hover:bg-muted text-xs font-medium h-8 px-3 cursor-pointer transition-colors">
                <Upload className="size-3.5 mr-1" />
                <span>Restore from JSON Backup</span>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
            {backupSuccess && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle className="size-3.5" />
                <span>Full backup snapshot downloaded successfully.</span>
              </div>
            )}
            {importStatus === 'success' && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle className="size-3.5" />
                <span>System data restored and synchronized successfully!</span>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pt-1">
                <AlertCircle className="size-3.5" />
                <span>{importErrorMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Progressive Web App (PWA) */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="py-4 px-5 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary" />
                <span>Progressive Web App (PWA) & Offline Mode</span>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                isInstalled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-primary/10 text-primary'
              }`}>
                {isInstalled ? 'Installed as App' : 'PWA Ready'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              mngmt is a fully offline-first Progressive Web Application. With its native service worker and client-side IndexedDB storage, you can run all finance tracking, inventory records, and sales management completely without an active internet connection.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="size-8 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wifi className="size-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-foreground">Network Status</p>
                  <p className="text-muted-foreground text-[11px]">{isOffline ? 'Offline (Local IDB Mode)' : 'Online (Connected)'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Smartphone className="size-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-foreground">App Installation</p>
                  <p className="text-muted-foreground text-[11px]">{isInstalled ? 'Running in Standalone Window' : 'Browser / Desktop Web'}</p>
                </div>
              </div>
            </div>

            {isInstallable && !isInstalled && (
              <div className="pt-2">
                <Button onClick={installApp} size="sm" className="text-xs h-8 bg-primary text-primary-foreground font-medium gap-1.5">
                  <Download className="size-3.5" />
                  <span>Install mngmt to Home Screen / Desktop</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Database Maintenance & Reset */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="py-4 px-5 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-foreground">Database Maintenance & Reset</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Reset to Sample Demo Data</p>
                <p className="text-[11px] text-muted-foreground">
                  Populate the application with sample products, transactions, bank accounts, and budgets.
                </p>
              </div>
              <Button onClick={() => setShowResetConfirm(true)} variant="outline" size="sm" className="text-xs h-8 shrink-0">
                <RefreshCw className="size-3.5 mr-1" />
                <span>Reset Demo Data</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Delete All Application Data</p>
                <p className="text-[11px] text-muted-foreground">
                  Permanently wipe all accounts, transactions, products, sales, and records to start from a completely clean slate.
                </p>
              </div>
              <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" size="sm" className="text-xs h-8 shrink-0">
                <Trash2 className="size-3.5 mr-1" />
                <span>Delete All Data</span>
              </Button>
            </div>

            {resetSuccess && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle className="size-3.5" />
                <span>Demo data restored successfully.</span>
              </div>
            )}
            {deleteSuccess && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle className="size-3.5" />
                <span>All application data deleted successfully. Starting with a clean slate.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Appearance & Locale */}
        <Card className="border-border/60 bg-card">
          <CardHeader className="py-4 px-5 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-foreground">Appearance & Locale</CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-muted-foreground font-medium block mb-1">Currency Standard</label>
              <Input value="IDR (Indonesian Rupiah - Rp)" disabled className="bg-muted text-xs h-8.5" />
            </div>
            <div>
              <label className="text-muted-foreground font-medium block mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Demo Data?"
        description="All existing transactions, product inventories, and customized accounts will be reset to default demo values. Are you sure you want to proceed?"
        confirmText="Reset to Demo"
        cancelText="Cancel"
        variant="destructive"
        icon="warning"
        onConfirm={handleConfirmReset}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete All Data Permanently?"
        description="This will permanently delete all your accounts, products, sales, transactions, budgets, wishlist, and subscriptions. The application will be reset to a clean blank slate. This action cannot be undone."
        confirmText="Delete Everything"
        cancelText="Cancel"
        variant="destructive"
        icon="warning"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
