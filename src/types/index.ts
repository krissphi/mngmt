// ARKAOS / MNGMT Domain Types

export type CurrencyCode = 'IDR';

export type PocketType = 'cash' | 'bank' | 'e_money';
export type AccountType = PocketType | 'e_wallet' | 'marketplace' | 'other';

export type CashBreakdown = Record<number, number>; // nominal (e.g. 100000) -> count (e.g. 5)

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  cashBreakdown?: CashBreakdown; // khusus pocket uang tunai
  accountNumber?: string;
  institution?: string; // e.g. BCA, Mandiri, GoPay, ShopeePay
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Pocket = Account;

export type CategoryFlow = 'income' | 'expense';
export type CategoryType = 'universal' | 'personal_income' | 'personal_expense' | 'business_expense' | 'product';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  flow?: CategoryFlow;
  parentId?: string; // undefined = Main Category, set = Sub Category
  icon?: string;
  color?: string;
}

export type TransactionScope = 'personal' | 'business';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type SourceModule =
  | 'personal_income'
  | 'personal_expense'
  | 'business_sale'
  | 'business_purchase'
  | 'business_expense'
  | 'asset_sale'
  | 'transfer'
  | 'savings_deposit'
  | 'balance_adjustment'
  | 'debt_settlement'
  | 'manual';

export type ItemDestinationAction = 'none' | 'collect' | 'sell';

export interface Transaction {
  id: string;
  date: string; // ISO date YYYY-MM-DD (local date)
  scope: TransactionScope;
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId?: string; // for transfers
  categoryId?: string; // Main category ID
  subCategoryId?: string; // Optional sub category ID
  sourceModule: SourceModule;
  referenceId?: string; // e.g. saleId, purchaseId, assetId, debtId
  description: string;
  isRecurring?: boolean;
  notes?: string;
  itemAction?: ItemDestinationAction;
  itemCondition?: AssetCondition;
  itemBrand?: string;
  createdAt: string;
}

export type ProductType = 'regular_inventory' | 'preloved' | 'asset' | 'personal_collection';
export type ProductStatus = 'active' | 'archived' | 'discontinued';
export type AssetCondition = 'mint' | 'good' | 'fair' | 'needs_repair';
export type AssetStatus = 'owned' | 'for_sale' | 'sold' | 'archived';

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId?: string;
  subCategoryId?: string;
  category?: string;
  supplierId?: string;
  brand?: string;
  description?: string;
  notes?: string;
  imageUrl?: string;
  purchaseCost: number; // weighted average cost or unit cost
  sellingPrice: number;
  purchasePrice?: number; // compatibility alias for assets
  currentEstimatedValue?: number; // compatibility alias for assets
  purchaseDate?: string;
  condition?: AssetCondition;
  productType: ProductType;
  stockOnHand: number;
  stockReserved: number;
  stockSold: number;
  minStockAlert: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Asset extends Product {
  purchasePrice: number;
  currentEstimatedValue: number;
  condition: AssetCondition;
  category: string;
}

export type MovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'damaged'
  | 'reserved'
  | 'unreserved'
  | 'return_in';

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type SalesChannel = 'shopee' | 'tiktok' | 'tokopedia' | 'direct' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'returned';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
  grossProfit: number;
}

export interface Sale {
  id: string;
  orderNumber: string;
  channel: SalesChannel;
  saleDate: string;
  customerName?: string;
  items: SaleItem[];
  grossSales: number;
  discounts: number;
  marketplaceFees: number;
  packingCosts: number;
  shippingCosts: number;
  cogsTotal: number;
  grossProfit: number;
  netProfit: number;
  paymentAccountId?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  subCategoryId?: string;
  month: string; // 'YYYY-MM'
  allocatedAmount: number;
  spentAmount?: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color?: string;
  icon?: string;
  createdAt: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface WishlistItem {
  id: string;
  name: string;
  estimatedPrice: number;
  priority: Priority;
  targetDate?: string;
  isPurchased: boolean;
  notes?: string;
  createdAt: string;
}

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | '28_days';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  billingDay: number;
  accountId: string;
  categoryId?: string;
  subCategoryId?: string;
  status: SubscriptionStatus;
  nextBillingDate: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export type DebtDirection = 'payable' | 'receivable';
export type DebtStatus = 'open' | 'settled';

export interface DebtRecord {
  id: string;
  direction: DebtDirection; // payable = hutang (liability), receivable = piutang (asset)
  title: string;
  counterparty: string;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
  accountId?: string;
  status: DebtStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
