'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function BusinessRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'assets') {
      router.replace('/collection');
    } else {
      router.replace('/seller');
    }
  }, [searchParams, router]);

  return <div className="p-8 text-xs text-muted-foreground">Redirecting to Seller...</div>;
}

export default function BusinessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Redirecting...</div>}>
      <BusinessRedirect />
    </Suspense>
  );
}
