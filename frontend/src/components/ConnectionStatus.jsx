import React, { useEffect, useState } from "react";
import { WifiOff, Wifi, ServerOff } from "lucide-react";
import { onBackendStatusChange } from "@/lib/reliability";

export default function ConnectionStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [backendOk, setBackendOk] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 2500);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const unsub = onBackendStatusChange((ok) => {
      setBackendOk(ok);
      if (ok) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 2500);
      }
    });
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      unsub();
    };
  }, []);

  const allGood = online && backendOk;
  if (allGood && !showReconnected) return null;

  let text, icon, tint;
  if (!online) { text = "Offline — reconnecting…"; icon = <WifiOff className="h-4 w-4" />; tint = "bg-destructive text-destructive-foreground"; }
  else if (!backendOk) { text = "Server reconnect ho raha hai…"; icon = <ServerOff className="h-4 w-4" />; tint = "bg-primary text-primary-foreground"; }
  else { text = "Wapas connected"; icon = <Wifi className="h-4 w-4" />; tint = "bg-emerald-500 text-white"; }

  return (
    <div data-testid="conn-banner" className={`fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-fade-in-up ${tint}`}>
      {icon} {text}
    </div>
  );
}
