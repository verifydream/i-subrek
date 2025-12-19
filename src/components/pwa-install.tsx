"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showInstallBanner) return null;

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
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-lg shrink-0">
          <Download className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Install iSubrek</h3>
          <p className="text-xs text-white/80 mt-0.5">
            Install app untuk akses cepat dan pengalaman lebih baik
          </p>
          <Button
            onClick={handleInstall}
            size="sm"
            className="mt-3 bg-white text-indigo-600 hover:bg-white/90 font-medium"
          >
            Install Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
