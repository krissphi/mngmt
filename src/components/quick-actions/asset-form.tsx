'use client';

import React from 'react';
import { AssetFormSection } from '@/components/assets/asset-form';

interface AssetFormProps {
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}

export function AssetForm({ onSuccess, onCancel }: AssetFormProps) {
  return (
    <AssetFormSection
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      onSuccess={onSuccess}
      embedded
    />
  );
}
