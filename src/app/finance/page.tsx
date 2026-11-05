"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { LedgerTab } from "@/components/finance/ledger-tab";
import { CashFlowTab } from "@/components/finance/cashflow-tab";
import { PnlTab } from "@/components/finance/pnl-tab";
import { BalanceSheetTab } from "@/components/finance/balance-sheet-tab";

type FinanceTab = "ledger" | "cashflow" | "pnl" | "balance-sheet";

export default function FinanceCenterPage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("ledger");

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Ledger & Finance"
        description="Audit transaction records, monitor inflows/outflows, and review profit & loss statements."
      />

      <div className="flex flex-wrap gap-1 border-b border-border/80 pb-2">
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "ledger"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          General Ledger
        </button>
        <button
          onClick={() => setActiveTab("cashflow")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "cashflow"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Cash Flow
        </button>
        <button
          onClick={() => setActiveTab("pnl")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "pnl"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Profit & Loss (P&L)
        </button>
        <button
          onClick={() => setActiveTab("balance-sheet")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "balance-sheet"
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Balance Sheet
        </button>
      </div>

      {activeTab === "ledger" && <LedgerTab />}
      {activeTab === "cashflow" && <CashFlowTab />}
      {activeTab === "pnl" && <PnlTab />}
      {activeTab === "balance-sheet" && <BalanceSheetTab />}
    </div>
  );
}
