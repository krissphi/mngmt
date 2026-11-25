'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { BusinessSummaryTab } from '@/components/business/business-summary-tab';
import { ProductsTab } from '@/components/business/products-tab';
import { SalesTab } from '@/components/business/sales-tab';
import { StockMovementTable } from '@/components/business/stock-movement-table';
import { SuppliersTab } from '@/components/business/suppliers-tab';
import { AdjustStockDialog } from '@/components/business/adjust-stock-dialog';
import { RestockDialog } from '@/components/business/restock-dialog';
import { QuickActionModal } from '@/components/shared/quick-action-modal';
import { Package, ShoppingCart, BarChart3, History, Truck } from 'lucide-react';

type SellerTab = 'summary' | 'products' | 'sales' | 'audit' | 'suppliers';

const VALID_TABS: SellerTab[] = ['summary', 'products', 'sales', 'audit', 'suppliers'];

function SellerContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as SellerTab | null;
  const validTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : null;

  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeTab, setActiveTab] = useState<SellerTab>(validTab || 'summary');

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (validTab) {
      setActiveTab(validTab);
    }
  }

  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalTab, setQuickModalTab] = useState<'sale' | 'product'>('sale');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleOpenAdjust = (prodId: string) => {
    setSelectedProductId(prodId);
    setAdjustModalOpen(true);
  };

  const handleOpenRestock = (prodId: string) => {
    setSelectedProductId(prodId);
    setRestockModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Center"
        description="Manage product catalog, inventory restocks, stock audit trail, suppliers, and multichannel sales."
      />

      {/* Sleek Obsidian Segmented Control */}
      <div className="inline-flex p-1 bg-secondary/40 backdrop-blur-xs rounded-xl border border-border/40 gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'summary'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <BarChart3 className="size-3.5" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'products'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Package className="size-3.5" />
          <span>Products &amp; Stock</span>
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'sales'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <ShoppingCart className="size-3.5" />
          <span>Sales Orders</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'audit'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <History className="size-3.5" />
          <span>Stock Audit</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'suppliers'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Truck className="size-3.5" />
          <span>Suppliers</span>
        </button>
      </div>

      {activeTab === 'summary' && <BusinessSummaryTab />}
      {activeTab === 'products' && (
        <ProductsTab
          onOpenAddProduct={() => {
            setQuickModalTab('product');
            setQuickModalOpen(true);
          }}
          onOpenAdjust={handleOpenAdjust}
          onOpenRestock={handleOpenRestock}
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
      {activeTab === 'audit' && <StockMovementTable />}
      {activeTab === 'suppliers' && <SuppliersTab />}

      <AdjustStockDialog
        open={adjustModalOpen}
        onOpenChange={setAdjustModalOpen}
        productId={selectedProductId}
      />

      <RestockDialog
        open={restockModalOpen}
        onOpenChange={setRestockModalOpen}
        productId={selectedProductId}
      />

      <QuickActionModal
        open={quickModalOpen}
        onOpenChange={setQuickModalOpen}
        defaultTab={quickModalTab}
      />
    </div>
  );
}

export default function SellerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Seller Center...</div>}>
      <SellerContent />
    </Suspense>
  );
}
