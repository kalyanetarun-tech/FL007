import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api, inr } from "@/lib/api";
import QRCode from "react-qr-code";
import UpiPayBlock from "@/components/UpiPayBlock";

export default function PrintBill() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const mode = sp.get("mode") === "receipt" ? "receipt" : "invoice";  // receipt hides GST, invoice shows full
  const [bill, setBill] = useState(null);
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    api.get(`/bills/${id}`).then((r) => setBill(r.data)).catch(() => {});
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, [id]);
  useEffect(() => { if (bill && settings) setTimeout(() => window.print(), 400); }, [bill, settings]);
  if (!bill) return <div className="p-8 text-sm">Loading…</div>;
  const park = settings?.firm_name || settings?.park_name || "Funland Adventure Park";
  const items = bill.items || [];
  const breakup = bill.gst_breakup || [];
  const isInter = !!bill.is_interstate;
  const firmGstin = settings?.firm_gstin || "";
  const isReceipt = mode === "receipt";
  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0 font-sans" data-testid="print-bill-root" data-mode={mode}>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 3mm; }
          body { background: white; }
        }
      `}</style>
      <div className="mx-auto" style={{ maxWidth: "80mm", fontFamily: "'Courier New', monospace" }}>
        {firmGstin && !isReceipt ? (
          <div className="text-center text-[10px] font-black uppercase tracking-widest border-b border-dashed border-black pb-1 mb-1">
            Tax Invoice
          </div>
        ) : isReceipt ? (
          <div className="text-center text-[10px] font-black uppercase tracking-widest border-b border-dashed border-black pb-1 mb-1">
            Customer Receipt
          </div>
        ) : null}
        <div className="text-center mb-3">
          <div className="text-xl font-black">{park}</div>
          {settings?.address && <div className="text-[11px]">{settings.address}</div>}
          {settings?.phone && <div className="text-[11px]">Ph: {settings.phone}</div>}
          {firmGstin && !isReceipt && <div className="text-[10px]"><b>GSTIN:</b> {firmGstin}</div>}
          {settings?.firm_fssai && !isReceipt && <div className="text-[10px]">FSSAI: {settings.firm_fssai}</div>}
        </div>
        <div className="text-[11px] border-t border-b border-dashed border-black py-1 mb-2">
          <div className="flex justify-between"><span>Bill:</span><span className="font-bold">{bill.bill_no}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{new Date(bill.created_at).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Staff:</span><span>{bill.created_by_name}</span></div>
        </div>
        <div className="text-[11px] mb-2">
          <div><b>Customer:</b> {bill.customer_name}</div>
          {bill.customer_phone && <div>Ph: {bill.customer_phone}</div>}
          {bill.customer_gstin && !isReceipt && <div data-testid="print-cust-gstin"><b>GSTIN:</b> {bill.customer_gstin}</div>}
          {bill.customer_state_code && !isReceipt && <div>State: {bill.customer_state_code}{isInter ? " (Inter-state)" : " (Intra-state)"}</div>}
        </div>
        <table className="w-full text-[10px] mb-2" data-testid="print-items">
          <thead><tr className="border-t border-b border-dashed border-black">
            <th className="text-left py-1">Item{!isReceipt ? " / HSN" : ""}</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Rate</th>
            {!isReceipt && <th className="text-right">GST%</th>}
            <th className="text-right">Amt</th>
          </tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td className="py-0.5 align-top">
                  <div className="font-bold leading-tight">{it.name}</div>
                  {!isReceipt && <div className="text-[8px] uppercase text-gray-600">{it.category || it.kind}{it.hsn_code ? ` · HSN ${it.hsn_code}` : ""}</div>}
                </td>
                <td className="text-right align-top">{it.qty}</td>
                <td className="text-right align-top">{(it.price || 0).toFixed(0)}</td>
                {!isReceipt && <td className="text-right align-top">{it.gst_percent || 0}%</td>}
                <td className="text-right align-top">{((it.price || 0) * (it.qty || 0)).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-dashed border-black pt-1 text-[11px] space-y-0.5">
          <div className="flex justify-between"><span>Subtotal:</span><span>{inr(bill.subtotal)}</span></div>
          {(bill.discount || 0) > 0 && <div className="flex justify-between"><span>Discount{bill.discount_percent ? ` (${bill.discount_percent}%)` : ""}:</span><span>-{inr(bill.discount)}</span></div>}
          {breakup.length > 0 && !isReceipt ? (
            <div className="border-t border-dashed border-black pt-1 mt-1" data-testid="print-gst-breakup">
              <div className="text-[10px] font-black uppercase tracking-wider text-center mb-1">GST Breakup</div>
              <table className="w-full text-[10px]">
                <thead><tr>
                  <th className="text-left">Rate</th>
                  <th className="text-right">Taxable</th>
                  {isInter ? (
                    <th className="text-right">IGST</th>
                  ) : (
                    <>
                      <th className="text-right">CGST</th>
                      <th className="text-right">SGST</th>
                    </>
                  )}
                </tr></thead>
                <tbody>
                  {breakup.map((b, i) => (
                    <tr key={i}>
                      <td>{b.rate}%</td>
                      <td className="text-right">{inr(b.taxable)}</td>
                      {isInter ? (
                        <td className="text-right">{inr(b.igst)}</td>
                      ) : (
                        <>
                          <td className="text-right">{inr(b.cgst)}</td>
                          <td className="text-right">{inr(b.sgst)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between mt-1"><span>Total GST:</span><span>{inr(bill.gst_amount)}</span></div>
            </div>
          ) : (
            !isReceipt && (bill.gst_amount || 0) > 0 && <div className="flex justify-between"><span>GST ({bill.gst_percent}%):</span><span>{inr(bill.gst_amount)}</span></div>
          )}
          <div className="flex justify-between text-base font-black border-t border-dashed border-black pt-1"><span>TOTAL:</span><span>{inr(bill.total)}</span></div>
          <div className="flex justify-between"><span>Payment:</span><span>{bill.payment_method.toUpperCase()} - {bill.payment_status.toUpperCase()}</span></div>
        </div>
        <div className="text-center text-[10px] mt-3 border-t border-dashed border-black pt-2">
          Thank you for visiting!<br/>Visit again 🎡
        </div>
        {(settings?.upi_qr_url || settings?.upi_id) && bill.payment_status !== "paid" && (
          <UpiPayBlock settings={settings} amount={bill.total} note={`Bill ${bill.bill_no}`} variant="print" />
        )}
        {settings?.google_review_url && (
          <div className="mt-3 border-t border-dashed border-black pt-2 text-center">
            <div className="text-[10px] font-bold mb-1">⭐ Rate us on Google ⭐</div>
            <div className="inline-block p-1 bg-white">
              <QRCode value={settings.google_review_url} size={100} />
            </div>
            <div className="text-[8px] mt-1">Scan karke feedback do</div>
          </div>
        )}
      </div>
    </div>
  );
}
