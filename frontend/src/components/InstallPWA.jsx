import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, X } from "lucide-react";

/**
 * Prominent Install PWA button.
 * - On Android/Chrome: captures beforeinstallprompt and shows one-tap install
 * - On iOS Safari: shows "Share → Add to Home Screen" instructions
 * - Hides itself when already installed (running in standalone) or dismissed
 */
export default function InstallPWA() {
  const [deferred, setDeferred] = useState(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("funland_install_dismissed") === "1");

  useEffect(() => {
    // Detect already-installed (running from home screen)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isStandalone) { setInstalled(true); return; }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else if (isIOS) {
      setShowIOSHelp(true);
    } else {
      setShowIOSHelp(true); // Show generic manual instructions
    }
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("funland_install_dismissed", "1");
  };

  if (installed || dismissed) return null;

  return (
    <>
      <div data-testid="install-pwa-banner" className="fixed bottom-4 left-4 right-4 z-40 md:bottom-6 md:left-auto md:right-6 md:w-80 bg-white border-2 border-accent rounded-2xl shadow-xl p-4 flex items-start gap-3 animate-fade-in-up">
        <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm">Install Funland App</div>
          <div className="text-xs text-muted-foreground mb-3">Home screen pe icon banao — native app jaisa experience</div>
          <div className="flex gap-2">
            <Button data-testid="install-pwa-btn" onClick={install} className="rounded-full bg-accent hover:bg-accent/90 h-9 px-4 font-bold text-xs">
              <Download className="h-3.5 w-3.5 mr-1" /> Install
            </Button>
            <Button data-testid="install-pwa-later" onClick={dismiss} variant="ghost" className="rounded-full h-9 px-3 text-xs">Later</Button>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {showIOSHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowIOSHelp(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="h-6 w-6 text-accent" />
              <div className="font-black text-lg">Install manually</div>
            </div>
            {isIOS ? (
              <ol className="space-y-3 text-sm">
                <li><span className="font-bold text-accent">1.</span> Safari me neeche <b>Share</b> button (⬆️ arrow) tap karo</li>
                <li><span className="font-bold text-accent">2.</span> Scroll down → <b>"Add to Home Screen"</b> tap karo</li>
                <li><span className="font-bold text-accent">3.</span> <b>Add</b> confirm karo — home screen pe Funland icon aa jayega 🎡</li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm">
                <li><span className="font-bold text-accent">1.</span> Chrome me right-upar <b>⋮ (3 dots)</b> menu tap karo</li>
                <li><span className="font-bold text-accent">2.</span> <b>"Install app"</b> ya <b>"Add to Home Screen"</b> tap karo</li>
                <li><span className="font-bold text-accent">3.</span> <b>Install</b> confirm karo — home screen pe icon aa jayega 🎡</li>
              </ol>
            )}
            <Button onClick={() => setShowIOSHelp(false)} className="w-full mt-5 rounded-full bg-accent hover:bg-accent/90 font-bold">Got it</Button>
          </div>
        </div>
      )}
    </>
  );
}
