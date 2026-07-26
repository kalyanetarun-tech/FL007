import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, inr } from "@/lib/api";

export default function PrintBill() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    api.get(`/bills/${id}`).then((r) => setBill(r.data));
    api.get("/settings").then((r) => setSettings(r.data));
  }, [id]);
  useEffect(() => { if (bill && settings) setTimeout(() => window.print(), 400); }, [bill, settings]);
  if (!bill) return <div className="p-8 text-sm">Loading…</div>;
  const park = settings?.park_name || "Funland Adventure Park";
  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0 font-sans">
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body { background: white; }
        }
      `}</style>
      <div className="mx-auto" style={{ maxWidth: "80mm", fontFamily: "'Courier New', monospace" }}>
        <div className="text-center mb-3">
          <div className="text-xl font-black">{park}</div>
          {settings?.address && <div className="text-[11px]">{settings.address}</div>}
          {settings?.phone && <div className="text-[11px]">Ph: {settings.phone}</div>}
        </div>
        <div className="text-[11px] border-t border-b border-dashed border-black py-1 mb-2">
          <div className="flex justify-between"><span>Bill:</span><span className="font-bold">{bill.bill_no}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{new Date(bill.created_at).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Staff:</span><span>{bill.created_by_name}</span></div>
        </div>
        <div className="text-[11px] mb-2">
          <div><b>Customer:</b> {bill.customer_name}</div>
          {bill.customer_phone && <div>{bill.customer_phone}</div>}
        </div>
        <table className="w-full text-[11px] mb-2">
          <thead><tr className="border-t border-b border-dashed border-black">
            <th className="text-left py-1">Item</th><th className="text-right">Qty</th><th className="text-right">Amt</th></tr></thead>
          <tbody>
            {bill.items.map((it, i) => (
              <tr key={i}>
                <td className="py-0.5">{it.name}<div className="text-[9px] uppercase text-gray-500">{it.kind}</div></td>
                <td className="text-right align-top">{it.qty}</td>
                <td className="text-right align-top">{(it.price * it.qty).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-dashed border-black pt-1 text-[11px] space-y-0.5">
          <div className="flex justify-between"><span>Subtotal:</span><span>{inr(bill.subtotal)}</span></div>
          {bill.discount > 0 && <div className="flex justify-between"><span>Discount:</span><span>-{inr(bill.discount)}</span></div>}
          {bill.gst_amount > 0 && <div className="flex justify-between"><span>GST ({bill.gst_percent}%):</span><span>{inr(bill.gst_amount)}</span></div>}
          <div className="flex justify-between text-base font-black border-t border-dashed border-black pt-1"><span>TOTAL:</span><span>{inr(bill.total)}</span></div>
          <div className="flex justify-between"><span>Payment:</span><span>{bill.payment_method.toUpperCase()} - {bill.payment_status.toUpperCase()}</span></div>
        </div>
        <div className="text-center text-[10px] mt-3 border-t border-dashed border-black pt-2">
          Thank you for visiting!<br/>Visit again 🎡
        </div>
      </div>
    </div>
  );
}
