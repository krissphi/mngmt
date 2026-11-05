'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

interface ChannelFeeFieldsProps {
  feeRatePercent: string;
  feeAmount: string;
  passFeeToBuyer: boolean;
  onFeeRateChange: (val: string) => void;
  onFeeAmountChange: (val: string) => void;
  onPassFeeToBuyerChange: (val: boolean) => void;
}

export function ChannelFeeFields({
  feeRatePercent,
  feeAmount,
  passFeeToBuyer,
  onFeeRateChange,
  onFeeAmountChange,
  onPassFeeToBuyerChange,
}: ChannelFeeFieldsProps) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-border/60 space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">
            Channel Fee Rate (%)
          </label>
          <Input
            type="number"
            step="any"
            min="0"
            value={feeRatePercent}
            onChange={(e) => onFeeRateChange(e.target.value)}
            placeholder="e.g. 10 or 0"
            className="h-8 text-xs font-medium"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">
            Total Admin Fee (Rp)
          </label>
          <Input
            type="number"
            min="0"
            value={feeAmount}
            onChange={(e) => onFeeAmountChange(e.target.value)}
            placeholder="0"
            className="h-8 text-xs font-medium"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
        <input
          type="checkbox"
          checked={passFeeToBuyer}
          onChange={(e) => onPassFeeToBuyerChange(e.target.checked)}
          className="size-3.5 rounded border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer"
        />
        <span className="text-[11px] font-medium text-foreground">
          Markup listing price by fee (fee is passed to buyer, protecting your base profit)
        </span>
      </label>
    </div>
  );
}
