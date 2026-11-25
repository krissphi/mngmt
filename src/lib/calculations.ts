import type { Product, Sale, SalesChannel } from '@/types';

/**
 * Canonical predicate: whether a product belongs to sellable store inventory
 * (excludes personal collectibles/assets).
 */
export function isSellableProduct(product: Pick<Product, 'productType'>): boolean {
  return product.productType !== 'asset' && product.productType !== 'personal_collection';
}

/**
 * Canonical predicate: whether a sale should count toward revenue/profit KPIs & reports.
 */
export function isValidSale(sale: Pick<Sale, 'orderStatus'>): boolean {
  return sale.orderStatus !== 'cancelled' && sale.orderStatus !== 'returned';
}

/**
 * Calculates available stock according to business rules:
 * Available Stock = Stock On Hand - Stock Reserved
 */
export function getAvailableStock(product: Pick<Product, 'stockOnHand' | 'stockReserved'>): number {
  return Math.max(0, product.stockOnHand - (product.stockReserved || 0));
}

/**
 * Gross Profit = Gross Sales - COGS
 */
export function calculateGrossProfit(grossSales: number, cogsTotal: number): number {
  return grossSales - cogsTotal;
}

/**
 * Net Profit Calculation:
 * Gross Revenue
 * - Cost of Goods Sold
 * - Marketplace Fees
 * - Packaging Costs
 * - Other Selling/Shipping Costs
 * - Allocated Discounts
 */
export interface ProfitCalculationParams {
  grossSales: number;
  cogsTotal: number;
  marketplaceFees: number;
  packingCosts: number;
  shippingCosts?: number;
  discounts?: number;
}

export function calculateNetProfit(params: ProfitCalculationParams): number {
  const {
    grossSales,
    cogsTotal,
    marketplaceFees,
    packingCosts,
    shippingCosts = 0,
    discounts = 0,
  } = params;

  return (
    grossSales -
    cogsTotal -
    marketplaceFees -
    packingCosts -
    shippingCosts -
    discounts
  );
}

/**
 * Calculate recommended marketplace fee estimate by channel:
 * Shopee ~ 8% - 10%
 * TikTok Shop ~ 8% - 9%
 * Tokopedia ~ 7% - 8.5%
 * Direct Sales = 0%
 */
export type ChannelFeeRates = Record<SalesChannel, number>;

export const DEFAULT_CHANNEL_FEE_RATES: ChannelFeeRates = {
  shopee: 8.5,
  tiktok: 8.0,
  tokopedia: 7.5,
  direct: 0,
  other: 0,
};

export const CHANNEL_FEE_RATES_KEY = 'arkaos_channel_fee_rates_v1';

export function getSavedChannelFeeRates(): ChannelFeeRates {
  if (typeof window === 'undefined') return DEFAULT_CHANNEL_FEE_RATES;
  try {
    const raw = localStorage.getItem(CHANNEL_FEE_RATES_KEY);
    if (!raw) return DEFAULT_CHANNEL_FEE_RATES;
    const parsed = JSON.parse(raw);
    return {
      shopee: typeof parsed.shopee === 'number' ? parsed.shopee : DEFAULT_CHANNEL_FEE_RATES.shopee,
      tiktok: typeof parsed.tiktok === 'number' ? parsed.tiktok : DEFAULT_CHANNEL_FEE_RATES.tiktok,
      tokopedia: typeof parsed.tokopedia === 'number' ? parsed.tokopedia : DEFAULT_CHANNEL_FEE_RATES.tokopedia,
      direct: typeof parsed.direct === 'number' ? parsed.direct : DEFAULT_CHANNEL_FEE_RATES.direct,
      other: typeof parsed.other === 'number' ? parsed.other : DEFAULT_CHANNEL_FEE_RATES.other,
    };
  } catch {
    return DEFAULT_CHANNEL_FEE_RATES;
  }
}

export function saveChannelFeeRates(rates: Partial<ChannelFeeRates>): ChannelFeeRates {
  if (typeof window === 'undefined') return DEFAULT_CHANNEL_FEE_RATES;
  try {
    const current = getSavedChannelFeeRates();
    const updated = { ...current, ...rates };
    localStorage.setItem(CHANNEL_FEE_RATES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_CHANNEL_FEE_RATES;
  }
}

export function calculateFeeFromRate(grossAmount: number, ratePercent: number): number {
  return Math.round((grossAmount * ratePercent) / 100);
}

export function getEstimatedFee(channel: string, grossAmount: number, customRates?: ChannelFeeRates): number {
  const rates = customRates || (typeof window !== 'undefined' ? getSavedChannelFeeRates() : DEFAULT_CHANNEL_FEE_RATES);
  const rate = (rates as Record<string, number>)[channel] ?? 0;
  return calculateFeeFromRate(grossAmount, rate);
}

/**
 * Calculate weighted average unit cost when new inventory arrives:
 * New Average Cost = (Old Total Cost + New Total Cost) / Total Quantity
 */
export function calculateWeightedAverageCost(
  currentStock: number,
  currentUnitCost: number,
  incomingQuantity: number,
  incomingUnitCost: number
): number {
  const safeCurrentStock = Math.max(0, currentStock);
  const totalStock = safeCurrentStock + incomingQuantity;
  if (totalStock <= 0) return incomingUnitCost;
  const currentTotalVal = safeCurrentStock * currentUnitCost;
  const incomingTotalVal = incomingQuantity * incomingUnitCost;
  return Math.round((currentTotalVal + incomingTotalVal) / totalStock);
}
