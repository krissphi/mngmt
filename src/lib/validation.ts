import { z } from 'zod';

const categoryTypeEnum = z.enum(['universal', 'personal_income', 'personal_expense', 'business_expense', 'product']);
const accountTypeEnum = z.enum(['cash', 'bank', 'e_money', 'e_wallet', 'marketplace', 'other']);
const conditionEnum = z.enum(['mint', 'good', 'fair', 'needs_repair']);
const productTypeEnum = z.enum(['regular_inventory', 'preloved', 'asset', 'personal_collection']);
const productStatusEnum = z.enum(['active', 'archived', 'discontinued']);

export const accountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: accountTypeEnum,
  balance: z.number().finite(),
  cashBreakdown: z.record(z.string(), z.number()).optional(),
  accountNumber: z.string().optional(),
  institution: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().default(''),
  updatedAt: z.string().default(''),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: categoryTypeEnum.default('universal'),
  parentId: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const supplierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().default(''),
});

export const productSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  category: z.string().optional(),
  supplierId: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  purchaseCost: z.number().finite().nonnegative().default(0),
  sellingPrice: z.number().finite().nonnegative().default(0),
  purchasePrice: z.number().finite().nonnegative().optional(),
  currentEstimatedValue: z.number().finite().nonnegative().optional(),
  purchaseDate: z.string().optional(),
  condition: conditionEnum.optional(),
  productType: productTypeEnum.default('regular_inventory'),
  stockOnHand: z.number().finite().default(0),
  stockReserved: z.number().finite().default(0),
  stockSold: z.number().finite().default(0),
  minStockAlert: z.number().finite().default(0),
  status: productStatusEnum.default('active'),
  createdAt: z.string().default(''),
  updatedAt: z.string().default(''),
});

export const inventoryMovementSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  type: z.enum([
    'purchase_in',
    'sale_out',
    'adjustment_in',
    'adjustment_out',
    'damaged',
    'reserved',
    'unreserved',
    'return_in',
  ]),
  quantity: z.number().finite(),
  previousStock: z.number().finite(),
  newStock: z.number().finite(),
  referenceId: z.string().optional(),
  notes: z.string().default(''),
  createdAt: z.string().default(''),
});

export const saleItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  productName: z.string().min(1),
  sku: z.string().default(''),
  quantity: z.number().finite().positive(),
  unitCost: z.number().finite().default(0),
  unitPrice: z.number().finite().default(0),
  subtotal: z.number().finite().default(0),
  grossProfit: z.number().finite().default(0),
});

export const saleSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  channel: z.enum(['shopee', 'tiktok', 'tokopedia', 'direct', 'other']),
  saleDate: z.string().min(1),
  customerName: z.string().optional(),
  items: z.array(saleItemSchema),
  grossSales: z.number().finite(),
  discounts: z.number().finite().default(0),
  marketplaceFees: z.number().finite().default(0),
  packingCosts: z.number().finite().default(0),
  shippingCosts: z.number().finite().default(0),
  cogsTotal: z.number().finite().default(0),
  grossProfit: z.number().finite(),
  netProfit: z.number().finite(),
  paymentAccountId: z.string().optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).default('paid'),
  orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled', 'returned']).default('completed'),
  notes: z.string().optional(),
  createdAt: z.string().default(''),
});

export const transactionSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  scope: z.enum(['personal', 'business']),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().finite().nonnegative(),
  accountId: z.string().min(1),
  toAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  sourceModule: z.enum([
    'personal_income',
    'personal_expense',
    'business_sale',
    'business_purchase',
    'business_expense',
    'asset_sale',
    'transfer',
    'balance_adjustment',
    'debt_settlement',
    'manual',
  ]).default('manual'),
  referenceId: z.string().optional(),
  description: z.string().default(''),
  isRecurring: z.boolean().optional(),
  notes: z.string().optional(),
  itemAction: z.enum(['none', 'collect', 'sell']).optional(),
  itemCondition: conditionEnum.optional(),
  itemBrand: z.string().optional(),
  createdAt: z.string().default(''),
});

export const budgetSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  subCategoryId: z.string().optional(),
  month: z.string().min(1),
  allocatedAmount: z.number().finite().nonnegative(),
  spentAmount: z.number().finite().optional(),
});

export const savingsGoalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetAmount: z.number().finite().positive(),
  currentAmount: z.number().finite().nonnegative().default(0),
  targetDate: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  createdAt: z.string().default(''),
});

export const wishlistItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  estimatedPrice: z.number().finite().nonnegative(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  targetDate: z.string().optional(),
  isPurchased: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.string().default(''),
});

export const subscriptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().finite().nonnegative(),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly', '28_days']),
  billingDay: z.number().int().min(1).max(31),
  accountId: z.string().min(1),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  status: z.enum(['active', 'paused', 'cancelled']).default('active'),
  nextBillingDate: z.string().default(''),
  description: z.string().optional(),
  color: z.string().optional(),
  createdAt: z.string().default(''),
});

export const debtRecordSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(['payable', 'receivable']),
  title: z.string().min(1),
  counterparty: z.string().default(''),
  totalAmount: z.number().finite().positive(),
  paidAmount: z.number().finite().nonnegative().default(0),
  dueDate: z.string().optional(),
  accountId: z.string().optional(),
  status: z.enum(['open', 'settled']).default('open'),
  notes: z.string().optional(),
  createdAt: z.string().default(''),
  updatedAt: z.string().default(''),
});

export const fullBackupSchema = z.object({
  accounts: z.array(accountSchema).optional(),
  categories: z.array(categorySchema).optional(),
  suppliers: z.array(supplierSchema).optional(),
  products: z.array(productSchema).optional(),
  inventoryMovements: z.array(inventoryMovementSchema).optional(),
  sales: z.array(saleSchema).optional(),
  transactions: z.array(transactionSchema).optional(),
  budgets: z.array(budgetSchema).optional(),
  savingsGoals: z.array(savingsGoalSchema).optional(),
  wishlist: z.array(wishlistItemSchema).optional(),
  subscriptions: z.array(subscriptionSchema).optional(),
  debts: z.array(debtRecordSchema).optional(),
  assets: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type ValidatedBackup = z.infer<typeof fullBackupSchema>;

export function validateBackupPayload(raw: unknown): { ok: true; data: ValidatedBackup } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Backup payload must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const hasAnyArray =
    Array.isArray(obj.accounts) ||
    Array.isArray(obj.transactions) ||
    Array.isArray(obj.products) ||
    Array.isArray(obj.sales);

  if (!hasAnyArray) {
    return { ok: false, error: 'Invalid backup format. Required entity arrays not found.' };
  }

  const parsed = fullBackupSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path?.join('.') || 'root';
    return { ok: false, error: `Validation failed at "${path}": ${firstIssue?.message || 'Invalid structure'}` };
  }
  return { ok: true, data: parsed.data };
}
