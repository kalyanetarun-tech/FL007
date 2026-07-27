import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export default function Settings() {
  const [form, setForm] = useState({ park_name: "", gst_rate: 0, upi_qr_url: "", upi_id: "", phone: "", address: "", google_review_url: "", google_reviews_shown: 0, google_rating: 0, firm_name: "", firm_gstin: "", firm_state_code: "23", firm_pan: "", firm_fssai: "", invoice_prefix: "" });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get("/settings").then((r) => setForm((f) => ({ ...f, ...r.data }))).catch(() => {});
    api.get("/integrations/status").then((r) => setStatus(r.data));
  }, []);

  const save = async () => {
    try {
      await api.patch("/settings", {
        ...form,
        gst_rate: +form.gst_rate || 0,
        google_reviews_shown: +form.google_reviews_shown || 0,
        google_rating: +form.google_rating || 0,
      });
      toast.success("Settings saved");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  return (
    <div>
      <PageHead title="Settings" subtitle="Park info, GST aur UPI QR code" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Park Info</div>
          <div className="space-y-4">
            <div><Label>Park Name</Label><Input data-testid="set-park" value={form.park_name || ""} onChange={(e) => setForm({ ...form, park_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input data-testid="set-phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Address</Label><Textarea data-testid="set-addr" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Default GST %</Label><Input type="number" data-testid="set-gst" value={form.gst_rate || 0} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} /></div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Payment QR (GPay / Paytm / UPI)</div>
          <div className="space-y-4">
            <div><Label>UPI QR Image URL</Label><Input data-testid="set-qr" value={form.upi_qr_url || ""} onChange={(e) => setForm({ ...form, upi_qr_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>UPI ID (optional)</Label><Input data-testid="set-upi-id" value={form.upi_id || ""} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} placeholder="funland@paytm" /></div>
            {form.upi_qr_url && <img src={form.upi_qr_url} alt="QR" className="max-w-[240px] rounded-xl border border-border" />}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Google Reviews</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <Label>Google Review Link</Label>
                <Input data-testid="set-gmap-url" value={form.google_review_url || ""} onChange={(e) => setForm({ ...form, google_review_url: e.target.value })} placeholder="https://g.page/r/CXXXXXXXX/review" />
                <div className="text-xs text-muted-foreground mt-1">Google Business Profile → "Get more reviews" → copy link</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Total Reviews</Label>
                  <Input type="number" min={0} data-testid="set-greview-count" value={form.google_reviews_shown || 0} onChange={(e) => setForm({ ...form, google_reviews_shown: e.target.value })} />
                </div>
                <div>
                  <Label>Star Rating</Label>
                  <Input type="number" step="0.1" min={0} max={5} data-testid="set-grating" value={form.google_rating || 0} onChange={(e) => setForm({ ...form, google_rating: e.target.value })} placeholder="4.6" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              {form.google_review_url ? (
                <>
                  <div className="p-2 bg-white rounded-xl border border-border">
                    <QRCode value={form.google_review_url} size={140} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2 text-center">This QR bill par bhi print hoga</div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground text-center">Link daalte hi QR yahaan generate ho jayega</div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl lg:col-span-2" data-testid="gst-firm-card">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">GST / Tax Invoice details (Indian compliance)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Legal / Firm Name</Label>
              <Input data-testid="set-firm-name" value={form.firm_name || ""} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} placeholder="M/s Funland Adventure Park" />
              <div className="text-xs text-muted-foreground mt-1">Tax invoice pe yahi naam print hoga</div>
            </div>
            <div>
              <Label>Firm GSTIN</Label>
              <Input data-testid="set-firm-gstin" value={form.firm_gstin || ""} onChange={(e) => setForm({ ...form, firm_gstin: e.target.value.toUpperCase() })} placeholder="23ABCDE1234F1Z5" maxLength={15} />
            </div>
            <div>
              <Label>State code (2-digit)</Label>
              <Input data-testid="set-firm-state" value={form.firm_state_code || ""} onChange={(e) => setForm({ ...form, firm_state_code: e.target.value })} placeholder="23 (MP)" maxLength={2} />
              <div className="text-xs text-muted-foreground mt-1">Same as customer = CGST+SGST · Different = IGST</div>
            </div>
            <div>
              <Label>PAN</Label>
              <Input data-testid="set-firm-pan" value={form.firm_pan || ""} onChange={(e) => setForm({ ...form, firm_pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} />
            </div>
            <div>
              <Label>FSSAI (for food)</Label>
              <Input data-testid="set-firm-fssai" value={form.firm_fssai || ""} onChange={(e) => setForm({ ...form, firm_fssai: e.target.value })} placeholder="14-digit FSSAI number" maxLength={14} />
            </div>
            <div>
              <Label>Invoice prefix (optional)</Label>
              <Input data-testid="set-inv-prefix" value={form.invoice_prefix || ""} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} placeholder="FL/24-25/" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl lg:col-span-2" data-testid="integration-status-card">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Integration Status</div>
          {status ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <IntRow name="Razorpay Payment Links" ok={status.razorpay} help="Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in backend .env" />
              <IntRow name="Twilio SMS" ok={status.twilio_sms} help="Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM" />
              <IntRow name="Twilio WhatsApp" ok={status.twilio_whatsapp} help="Set TWILIO_WHATSAPP_FROM (in addition to SID/TOKEN)" />
              <IntRow name="Resend Email" ok={status.resend} help="Set RESEND_API_KEY" />
            </div>
          ) : <div className="text-sm text-muted-foreground">Loading…</div>}
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button data-testid="set-save" onClick={save} className="rounded-full h-12 px-8 bg-accent hover:bg-accent/90 font-black">Save Settings</Button>
      </div>
    </div>
  );
}

function IntRow({ name, ok, help }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-white flex items-start gap-3">
      {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
      <div className="flex-1">
        <div className="font-bold">{name}</div>
        <div className="text-xs text-muted-foreground mt-1">{ok ? "Configured ✓" : help}</div>
      </div>
    </div>
  );
}
