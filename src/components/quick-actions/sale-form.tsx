'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { formatIDR } from '@/lib/currency';
import { getLocalDateString } from '@/lib/date';
import {
  calculateGrossProfit,
  calculateFeeFromRate,
  getAvailableStock,
  getSavedChannelFeeRates,
  isSellableProduct,
} from '@/lib/calculations';
import { OrderStatus, PaymentStatus, SaleItem, SalesChannel } from '@/types';
import { ProductSearchSelect } from '@/components/shared/product-search-select';
import { ChannelFeeFields } from './channel-fee-fields';
import { Plus, Trash2 } from 'lucide-react';

interface SaleFormProps {
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}

interface DraftLine {
  key: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function SaleForm({ onSuccess, onCancel }: SaleFormProps) {
  const { accounts, products, recordSale } = useStore();

  const saleProducts = useMemo(
    () => products.filter((p) => isSellableProduct(p) && p.status !== 'archived'),
    [products]
  );
  const feeRates = useMemo(() => getSavedChannelFeeRates(), []);

  const [saleDate, setSaleDate] = useState(() => getLocalDateString());
  const [saleChannel, setSaleChannel] = useState<SalesChannel>('shopee');
  const [saleCustomer, setSaleCustomer] = useState('');
  const [lines, setLines] = useState<DraftLine[]>(() => [
    {
      key: 'line-1',
      productId: saleProducts[0]?.id || '',
      quantity: 1,
      unitPrice: saleProducts[0]?.sellingPrice || 0,
    },
  ]);

  const [saleDiscount, setSaleDiscount] = useState(0);
  const [salePacking, setSalePacking] = useState(0);
  const [saleShipping, setSaleShipping] = useState(0);
  const [saleAccount, setSaleAccount] = useState(() => accounts[0]?.id || '');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('completed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [stockError, setStockError] = useState('');

  const [feeRatePercent, setFeeRatePercent] = useState(() => String(feeRates.shopee ?? 8.5));
  const [manualFeeAmount, setManualFeeAmount] = useState('0');
  const [isManualFee, setIsManualFee] = useState(false);
  const [passFeeToBuyer, setPassFeeToBuyer] = useState(true);

  const handleChannelChange = (ch: SalesChannel) => {
    setSaleChannel(ch);
    const rate = feeRates[ch] ?? 0;
    setFeeRatePercent(String(rate));
    setIsManualFee(false);
    if (ch === 'direct') {
      setPassFeeToBuyer(false);
    }
  };

  const handleAddLine = () => {
    const usedIds = new Set(lines.map((l) => l.productId));
    const nextProd = saleProducts.find((p) => !usedIds.has(p.id)) || saleProducts[0];
    setLines((prev) => [
      ...prev,
      {
        key: `line-${Date.now()}-${prev.length}`,
        productId: nextProd?.id || '',
        quantity: 1,
        unitPrice: nextProd?.sellingPrice || 0,
      },
    ]);
  };

  const handleRemoveLine = (key: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
    setStockError('');
  };

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setStockError('');
  };

  const { baseSubtotal, cogsTotal } = useMemo(() => {
    let sub = 0;
    let cogs = 0;
    for (const line of lines) {
      const prod = products.find((p) => p.id === line.productId);
      const qty = Math.max(0, Number(line.quantity) || 0);
      sub += (Number(line.unitPrice) || 0) * qty;
      cogs += (prod?.purchaseCost || 0) * qty;
    }
    return { baseSubtotal: sub, cogsTotal: cogs };
  }, [lines, products]);

  const feeAmount = isManualFee
    ? manualFeeAmount
    : String(calculateFeeFromRate(baseSubtotal, Number(feeRatePercent) || 0));

  const currentFeeNum = Number(feeAmount) || 0;
  const grossTotal = passFeeToBuyer ? baseSubtotal + currentFeeNum : baseSubtotal;
  const estNetProfit = passFeeToBuyer
    ? baseSubtotal - cogsTotal - Number(salePacking) - Number(saleShipping) - Number(saleDiscount)
    : grossTotal - currentFeeNum - cogsTotal - Number(salePacking) - Number(saleShipping) - Number(saleDiscount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Aggregate quantities per product to validate total stock across lines
    const requestedByProduct = new Map<string, number>();
    for (const line of lines) {
      if (!line.productId || line.quantity <= 0) continue;
      requestedByProduct.set(line.productId, (requestedByProduct.get(line.productId) || 0) + Number(line.quantity));
    }

    if (requestedByProduct.size === 0) {
      setStockError('Please select at least one valid product and quantity.');
      return;
    }

    for (const [prodId, reqQty] of requestedByProduct.entries()) {
      const prod = products.find((p) => p.id === prodId);
      if (!prod) continue;
      const available = getAvailableStock(prod);
      if (reqQty > available) {
        setStockError(`Insufficient stock for "${prod.name}"! Available: ${available} pcs.`);
        return;
      }
    }
    setStockError('');

    const feeRatio = baseSubtotal > 0 && passFeeToBuyer ? (baseSubtotal + currentFeeNum) / baseSubtotal : 1;

    const saleItems: SaleItem[] = lines
      .filter((l) => l.productId && l.quantity > 0)
      .map((l, idx) => {
        const prod = products.find((p) => p.id === l.productId)!;
        const qty = Number(l.quantity);
        const lineSubtotal = Math.round(Number(l.unitPrice) * qty * feeRatio);
        const lineCogs = prod.purchaseCost * qty;
        return {
          id: `item-${Date.now()}-${idx}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: qty,
          unitCost: prod.purchaseCost,
          unitPrice: qty > 0 ? Math.round(lineSubtotal / qty) : Number(l.unitPrice),
          subtotal: lineSubtotal,
          grossProfit: lineSubtotal - lineCogs,
        };
      });

    const grossProfit = calculateGrossProfit(grossTotal, cogsTotal);

    recordSale({
      channel: saleChannel,
      saleDate,
      customerName: saleCustomer.trim() || 'Store Customer',
      items: saleItems,
      grossSales: grossTotal,
      discounts: Number(saleDiscount) || 0,
      marketplaceFees: currentFeeNum,
      packingCosts: Number(salePacking) || 0,
      shippingCosts: Number(saleShipping) || 0,
      cogsTotal,
      grossProfit,
      netProfit: estNetProfit,
      paymentAccountId: saleAccount || accounts[0]?.id,
      paymentStatus,
      orderStatus,
    });

    onSuccess(
      orderStatus === 'pending' || orderStatus === 'processing' || orderStatus === 'confirmed'
        ? 'Order recorded & inventory stock reserved!'
        : 'Business sale recorded & stock updated!'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Sales Channel</label>
          <select
            className="w-full h-8.5 rounded-md border border-input bg-card px-3 text-xs"
            value={saleChannel}
            onChange={(e) => handleChannelChange(e.target.value as SalesChannel)}
          >
            <option value="shopee">Shopee</option>
            <option value="tiktok">TikTok Shop</option>
            <option value="tokopedia">Tokopedia</option>
            <option value="direct">Direct / Offline</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Sale Date</label>
          <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required className="h-8.5" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Customer Name (Optional)</label>
        <Input placeholder="e.g. John Doe" value={saleCustomer} onChange={(e) => setSaleCustomer(e.target.value)} className="h-8.5" />
      </div>

      {/* Multi-item Order Lines */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Order Items ({lines.length})</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddLine}
            className="h-7 px-2 text-xs gap-1 text-primary"
          >
            <Plus className="size-3.5" />
            <span>Add Item</span>
          </Button>
        </div>

        <div className="space-y-2.5">
          {lines.map((line) => (
            <div key={line.key} className="p-2.5 rounded-lg border border-border/60 bg-muted/15 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <ProductSearchSelect
                    products={saleProducts}
                    selectedProductId={line.productId}
                    onSelect={(p) =>
                      updateLine(line.key, {
                        productId: p.id,
                        unitPrice: p.sellingPrice,
                      })
                    }
                  />
                </div>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.key)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 rounded shrink-0"
                    title="Remove line item"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Qty (Pcs)</label>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Base Price (Rp)</label>
                  <Input
                    type="number"
                    min={0}
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {stockError && <p className="text-xs text-rose-500 font-medium">{stockError}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Discount (Rp)</label>
          <Input type="number" min={0} value={saleDiscount} onChange={(e) => setSaleDiscount(Number(e.target.value))} className="h-8.5" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Packing Cost (Rp)</label>
          <Input type="number" min={0} value={salePacking} onChange={(e) => setSalePacking(Number(e.target.value))} className="h-8.5" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Shipping Cost (Rp)</label>
          <Input type="number" min={0} value={saleShipping} onChange={(e) => setSaleShipping(Number(e.target.value))} className="h-8.5" />
        </div>
      </div>

      <ChannelFeeFields
        feeRatePercent={feeRatePercent}
        feeAmount={feeAmount}
        passFeeToBuyer={passFeeToBuyer}
        onFeeRateChange={(val) => {
          setFeeRatePercent(val);
          setIsManualFee(false);
        }}
        onFeeAmountChange={(val) => {
          setManualFeeAmount(val);
          setIsManualFee(true);
        }}
        onPassFeeToBuyerChange={setPassFeeToBuyer}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Order Status</label>
          <select
            className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs"
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
          >
            <option value="completed">Completed (Deduct Stock)</option>
            <option value="shipped">Shipped (Deduct Stock)</option>
            <option value="processing">Processing (Reserve Stock)</option>
            <option value="pending">Pending (Reserve Stock)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Status</label>
          <select
            className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
          >
            <option value="paid">Paid / Settled Now</option>
            <option value="unpaid">Pending Settlement (Escrow)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Deposit Pocket</label>
          <select
            className="w-full h-8.5 rounded-md border border-input bg-card px-2.5 text-xs"
            value={saleAccount}
            onChange={(e) => setSaleAccount(e.target.value)}
            required={paymentStatus === 'paid'}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatIDR(a.balance)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1.5 border border-border/50">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Base Target Value:</span>
          <span className="font-semibold">{formatIDR(baseSubtotal)}</span>
        </div>
        {currentFeeNum > 0 && passFeeToBuyer && (
          <div className="flex justify-between text-blue-600 dark:text-blue-400">
            <span>+ Fee Markup (Buyer Pays):</span>
            <span className="font-medium">+{formatIDR(currentFeeNum)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Final Gross Sales:</span>
          <span className="font-bold text-foreground">{formatIDR(grossTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Product Cost (COGS):</span>
          <span className="text-rose-600 font-medium">-{formatIDR(cogsTotal)}</span>
        </div>
        {currentFeeNum > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Channel Fee Deducted:</span>
            <span className="text-rose-600 font-medium">-{formatIDR(currentFeeNum)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t border-border font-bold">
          <span>Estimated Net Profit:</span>
          <span className={estNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
            {formatIDR(estNetProfit)}
          </span>
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">Record Sale</Button>
      </DialogFooter>
    </form>
  );
}
