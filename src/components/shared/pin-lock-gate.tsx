'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const PIN_HASH_STORAGE_KEY = 'arkaos_pin_hash_v1';
export const PIN_UNLOCKED_SESSION_KEY = 'arkaos_pin_unlocked_v1';
const PIN_CHANGE_EVENT = 'arkaos-pin-state-change';

export function notifyPinStateChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PIN_CHANGE_EVENT));
  }
}

function subscribePinState(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(PIN_CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(PIN_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function getIsPinLockedSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const savedHash = localStorage.getItem(PIN_HASH_STORAGE_KEY);
    const unlocked = sessionStorage.getItem(PIN_UNLOCKED_SESSION_KEY) === 'true';
    return Boolean(savedHash) && !unlocked;
  } catch {
    return false;
  }
}

export function getHasPinSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem(PIN_HASH_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function useHasPin(): boolean {
  return useSyncExternalStore(subscribePinState, getHasPinSnapshot, () => false);
}

export async function hashPin(pin: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`mngmt_pin_${pin}`);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return btoa(`mngmt_pin_${pin}`);
}

export function PinLockGate({ children }: { children: React.ReactNode }) {
  const locked = useSyncExternalStore(subscribePinState, getIsPinLockedSnapshot, () => false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    try {
      const savedHash = localStorage.getItem(PIN_HASH_STORAGE_KEY);
      const enteredHash = await hashPin(pinInput.trim());
      if (savedHash && enteredHash === savedHash) {
        sessionStorage.setItem(PIN_UNLOCKED_SESSION_KEY, 'true');
        notifyPinStateChange();
        setPinInput('');
        setError('');
      } else {
        setError('Incorrect PIN. Please try again.');
      }
    } catch {
      setError('Failed to verify PIN.');
    }
  };

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-6 shadow-2xl space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Lock className="size-6" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">mngmt Locked</h1>
          <p className="text-xs text-muted-foreground">
            Enter your local security PIN to access your financial records.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Enter PIN..."
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setError('');
            }}
            autoFocus
            className="text-center tracking-[0.4em] font-mono text-base h-10"
          />

          {error && (
            <div className="text-xs text-rose-500 flex items-center justify-center gap-1.5">
              <AlertCircle className="size-3.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full h-9 text-xs font-medium gap-1.5">
            <ShieldCheck className="size-4" />
            <span>Unlock Workspace</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
