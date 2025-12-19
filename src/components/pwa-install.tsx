"use client";

import * as React from "react";
import { Download, X, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detect iOS
function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// Detect if in standalone mode
function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || 
         (window.navigator as any).standalone === true;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [isIOSDevice, setIsIOSDevice] = React.useState(false);

  React.useEffect(() => {
    // Check if already installed
    if (isStandalone()) {
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 3 days
      if (Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Check iOS
    const ios = isIOS();
    setIsIOSDevice(ios);

    // For iOS, show banner after delay
    if (ios) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after small delay
      setTimeout(() => setShowInstallBanner(true), 2000);
    };

    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Fallback: show banner after 5 seconds if no prompt event
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt) {
        // Check if it's a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && !isStandalone()) {
          setShowInstallBanner(true);
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showInstallBanner) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md",
        "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
        "rounded-xl shadow-2xl p-4",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-lg shrink-0">
          <Download className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Install iSubrek</h3>
          {isIOSDevice ? (
            <>
              <p className="text-xs text-white/80 mt-0.5">
                Tap <Share className="inline h-3 w-3 mx-0.5" /> lalu pilih &quot;Add to Home Screen&quot;
              </p>
            </>
          ) : deferredPrompt ? (
            <>
              <p className="text-xs text-white/80 mt-0.5">
                Install app untuk akses cepat
              </p>
              <Button
                onClick={handleInstall}
                size="sm"
                className="mt-3 bg-white text-indigo-600 hover:bg-white/90 font-medium"
              >
                Install Sekarang
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-white/80 mt-0.5">
                Tap <MoreVertical className="inline h-3 w-3 mx-0.5" /> lalu pilih &quot;Install app&quot; atau &quot;Add to Home screen&quot;
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
