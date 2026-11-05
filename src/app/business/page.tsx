'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { BusinessSummaryTab } from '@/components/business/business-summary-tab';
import { AssetsTab } from '@/components/business/assets-tab';
import { ProductsTab } from '@/components/business/products-tab';
import { SalesTab } from '@/components/business/sales-tab';
import { AdjustStockDialog } from '@/components/business/adjust-stock-dialog';
import { QuickActionModal } from '@/components/shared/quick-action-modal';

type BusinessTab = 'summary' | 'assets' | 'products' | 'sales';

function BusinessContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as BusinessTab | null;

  const [activeTab, setActiveTab] = useState<BusinessTab>(() => {
    if (tabParam && ['summary', 'assets', 'products', 'sales'].includes(tabParam)) {
      return tabParam;
    }
    return 'summary';
  });

  useEffect(() => {
    if (tabParam && ['summary', 'assets', 'products', 'sales'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalTab, setQuickModalTab] = useState<'sale' | 'product'>('sale');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<string>('');

  const handleOpenAdjust = (prodId: string) => {
    setSelectedProductForAdjust(prodId);
    setAdjustModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business & Assets"
        description="Manage business summary, personal collectibles and assets, product catalog, and sales orders."
      />

      {/* Clean 4-Tab Pill Bar */}
      <div className="flex flex-wrap gap-1 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'summary' ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'assets' ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Personal Assets
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'products' ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'sales' ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sales
        </button>
      </div>

      {activeTab === 'summary' && <BusinessSummaryTab />}
      {activeTab === 'assets' && <AssetsTab />}
      {activeTab === 'products' && (
        <ProductsTab
          onOpenAddProduct={() => {
            setQuickModalTab('product');
            setQuickModalOpen(true);
          }}
          onOpenAdjust={handleOpenAdjust}
        />
      )}
      {activeTab === 'sales' && (
        <SalesTab
          onOpenAddSale={() => {
            setQuickModalTab('sale');
            setQuickModalOpen(true);
          }}
        />
      )}

      <AdjustStockDialog
        open={adjustModalOpen}
        onOpenChange={setAdjustModalOpen}
        productId={selectedProductForAdjust}
      />

      <QuickActionModal
        open={quickModalOpen}
        onOpenChange={setQuickModalOpen}
        defaultTab={quickModalTab}
      />
    </div>
  );
}

export default function BusinessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Business Center...</div>}>
      <BusinessContent />
    </Suspense>
  );
}
