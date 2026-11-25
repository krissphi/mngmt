import { Account, Category, Supplier } from '@/types';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'BCA Business Account',
    type: 'bank',
    balance: 14750000,
    institution: 'Bank BCA',
    accountNumber: '8271928192',
    color: '#2563EB',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'acc-2',
    name: 'Mandiri Savings Account',
    type: 'bank',
    balance: 28500000,
    institution: 'Bank Mandiri',
    accountNumber: '137001928371',
    color: '#0D9488',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'acc-3',
    name: 'Physical Cash Wallet',
    type: 'cash',
    balance: 1450000,
    institution: 'Cash',
    color: '#16A34A',
    isActive: true,
    cashBreakdown: {
      100000: 10, // 1,000,000
      50000: 6,   // 300,000
      20000: 5,   // 100,000
      10000: 4,   // 40,000
      5000: 2,    // 10,000
      2000: 0,
      1000: 0,
      500: 0,
      200: 0,
      100: 0,
    },
    createdAt: '2026-01-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'acc-4',
    name: 'ShopeePay & Seller Balance',
    type: 'e_money',
    balance: 4820000,
    institution: 'Shopee Marketplace',
    color: '#EA580C',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'acc-5',
    name: 'GoPay Digital Wallet',
    type: 'e_money',
    balance: 850000,
    institution: 'GoPay',
    accountNumber: '081298765432',
    color: '#0284C7',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-11-01',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  // === Concise Main Categories ===
  { id: 'cat-exp-1', name: 'Food & Dining', type: 'personal_expense', flow: 'expense', color: '#EA580C' },
  { id: 'cat-exp-2', name: 'Bills & Utilities', type: 'personal_expense', flow: 'expense', color: '#0284C7' },
  { id: 'cat-exp-4', name: 'Transport', type: 'personal_expense', flow: 'expense', color: '#64748B' },
  { id: 'cat-exp-5', name: 'Lifestyle', type: 'universal', flow: 'expense', color: '#EC4899' },
  { id: 'cat-biz-1', name: 'Business Ops', type: 'business_expense', flow: 'expense', color: '#D97706' },
  { id: 'cat-inc-1', name: 'Income', type: 'personal_income', flow: 'income', color: '#16A34A' },
  { id: 'cat-prod-1', name: 'Toys & Figures', type: 'universal', flow: 'expense', color: '#2563EB' },
  { id: 'cat-prod-2', name: 'Electronics', type: 'universal', flow: 'expense', color: '#7C3AED' },
  { id: 'cat-prod-4', name: 'Supplies & Assets', type: 'product', flow: 'expense', color: '#0D9488' },

  // === Sub Categories: Food & Dining ===
  { id: 'sub-food-dining', name: 'Dining Out', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-1', color: '#EA580C' },
  { id: 'sub-food-coffee', name: 'Coffee & Snacks', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-1', color: '#F97316' },
  { id: 'sub-food-groceries', name: 'Groceries', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-1', color: '#FB923C' },

  // === Sub Categories: Bills & Utilities ===
  { id: 'sub-bill-internet', name: 'Internet & Mobile', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-2', color: '#0284C7' },
  { id: 'sub-bill-electric', name: 'Electricity & Water', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-2', color: '#EAB308' },
  { id: 'sub-bill-cloud', name: 'Cloud & Software', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-2', color: '#38BDF8' },

  // === Sub Categories: Transport ===
  { id: 'sub-trn-fuel', name: 'Fuel & Parking', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-4', color: '#64748B' },
  { id: 'sub-trn-ride', name: 'Ride & Transit', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-4', color: '#94A3B8' },
  { id: 'sub-trn-service', name: 'Vehicle Service', type: 'personal_expense', flow: 'expense', parentId: 'cat-exp-4', color: '#475569' },

  // === Sub Categories: Lifestyle ===
  { id: 'sub-lif-stream', name: 'Streaming & Media', type: 'universal', flow: 'expense', parentId: 'cat-exp-5', color: '#EC4899' },
  { id: 'sub-lif-hobby', name: 'Hobbies & Collectibles', type: 'universal', flow: 'expense', parentId: 'cat-exp-5', color: '#F43F5E' },
  { id: 'sub-lif-home', name: 'Household Supplies', type: 'universal', flow: 'expense', parentId: 'cat-exp-5', color: '#8B5CF6' },

  // === Sub Categories: Business Ops ===
  { id: 'sub-biz-pack', name: 'Packaging & Mailers', type: 'business_expense', flow: 'expense', parentId: 'cat-biz-1', color: '#D97706' },
  { id: 'sub-biz-ads', name: 'Ads & Marketing', type: 'business_expense', flow: 'expense', parentId: 'cat-biz-1', color: '#DC2626' },
  { id: 'sub-biz-ship', name: 'Shipping & Logistics', type: 'business_expense', flow: 'expense', parentId: 'cat-biz-1', color: '#4F46E5' },
  { id: 'sub-biz-ops', name: 'Store & Hosting', type: 'business_expense', flow: 'expense', parentId: 'cat-biz-1', color: '#475569' },

  // === Sub Categories: Income ===
  { id: 'sub-inc-salary', name: 'Salary & Bonus', type: 'personal_income', flow: 'income', parentId: 'cat-inc-1', color: '#16A34A' },
  { id: 'sub-inc-freelance', name: 'Freelance Projects', type: 'personal_income', flow: 'income', parentId: 'cat-inc-1', color: '#2563EB' },
  { id: 'sub-inc-affiliate', name: 'Affiliate Commissions', type: 'personal_income', flow: 'income', parentId: 'cat-inc-1', color: '#0D9488' },
  { id: 'sub-inc-invest', name: 'Investments & Dividends', type: 'personal_income', flow: 'income', parentId: 'cat-inc-1', color: '#7C3AED' },

  // === Sub Categories: Toys & Figures ===
  { id: 'sub-toy-tf', name: 'Transformers', type: 'universal', flow: 'expense', parentId: 'cat-prod-1', color: '#2563EB' },
  { id: 'sub-toy-gundam', name: 'Gundam / Model Kit', type: 'universal', flow: 'expense', parentId: 'cat-prod-1', color: '#3B82F6' },
  { id: 'sub-toy-fig', name: 'Action Figures', type: 'universal', flow: 'expense', parentId: 'cat-prod-1', color: '#60A5FA' },
  { id: 'sub-toy-vintage', name: 'Vintage & Diecast', type: 'universal', flow: 'expense', parentId: 'cat-prod-1', color: '#EC4899' },

  // === Sub Categories: Electronics ===
  { id: 'sub-elec-audio', name: 'Audio & Headphones', type: 'universal', flow: 'expense', parentId: 'cat-prod-2', color: '#7C3AED' },
  { id: 'sub-elec-gaming', name: 'Gaming Consoles', type: 'universal', flow: 'expense', parentId: 'cat-prod-2', color: '#8B5CF6' },
  { id: 'sub-elec-gadget', name: 'Gadgets & Accessories', type: 'universal', flow: 'expense', parentId: 'cat-prod-2', color: '#A78BFA' },

  // === Sub Categories: Supplies & Assets ===
  { id: 'sub-sup-pack', name: 'Packing Materials', type: 'product', flow: 'expense', parentId: 'cat-prod-4', color: '#0D9488' },
  { id: 'sub-sup-vehicle', name: 'Vehicles', type: 'product', flow: 'expense', parentId: 'cat-prod-4', color: '#6366F1' },
  { id: 'sub-sup-prop', name: 'Property & Gear', type: 'product', flow: 'expense', parentId: 'cat-prod-4', color: '#14B8A6' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'PT Hobby Toys Indonesia',
    contactPerson: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi@hobbytoys.co.id',
    address: 'Jl. Mangga Dua Raya No. 45, Jakarta Utara',
    notes: 'Official Distributor Bandai & Good Smile Company',
    createdAt: '2026-01-01',
  },
  {
    id: 'sup-2',
    name: 'Shenzhen Direct Logistics',
    contactPerson: 'Mr. Zhang',
    phone: '+86 138 0013 8000',
    email: 'zhang@szdirect.cn',
    address: 'Huaqiangbei, Futian District, Shenzhen, China',
    notes: 'Forwarder cargo air/sea for electronic accessories',
    createdAt: '2026-01-01',
  },
  {
    id: 'sup-3',
    name: 'CV Packindo Jaya',
    contactPerson: 'Siti Rahma',
    phone: '085678901234',
    email: 'order@packindo.com',
    address: 'Kawasan Industri Cikarang Blok B2, Bekasi',
    notes: 'Bubble wrap, thermal shipping labels & cardboard mailer boxes supplier',
    createdAt: '2026-01-01',
  },
];
