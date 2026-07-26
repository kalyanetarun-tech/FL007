import React, { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function ConnectionStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
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
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online && !showReconnected) return null;

  return (
    <div data-testid="conn-banner" className={`fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 ${online ? "bg-emerald-500 text-white" : "bg-destructive text-destructive-foreground"}`}>
      {online ? <><Wifi className="h-4 w-4" /> Wapas connected</> : <><WifiOff className="h-4 w-4" /> Offline — reconnecting…</>}
    </div>
  );
}
