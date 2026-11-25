'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { AssetsTab } from '@/components/business/assets-tab';

export default function CollectionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection"
        description="Track your personal collectibles, figures, gadgets, and assets. You can transfer items directly into your Seller catalog whenever you are ready to sell."
      />

      <AssetsTab />
    </div>
  );
}
