'use client';

import React from 'react';
import { 
  FolderOpen, 
  Loader2, 
  AlertOctagon, 
  SearchX, 
  ShieldAlert, 
  ClockAlert, 
  CheckCircle2, 
  RefreshCw,
  LogIn,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// 1. EMPTY STATE
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <FolderOpen className="size-8 text-muted-foreground/60" />,
  title = 'No Data Saved Yet',
  description = 'This section is currently empty. Add your first record to begin viewing data here.',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/80 rounded-xl bg-muted/15 space-y-3 ${className}`}>
      <div className="p-3 rounded-full bg-muted/50 text-muted-foreground">{icon}</div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

// 2. LOADING STATE
export interface LoadingStateProps {
  message?: string;
  type?: 'spinner' | 'skeleton_card' | 'skeleton_table';
  count?: number;
}

export function LoadingState({
  message = 'Loading data...',
  type = 'spinner',
  count = 3,
}: LoadingStateProps) {
  if (type === 'skeleton_card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
            <div className="pt-3 border-t border-border/40 flex justify-between items-center">
              <div className="h-3 w-12 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'skeleton_table') {
    return (
      <div className="border border-border/60 rounded-xl bg-card overflow-hidden animate-pulse">
        <div className="h-10 bg-muted/40 border-b border-border/40 flex items-center px-4 gap-4">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded ml-auto" />
        </div>
        <div className="divide-y divide-border/30">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-3.5 w-28 bg-muted rounded" />
              <div className="h-3.5 w-48 bg-muted rounded" />
              <div className="h-3.5 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center space-y-3">
      <Loader2 className="size-6 text-primary animate-spin" />
      <p className="text-xs font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

// 3. ERROR STATE
export interface ErrorStateProps {
  title?: string;
  description?: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to Load Data',
  description = 'A system error occurred while retrieving information. Please try again shortly.',
  errorCode = 'ERR_INTERNAL_500',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-rose-500/20 bg-rose-500/5 rounded-xl space-y-3 ${className}`}>
      <div className="p-3 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <AlertOctagon className="size-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        {errorCode && (
          <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
            Code: {errorCode}
          </span>
        )}
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="text-xs h-8 gap-1.5 mt-2">
          <RefreshCw className="size-3.5" />
          <span>Retry Operation</span>
        </Button>
      )}
    </div>
  );
}

// 4. NO SEARCH RESULT STATE
export interface NoSearchResultStateProps {
  query: string;
  onReset?: () => void;
  className?: string;
}

export function NoSearchResultState({ query, onReset, className = '' }: NoSearchResultStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/80 rounded-xl bg-card/40 space-y-3 ${className}`}>
      <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
        <SearchX className="size-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">No Results Found</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          No records matched your search query <b className="text-foreground">&quot;{query}&quot;</b>.
          Check your spelling or try alternative keywords.
        </p>
      </div>
      {onReset && (
        <Button onClick={onReset} variant="outline" size="sm" className="text-xs h-8 gap-1.5 mt-1">
          <RotateCcw className="size-3.5" />
          <span>Reset Search</span>
        </Button>
      )}
    </div>
  );
}

// 5. PERMISSION DENIED STATE
export interface PermissionDeniedProps {
  title?: string;
  description?: string;
  onRequestAccess?: () => void;
  className?: string;
}

export function PermissionDeniedState({
  title = 'Access Denied (403)',
  description = 'You do not have the required permissions to view or edit this module.',
  onRequestAccess,
  className = '',
}: PermissionDeniedProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-3 ${className}`}>
      <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <ShieldAlert className="size-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {onRequestAccess && (
        <Button onClick={onRequestAccess} size="sm" className="text-xs h-8 mt-2 bg-amber-600 hover:bg-amber-700 text-white font-medium">
          Request Access
        </Button>
      )}
    </div>
  );
}

// 6. SESSION EXPIRED STATE
export interface SessionExpiredProps {
  onLogin?: () => void;
  className?: string;
}

export function SessionExpiredState({ onLogin, className = '' }: SessionExpiredProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-border bg-card rounded-xl shadow-xs space-y-3 ${className}`}>
      <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <ClockAlert className="size-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">Session Expired</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your active session has expired for data protection. Please re-authenticate to continue your work.
        </p>
      </div>
      <Button
        onClick={onLogin || (() => window.location.reload())}
        size="sm"
        className="text-xs h-8 gap-1.5 mt-2 bg-primary text-primary-foreground font-medium"
      >
        <LogIn className="size-3.5" />
        <span>Log In Again</span>
      </Button>
    </div>
  );
}

// 7. SUCCESS STATE
export interface SuccessStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SuccessState({
  title = 'Operation Completed Successfully',
  description = 'Your transaction data has been validated and persisted to local storage.',
  action,
  className = '',
}: SuccessStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-emerald-500/20 bg-emerald-500/5 rounded-xl space-y-3 ${className}`}>
      <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
