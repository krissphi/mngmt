'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { LedgerTab } from '@/components/finance/ledger-tab';
import { CashFlowTab } from '@/components/finance/cashflow-tab';
import { PnlTab } from '@/components/finance/pnl-tab';
import { BalanceSheetTab } from '@/components/finance/balance-sheet-tab';
import { DebtsTab } from '@/components/finance/debts-tab';
import { Receipt, TrendingUp, BarChart3, Scale, HandCoins } from 'lucide-react';

type LedgerTabKey = 'ledger' | 'cashflow' | 'pnl' | 'balance-sheet' | 'debts';

const VALID_TABS: LedgerTabKey[] = ['ledger', 'cashflow', 'pnl', 'balance-sheet', 'debts'];

function LedgerContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as LedgerTabKey | null;
  const validTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : null;

  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  const [activeTab, setActiveTab] = useState<LedgerTabKey>(validTab || 'ledger');

  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (validTab) {
      setActiveTab(validTab);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting & Ledger"
        description="Audit transaction records, monitor inflows/outflows, track payables & receivables, and review financial statements."
      />

      <div className="inline-flex p-1 bg-secondary/40 backdrop-blur-xs rounded-xl border border-border/40 gap-1 flex-wrap print:hidden">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'ledger'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Receipt className="size-3.5" />
          <span>General Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'cashflow'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <TrendingUp className="size-3.5" />
          <span>Cash Flow</span>
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'pnl'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <BarChart3 className="size-3.5" />
          <span>Profit &amp; Loss</span>
        </button>

        <button
          onClick={() => setActiveTab('balance-sheet')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'balance-sheet'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Scale className="size-3.5" />
          <span>Balance Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            activeTab === 'debts'
              ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <HandCoins className="size-3.5" />
          <span>Payables &amp; Receivables</span>
        </button>
      </div>

      {activeTab === 'ledger' && <LedgerTab />}
      {activeTab === 'cashflow' && <CashFlowTab />}
      {activeTab === 'pnl' && <PnlTab />}
      {activeTab === 'balance-sheet' && <BalanceSheetTab />}
      {activeTab === 'debts' && <DebtsTab />}
    </div>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Ledger...</div>}>
      <LedgerContent />
    </Suspense>
  );
}
