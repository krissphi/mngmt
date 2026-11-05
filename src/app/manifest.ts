import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'mngmt — Personal Finance & Business Management',
    short_name: 'mngmt',
    description: 'Integrated personal wealth, business inventory, sales, and purchasing management system.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#090a0f',
    theme_color: '#090a0f',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View overall financial and business health',
        url: '/',
      },
      {
        name: 'Personal Finance',
        short_name: 'Personal',
        description: 'Manage accounts, budgets, and savings',
        url: '/personal',
      },
      {
        name: 'Business & Inventory',
        short_name: 'Business',
        description: 'Manage products, stock movements, and sales',
        url: '/business',
      },
      {
        name: 'Balance Sheet',
        short_name: 'Ledger',
        description: 'View general ledger and balance sheet',
        url: '/finance',
      },
    ],
  };
}

