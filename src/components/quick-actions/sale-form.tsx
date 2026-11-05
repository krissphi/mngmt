'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { formatIDR } from '@/lib/currency';
import { calculateGrossProfit, calculateFeeFromRate } from '@/lib/calculations';
import { SalesChannel } from '@/types';
import { ProductSearchSelect } from '@/components/shared/product-search-select';
import { ChannelFeeFields } from './channel-fee-fields';

interface SaleFormProps {
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}

export function SaleForm({ onSuccess, onCancel }: SaleFormProps) {
  const { accounts, products, recordSale } = useStore();

  const saleProducts = React.useMemo(() => {
    return products.filter((p) => p.productType !== 'asset' && p.productType !== 'personal_collection');
  }, [products]);

  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saleChannel, setSaleChannel] = useState<SalesChannel>('shopee');
  const [saleCustomer, setSaleCustomer] = useState('');
  const [saleProduct, setSaleProduct] = useState(() => saleProducts[0]?.id || '');
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState(() => saleProducts[0]?.sellingPrice || 0);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [salePacking, setSalePacking] = useState(0);
  const [saleAccount, setSaleAccount] = useState(() => accounts[0]?.id || '');
  const [stockError, setStockError] = useState('');
  const [feeRatePercent, setFeeRatePercent] = useState('0');
  const [manualFeeAmount, setManualFeeAmount] = useState('0');
  const [isManualFee, setIsManualFee] = useState(false);
  const [passFeeToBuyer, setPassFeeToBuyer] = useState(true);

  const baseSubtotal = Number(salePrice) * Number(saleQty);
  const feeAmount = isManualFee ? manualFeeAmount : String(calculateFeeFromRate(baseSubtotal, Number(feeRatePercent) || 0));

  const handleFeeRateChange = (val: string) => {
    setFeeRatePercent(val);
    setIsManualFee(false);
  };

  const handleFeeAmountChange = (val: string) => {
    setManualFeeAmount(val);
    setIsManualFee(true);
  };

  const selectedProductObj = products.find((p) => p.id === saleProduct);
  const currentFeeNum = Number(feeAmount) || 0;
  const cogsTotal = (selectedProductObj?.purchaseCost || 0) * Number(saleQty);

  // When passFeeToBuyer is true, fee is marked up on top so seller nets the base price
  const grossTotal = passFeeToBuyer ? baseSubtotal + currentFeeNum : baseSubtotal;
  const estNetProfit = passFeeToBuyer
    ? baseSubtotal - cogsTotal - Number(salePacking) - Number(saleDiscount)
    : grossTotal - currentFeeNum - cogsTotal - Number(salePacking) - Number(saleDiscount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === saleProduct);
    if (!prod) return;

    const available = prod.stockOnHand - prod.stockReserved;
    if (Number(saleQty) > available) {
      setStockError(`Insufficient stock! Available: ${available} pcs.`);
      return;
    }
    setStockError('');

    const grossProfit = calculateGrossProfit(grossTotal, cogsTotal);
    const unitListingPrice = Number(saleQty) > 0 ? Math.round(grossTotal / Number(saleQty)) : Number(salePrice);

    recordSale({
      channel: saleChannel,
      saleDate,
      customerName: saleCustomer || 'Store Customer',
      items: [{
        id: `item-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: Number(saleQty),
        unitCost: prod.purchaseCost,
        unitPrice: unitListingPrice,
        subtotal: grossTotal,
        grossProfit,
      }],
      grossSales: grossTotal,
      discounts: Number(saleDiscount),
      marketplaceFees: currentFeeNum,
      packingCosts: Number(salePacking),
      shippingCosts: 0,
      cogsTotal,
      grossProfit,
      netProfit: estNetProfit,
      paymentAccountId: saleAccount || accounts[0]?.id,
      paymentStatus: 'paid',
      orderStatus: 'completed',
    });

    onSuccess('Business sale recorded & stock deducted successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Sales Channel</label>
          <select
            className="w-full h-8.5 rounded-md border border-input bg-card px-3 text-xs"
            value={saleChannel}
            onChange={(e) => setSaleChannel(e.target.value as SalesChannel)}
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

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Select Product (Live Search)</label>
        <ProductSearchSelect
          products={saleProducts}
          selectedProductId={saleProduct}
          onSelect={(p) => {
            setSaleProduct(p.id);
            setSalePrice(p.sellingPrice);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Quantity (Pcs)</label>
          <Input
            type="number"
            min={1}
            max={selectedProductObj ? (selectedProductObj.stockOnHand - selectedProductObj.stockReserved) : 99}
            value={saleQty}
            onChange={(e) => {
              setSaleQty(Number(e.target.value));
              setStockError('');
            }}
            required
            className="h-8.5"
          />
          {stockError && <p className="text-xs text-rose-600 font-medium mt-1">{stockError}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Base Selling Price (Rp)</label>
          <Input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(Number(e.target.value))}
            required
            className="h-8.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Discount (Rp)</label>
          <Input type="number" value={saleDiscount} onChange={(e) => setSaleDiscount(Number(e.target.value))} className="h-8.5" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Packaging Cost (Rp)</label>
          <Input type="number" value={salePacking} onChange={(e) => setSalePacking(Number(e.target.value))} className="h-8.5" />
        </div>
      </div>

      <ChannelFeeFields
        feeRatePercent={feeRatePercent}
        feeAmount={feeAmount}
        passFeeToBuyer={passFeeToBuyer}
        onFeeRateChange={handleFeeRateChange}
        onFeeAmountChange={handleFeeAmountChange}
        onPassFeeToBuyerChange={setPassFeeToBuyer}
      />

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

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Payment Account</label>
        <select
          className="w-full h-8.5 rounded-md border border-input bg-card px-3 text-xs"
          value={saleAccount}
          onChange={(e) => setSaleAccount(e.target.value)}
          required
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({formatIDR(a.balance)})
            </option>
          ))}
        </select>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">Record Sale</Button>
      </DialogFooter>
    </form>
  );
}
