'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => (typeof window !== 'undefined' ? navigator.onLine : true));
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const nav = navigator as unknown as { connection?: { effectiveType?: string; rtt?: number; addEventListener?: (ev: string, cb: () => void) => void } };
    if (nav.connection) {
      const checkSpeed = () => {
        const slow = nav.connection?.effectiveType === '2g' || (nav.connection?.rtt ? nav.connection.rtt > 1000 : false);
        setIsSlow(!!slow);
      };
      checkSpeed();
      nav.connection.addEventListener?.('change', checkSpeed);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSlow, setIsOnline, setIsSlow };
}

// 8. NO INTERNET BANNER / STATE
export function NoInternetBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 py-2 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <WifiOff className="size-4 shrink-0 animate-pulse text-rose-600 dark:text-rose-400" />
        <span>
          <b>Connection Lost (Offline Mode).</b> mngmt continues working locally, and your changes are saved in the browser.
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline font-medium hover:text-foreground shrink-0 ml-2"
        >
          Check Connection
        </button>
      )}
    </div>
  );
}

export function NoInternetState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-rose-500/20 bg-rose-500/5 rounded-xl space-y-3">
      <div className="p-3 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <WifiOff className="size-8" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">No Internet Connection</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your device is currently disconnected from the network. Check your Wi-Fi or cellular connection to synchronize external data.
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="text-xs h-8 gap-1.5 mt-2">
          <RefreshCw className="size-3.5" />
          <span>Retry Connection</span>
        </Button>
      )}
    </div>
  );
}

// 9. SLOW NETWORK STATE / ALERT
export function SlowNetworkAlert({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <Wifi className="size-4 shrink-0 text-amber-600 dark:text-amber-400 animate-bounce" />
        <span>
          <b>Slow Internet Connection.</b> Network latency is elevated; remote asset loading may take longer than usual.
        </span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xs text-muted-foreground hover:text-foreground shrink-0 ml-2"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export function SlowNetworkState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-3">
      <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="size-8" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">Network Speed is Degraded</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your network connection is experiencing severe latency. Operations might require extra processing time.
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="text-xs h-8 gap-1.5 mt-2">
          <RefreshCw className="size-3.5" />
          <span>Refresh Network</span>
        </Button>
      )}
    </div>
  );
}
