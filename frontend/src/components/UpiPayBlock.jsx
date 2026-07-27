import React from "react";
import { QrCode as QrIcon, Copy, IndianRupee } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

/**
 * UpiPayBlock — a single reusable UPI/QR payment card.
 * Renders the merchant's uploaded QR image if available, else generates a UPI intent QR live.
 * Props:
 *  - settings: {upi_id, upi_qr_url, park_name, firm_name, phone}
 *  - amount: number (optional — if given, encodes am= in UPI intent + shows amount)
 *  - variant: "full" (default) | "compact" | "print"
 *  - note: optional string appended to UPI intent tn= param (e.g. bill_no)
 */
export default function UpiPayBlock({ settings, amount = 0, variant = "full", note = "" }) {
  if (!settings) return null;
  const upiId = settings.upi_id;
  const qrUrl = settings.upi_qr_url;
  const payeeName = settings.firm_name || settings.park_name || "Funland";
  const phone = settings.phone;
  if (!upiId && !qrUrl) return null;

  // Build UPI intent URI (used as fallback QR + as clickable link on mobile)
  const upiIntent = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}` +
      (amount > 0 ? `&am=${Number(amount).toFixed(2)}` : "") +
      `&cu=INR` +
      (note ? `&tn=${encodeURIComponent(note.slice(0, 40))}` : "")
    : null;

  const copyUpi = async () => {
    if (!upiId) return;
    const ok = await copyToClipboard(upiId);
    ok ? toast.success("UPI ID copied") : toast.error("Copy failed");
  };

  const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  if (variant === "print") {
    // Optimised for 80mm thermal receipts — pure black/white, no shadows
    return (
      <div className="mt-3 border-t border-dashed border-black pt-2 text-center" data-testid="upi-pay-block-print">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Pay via UPI</div>
        <div className="inline-block p-1 bg-white">
          {qrUrl ? (
            <img src={qrUrl} alt="UPI QR" style={{ width: 120, height: 120, objectFit: "contain" }} />
          ) : upiIntent ? (
            <QRCode value={upiIntent} size={120} />
          ) : null}
        </div>
        {upiId && <div className="text-[10px] mt-1"><b>UPI:</b> {upiId}</div>}
        {payeeName && <div className="text-[10px]">{payeeName}</div>}
        {phone && <div className="text-[10px]">{phone}</div>}
        {amount > 0 && <div className="text-[11px] font-bold">Amount: {inr(amount)}</div>}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5" data-testid="upi-pay-block-compact">
        <div className="w-16 h-16 flex-shrink-0 bg-white p-1 rounded-lg border">
          {qrUrl ? (
            <img src={qrUrl} alt="UPI QR" className="w-full h-full object-contain" />
          ) : upiIntent ? (
            <QRCode value={upiIntent} size={56} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest font-bold text-secondary">UPI Payment</div>
          <div className="text-sm font-black truncate">{payeeName}</div>
          {upiId && (
            <button onClick={copyUpi} className="text-xs font-bold text-primary hover:underline flex items-center gap-1" data-testid="upi-copy-id">
              {upiId} <Copy className="h-3 w-3" />
            </button>
          )}
          {amount > 0 && <div className="text-xs font-bold flex items-center"><IndianRupee className="h-3 w-3" />{amount.toFixed(2)}</div>}
        </div>
      </div>
    );
  }

  // full
  return (
    <div className="p-5 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5" data-testid="upi-pay-block">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-secondary">Pay via UPI / QR</div>
          <div className="text-lg font-black">{payeeName}</div>
        </div>
        <QrIcon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-40 h-40 bg-white p-2 rounded-xl border shadow-sm flex-shrink-0">
          {qrUrl ? (
            <img src={qrUrl} alt="UPI QR" className="w-full h-full object-contain" data-testid="upi-qr-img" />
          ) : upiIntent ? (
            <QRCode value={upiIntent} size={144} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
          {upiId && (
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">UPI ID</div>
              <button onClick={copyUpi} className="text-base font-black text-primary hover:underline break-all flex items-center gap-1" data-testid="upi-id-btn">
                {upiId} <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
          {phone && (
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Phone</div>
              <div className="text-sm font-bold">{phone}</div>
            </div>
          )}
          {amount > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Amount</div>
              <div className="text-2xl font-black text-accent tabular-nums">{inr(amount)}</div>
            </div>
          )}
          {upiIntent && (
            <a href={upiIntent} className="inline-block text-xs font-black uppercase tracking-widest bg-accent text-accent-foreground rounded-full px-4 py-2 hover:bg-accent/90" data-testid="upi-open-app-btn">
              Open in UPI App
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
