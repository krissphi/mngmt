"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  installApp: () => Promise<boolean>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  isOffline: false,
  installApp: async () => false,
});

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true
    );
  });
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return !navigator.onLine;
  });
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // New content is available
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn("[PWA] Service worker registration failed:", error);
          });
      });
    }

    // 2. Check standalone media query changes & online/offline listeners
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(display-mode: standalone)");
      const handleMediaChange = (e: MediaQueryListEvent) =>
        setIsInstalled(e.matches);
      mediaQuery.addEventListener("change", handleMediaChange);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // 3. Capture PWA install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        const dismissed = sessionStorage.getItem("arkaos_pwa_banner_dismissed");
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      window.addEventListener("appinstalled", () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      });

      return () => {
        mediaQuery.removeEventListener("change", handleMediaChange);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt,
        );
      };
    }
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setShowInstallBanner(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("arkaos_pwa_banner_dismissed", "true");
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt),
        isInstalled,
        isOffline,
        installApp,
      }}
    >
      {children}

      {/* Subtle PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border/80 bg-card/95 p-3.5 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-3 text-xs">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt="mngmt"
              className="size-10 rounded-lg shrink-0 border border-border/50"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground">
                Install mngmt App
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Install as a standalone app on your device for instant offline
                access and faster loading.
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <Button
                  size="sm"
                  className="h-7 text-xs px-3 bg-primary text-primary-foreground font-medium"
                  onClick={installApp}
                >
                  <Download className="size-3 mr-1" />
                  Install Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2 text-muted-foreground"
                  onClick={dismissBanner}
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
