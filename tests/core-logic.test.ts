import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isSellableProduct,
  isValidSale,
  getAvailableStock,
  calculateGrossProfit,
  calculateNetProfit,
  calculateWeightedAverageCost,
  calculateFeeFromRate,
  calculateCashBreakdownTotal,
} from '../src/lib/calculations';
import {
  getMainCategories,
  getSubCategories,
  resolveCategoryPair,
  isIncomeCategory,
  isExpenseCategory,
} from '../src/lib/categories';
import {
  sanitizeCsvCell,
  generateCSV,
  parseCSV,
  findColumnIndex,
} from '../src/lib/data-exchange';
import { validateBackupPayload } from '../src/lib/validation';
import {
  applySaleToProducts,
  applySaleStatusUpdateSingle,
  applyDeleteSale,
  applyUpdateTransaction,
  applyDeleteTransaction,
  applyStockPurchase,
  applyDepositToSavingsGoal,
  applyTransferProductToCollection,
  advanceNextBillingDate,
} from '../src/context/store-handlers';
import type { Account, Category, Product, Sale, SavingsGoal, Transaction } from '../src/types';

describe('calculations utilities', () => {
  it('distinguishes sellable products vs personal assets', () => {
    assert.equal(isSellableProduct({ productType: 'regular_inventory' }), true);
    assert.equal(isSellableProduct({ productType: 'preloved' }), true);
    assert.equal(isSellableProduct({ productType: 'asset' }), false);
    assert.equal(isSellableProduct({ productType: 'personal_collection' }), false);
  });

  it('excludes cancelled and returned sales from valid sales', () => {
    assert.equal(isValidSale({ orderStatus: 'completed' }), true);
    assert.equal(isValidSale({ orderStatus: 'pending' }), true);
    assert.equal(isValidSale({ orderStatus: 'cancelled' }), false);
    assert.equal(isValidSale({ orderStatus: 'returned' }), false);
  });

  it('computes available stock, profits, fees, and weighted average cost', () => {
    assert.equal(getAvailableStock({ stockOnHand: 5, stockReserved: 2 }), 3);
    assert.equal(getAvailableStock({ stockOnHand: 1, stockReserved: 4 }), 0);
    assert.equal(calculateGrossProfit(500000, 300000), 200000);
    assert.equal(
      calculateNetProfit({
        grossSales: 500000,
        cogsTotal: 300000,
        marketplaceFees: 40000,
        packingCosts: 5000,
        shippingCosts: 10000,
        discounts: 15000,
      }),
      130000
    );
    assert.equal(calculateFeeFromRate(100000, 8.5), 8500);
    assert.equal(calculateWeightedAverageCost(4, 100000, 6, 150000), 130000);
  });
});

describe('categories & sub-categories resolution', () => {
  const sampleCategories: Category[] = [
    { id: 'cat-1', name: 'Food & Dining', type: 'personal_expense' },
    { id: 'sub-1', name: 'Coffee', type: 'personal_expense', parentId: 'cat-1' },
    { id: 'cat-2', name: 'Toys', type: 'universal' },
    { id: 'cat-3', name: 'Salary', type: 'personal_income' },
  ];

  it('filters main categories by scope including universal', () => {
    const expenseMains = getMainCategories(sampleCategories, ['personal_expense']).map((c) => c.id);
    assert.deepEqual(expenseMains, ['cat-1', 'cat-2']);

    const productMains = getMainCategories(sampleCategories, ['product']).map((c) => c.id);
    assert.deepEqual(productMains, ['cat-2']);
  });

  it('returns subcategories for parent and resolves legacy child categoryId cleanly', () => {
    assert.equal(getSubCategories(sampleCategories, 'cat-1').length, 1);

    const explicit = resolveCategoryPair(sampleCategories, 'cat-1', 'sub-1');
    assert.equal(explicit.mainName, 'Food & Dining');
    assert.equal(explicit.subName, 'Coffee');
    assert.equal(explicit.fullName, 'Food & Dining / Coffee');

    const legacyChild = resolveCategoryPair(sampleCategories, 'sub-1');
    assert.equal(legacyChild.mainId, 'cat-1');
    assert.equal(legacyChild.subId, 'sub-1');
    assert.equal(legacyChild.fullName, 'Food & Dining / Coffee');
  });
});

describe('CSV exchange & formula-injection protection', () => {
  it('neutralizes spreadsheet formula prefixes', () => {
    assert.equal(sanitizeCsvCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
    assert.equal(sanitizeCsvCell('+cmd'), "'+cmd");
    assert.equal(sanitizeCsvCell('@evil'), "'@evil");
    assert.equal(sanitizeCsvCell(-500), '-500');
    assert.equal(sanitizeCsvCell('Normal Lunch'), 'Normal Lunch');
  });

  it('roundtrips CSV generation and parsing including semicolons and quotes', () => {
    const csv = generateCSV(['Date', 'Description', 'Amount'], [['2026-11-25', 'Coffee "Special"', 35000]]);
    const parsed = parseCSV(csv);
    assert.deepEqual(parsed.headers, ['Date', 'Description', 'Amount']);
    assert.deepEqual(parsed.rows, [['2026-11-25', 'Coffee "Special"', '35000']]);

    const semi = parseCSV('Date;Description;Amount\n2026-11-25;Lunch;50000');
    assert.deepEqual(semi.headers, ['Date', 'Description', 'Amount']);
    assert.equal(semi.rows[0][2], '50000');
    assert.equal(findColumnIndex(semi.headers, ['nominal', 'amount']), 2);
  });
});

describe('backup validation with Zod', () => {
  it('accepts valid backup snapshot and rejects malformed payloads', () => {
    const valid = validateBackupPayload({
      accounts: [{ id: 'acc-1', name: 'Cash', type: 'cash', balance: 10000 }],
      transactions: [],
    });
    assert.equal(valid.ok, true);

    const empty = validateBackupPayload({});
    assert.equal(empty.ok, false);

    const badAccount = validateBackupPayload({
      accounts: [{ id: 'acc-1', name: 'Cash', type: 'cash', balance: 'not-a-number' }],
    });
    assert.equal(badAccount.ok, false);
  });
});

describe('store handlers accounting & stock lifecycle', () => {
  const baseProduct: Product = {
    id: 'prod-1',
    sku: 'SKU-1',
    name: 'Test Figure',
    purchaseCost: 100000,
    sellingPrice: 150000,
    productType: 'regular_inventory',
    stockOnHand: 5,
    stockReserved: 0,
    stockSold: 0,
    minStockAlert: 1,
    status: 'active',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  };

  const baseAccount: Account = {
    id: 'acc-1',
    name: 'BCA',
    type: 'bank',
    balance: 1000000,
    isActive: true,
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  };

  const makeSale = (orderStatus: Sale['orderStatus'], paymentStatus: Sale['paymentStatus']): Sale => ({
    id: 'sale-1',
    orderNumber: 'ORD-1',
    channel: 'shopee',
    saleDate: '2026-11-25',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Test Figure',
        sku: 'SKU-1',
        quantity: 2,
        unitCost: 100000,
        unitPrice: 150000,
        subtotal: 300000,
        grossProfit: 100000,
      },
    ],
    grossSales: 300000,
    discounts: 0,
    marketplaceFees: 25500,
    packingCosts: 5000,
    shippingCosts: 0,
    cogsTotal: 200000,
    grossProfit: 100000,
    netProfit: 69500,
    paymentAccountId: 'acc-1',
    paymentStatus,
    orderStatus,
    createdAt: '2026-11-25',
  });

  it('reserves stock on pending order, fulfills on completed, and restores on return', () => {
    const pendingSale = makeSale('pending', 'unpaid');
    const step1 = applySaleToProducts([baseProduct], pendingSale, '2026-11-25T10:00:00Z');
    assert.equal(step1.updatedProducts[0].stockOnHand, 5);
    assert.equal(step1.updatedProducts[0].stockReserved, 2);
    assert.equal(step1.updatedProducts[0].stockSold, 0);

    const step2 = applySaleStatusUpdateSingle(
      [pendingSale],
      step1.updatedProducts,
      'sale-1',
      'completed',
      '2026-11-25T11:00:00Z'
    );
    assert.equal(step2.updatedProducts[0].stockOnHand, 3);
    assert.equal(step2.updatedProducts[0].stockReserved, 0);
    assert.equal(step2.updatedProducts[0].stockSold, 2);

    const step3 = applySaleStatusUpdateSingle(
      step2.updatedSales,
      step2.updatedProducts,
      'sale-1',
      'returned',
      '2026-11-25T12:00:00Z'
    );
    assert.equal(step3.updatedProducts[0].stockOnHand, 5);
    assert.equal(step3.updatedProducts[0].stockSold, 0);
  });

  it('deletes sale and rolls back both stock and linked income transaction', () => {
    const completedSale = makeSale('completed', 'paid');
    const prodAfterSale = applySaleToProducts([baseProduct], completedSale, '2026-11-25T10:00:00Z').updatedProducts;
    const saleTrx: Transaction = {
      id: 'trx-sale-1',
      date: '2026-11-25',
      scope: 'business',
      type: 'income',
      amount: 274500,
      accountId: 'acc-1',
      sourceModule: 'business_sale',
      referenceId: 'sale-1',
      description: 'Sale SHOPEE #ORD-1',
      createdAt: '2026-11-25',
    };
    const accAfterSale = [{ ...baseAccount, balance: 1274500 }];

    const delRes = applyDeleteSale(
      [completedSale],
      prodAfterSale,
      [saleTrx],
      accAfterSale,
      'sale-1',
      '2026-11-25T13:00:00Z'
    );
    assert.equal(delRes.updatedSales.length, 0);
    assert.equal(delRes.updatedProducts[0].stockOnHand, 5);
    assert.equal(delRes.updatedProducts[0].stockSold, 0);
    assert.equal(delRes.updatedTransactions.length, 0);
    assert.equal(delRes.updatedAccounts[0].balance, 1000000);
  });

  it('updates and deletes transactions while preserving exact pocket balance', () => {
    const trx: Transaction = {
      id: 'trx-1',
      date: '2026-11-25',
      scope: 'personal',
      type: 'expense',
      amount: 50000,
      accountId: 'acc-1',
      sourceModule: 'personal_expense',
      description: 'Lunch',
      createdAt: '2026-11-25',
    };
    const accAfterExp = [{ ...baseAccount, balance: 950000 }];

    const updated = applyUpdateTransaction([trx], accAfterExp, 'trx-1', { amount: 80000 });
    assert.equal(updated.updatedAccounts[0].balance, 920000);

    const deleted = applyDeleteTransaction(updated.updatedTransactions, updated.updatedAccounts, 'trx-1');
    assert.equal(deleted.updatedAccounts[0].balance, 1000000);
  });

  it('records stock purchase with weighted average cost and expense deduction', () => {
    const res = applyStockPurchase([baseProduct], [baseAccount], [], {
      productId: 'prod-1',
      quantity: 5,
      unitCost: 120000,
      paymentAccountId: 'acc-1',
      date: '2026-11-25',
      nowIso: '2026-11-25T10:00:00Z',
    });
    assert.equal(res.updatedProducts[0].stockOnHand, 10);
    assert.equal(res.updatedProducts[0].purchaseCost, 110000);
    assert.equal(res.updatedAccounts[0].balance, 400000);
    assert.equal(res.updatedTransactions.length, 1);
    assert.equal(res.movement?.type, 'purchase_in');
  });

  it('advances billing cycles accurately', () => {
    assert.equal(advanceNextBillingDate('2026-11-15', 'monthly'), '2026-12-15');
    assert.equal(advanceNextBillingDate('2026-11-15', 'yearly'), '2027-11-15');
    assert.equal(advanceNextBillingDate('2026-11-01', '28_days'), '2026-11-29');
  });

  it('computes physical cash breakdown total cleanly', () => {
    const total = calculateCashBreakdownTotal({
      100000: 3,
      50000: 2,
      20000: 4,
      500: 2,
    });
    assert.equal(total, 481000);
    assert.equal(calculateCashBreakdownTotal(undefined), 0);
  });

  it('separates income and outcome categories cleanly by flow', () => {
    const cats: Category[] = [
      { id: 'c1', name: 'Food', type: 'personal_expense', flow: 'expense' },
      { id: 'c2', name: 'Toys', type: 'universal' },
      { id: 'c3', name: 'Income', type: 'personal_income', flow: 'income' },
      { id: 's1', name: 'Salary', type: 'personal_income', parentId: 'c3' },
    ];
    const incomeMains = getMainCategories(cats, { flow: 'income' });
    const outcomeMains = getMainCategories(cats, { flow: 'expense' });
    assert.deepEqual(incomeMains.map((c) => c.id), ['c3']);
    assert.deepEqual(outcomeMains.map((c) => c.id), ['c1', 'c2']);
    assert.equal(isIncomeCategory(cats[3]), true);
    assert.equal(isExpenseCategory(cats[1]), true);
  });

  it('records savings goal deposit as transfer rather than expense', () => {
    const goals: SavingsGoal[] = [
      {
        id: 'svg-1',
        name: 'Emergency Fund',
        targetAmount: 5000000,
        currentAmount: 1000000,
        createdAt: '2026-11-01',
      },
    ];
    const res = applyDepositToSavingsGoal({
      savingsGoals: goals,
      accounts: [baseAccount],
      transactions: [],
      goalId: 'svg-1',
      amount: 250000,
      accountId: 'acc-1',
      date: '2026-11-25',
      nowIso: '2026-11-25T10:00:00Z',
    });
    assert.equal(res.updatedGoals[0].currentAmount, 1250000);
    assert.equal(res.updatedAccounts[0].balance, 750000);
    assert.equal(res.updatedTransactions.length, 1);
    assert.equal(res.updatedTransactions[0].type, 'transfer');
    assert.equal(res.updatedTransactions[0].sourceModule, 'savings_deposit');
  });

  it('transfers 1 unit from seller to collection while preserving original SKU', () => {
    const singleStockProd: Product = { ...baseProduct, stockOnHand: 1, stockSold: 4 };
    const res = applyTransferProductToCollection({
      products: [singleStockProd],
      productId: 'prod-1',
      condition: 'mint',
      nowIso: '2026-11-25T10:00:00Z',
      dateStr: '2026-11-25',
    });
    assert.equal(res.updatedProducts.length, 2);
    const createdAsset = res.updatedProducts.find((p) => p.productType === 'asset');
    const originalSeller = res.updatedProducts.find((p) => p.id === 'prod-1');
    assert.ok(createdAsset);
    assert.equal(createdAsset?.stockOnHand, 1);
    assert.equal(originalSeller?.stockOnHand, 0);
    assert.equal(originalSeller?.stockSold, 4);
    assert.equal(originalSeller?.productType, 'regular_inventory');

    // Out-of-stock guard
    const zeroRes = applyTransferProductToCollection({
      products: [{ ...baseProduct, stockOnHand: 0 }],
      productId: 'prod-1',
      nowIso: '2026-11-25T10:00:00Z',
      dateStr: '2026-11-25',
    });
    assert.equal(zeroRes.movement, undefined);
    assert.equal(zeroRes.updatedProducts.length, 1);
  });
});
