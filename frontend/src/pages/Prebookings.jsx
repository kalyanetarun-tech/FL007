import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate } from "react-router-dom";
import { api, fmtErr, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { Calendar, Users, ExternalLink, Copy, Send, CheckCircle2, ArrowRight, MessageCircle, Mail, Phone } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-primary/20 text-accent border-primary",
  confirmed: "bg-secondary/20 text-secondary border-secondary",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  arrived: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function Prebookings() {
  const nav = useNavigate();
  const { isAdmin } = useAuth();
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState("whatsapp");
  const backend = process.env.REACT_APP_BACKEND_URL;

  const load = () => api.get("/prebookings").then((r) => setList(r.data)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try { await api.patch(`/prebookings/${id}/status`, { status }); toast.success(`Marked ${status}`); if (detail?.id === id) setDetail({ ...detail, status }); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const convert = async (id) => {
    try {
      const { data } = await api.post(`/prebookings/${id}/convert`);
      toast.success(`Bill ${data.bill_no} created`);
      setDetail(null); load();
      // Redirect directly to the newly-created bill
      const billId = data.bill_id || data.id || data.converted_bill_id;
      if (billId) nav(`/bills/${billId}`);
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const send = async () => {
    try {
      const { data } = await api.post(`/prebook/${detail.id}/send`, { channel: sendChannel });
      toast.success(data?.delivery?.simulated ? `Simulated ${sendChannel} send` : `Sent via ${sendChannel}`);
      setSendOpen(false);
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const doCopy = async (text, label) => {
    const ok = await copyToClipboard(text);
    if (ok) toast.success(`${label} copied`); else toast.info("Manual copy fallback shown");
  };

  const bookingUrl = detail ? `${window.location.origin}/book/${detail.booking_no}` : "";
  const publicLink = `${window.location.origin}/book`;

  const filtered = filter === "all" ? (list || []) : (list || []).filter((b) => b.status === filter);
  const isLoading = list === null;

  return (
    <div>
      <PageHead
        title="Prebookings"
        subtitle="Online bookings — payment link + QR ke saath"
        action={
          <div className="flex gap-2">
            <Button data-testid="copy-public-link" onClick={() => doCopy(publicLink, "Public link")} variant="outline" className="rounded-full h-11 px-5 font-bold"><Copy className="h-4 w-4 mr-1" /> Copy Booking Link</Button>
            <a href={publicLink} target="_blank" rel="noreferrer"><Button data-testid="open-public-link" className="rounded-full h-11 px-5 font-bold bg-accent hover:bg-accent/90"><ExternalLink className="h-4 w-4 mr-1" /> Open Booking Page</Button></a>
          </div>
        }
      />

      <div className="p-4 bg-primary/10 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-1">Public Booking URL</div>
          <code data-testid="public-url" className="text-xs md:text-sm break-all font-bold">{publicLink}</code>
        </div>
        <div className="text-xs text-muted-foreground">Ise WhatsApp / Instagram / Facebook bio me daal do — customers direct book kar sakte hain</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "confirmed", "paid", "arrived", "cancelled"].map((s) => (
          <button key={s} data-testid={`pbk-filter-${s}`} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${filter === s ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>
            {s} {s !== "all" && `(${(list || []).filter((b) => b.status === s).length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <Card key={i} className="p-5 rounded-2xl h-52 animate-pulse bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No prebookings yet" description="Public link share karo — customers direct book karenge yahan." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((b) => (
            <Card key={b.id} data-testid={`pbk-card-${b.id}`} className="p-5 rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetail(b)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{b.booking_no}</div>
                  <div className="font-black text-lg mt-1">{b.customer_name}</div>
                </div>
                <Badge className={`rounded-full border ${STATUS_COLORS[b.status]}`}>{b.status}</Badge>
              </div>
              <div className="text-sm space-y-1 mb-3">
                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {b.booking_date} {b.booking_time}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {b.pax} pax · {b.items?.length || 0} items</div>
                <div className="text-muted-foreground">{b.customer_phone}</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-2xl font-black text-accent">{inr(b.total)}</div>
                <Badge variant="outline" className={`rounded-full text-[10px] ${b.payment_status === "paid" ? "text-emerald-700 border-emerald-300" : ""}`}>{b.payment_status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  {detail.booking_no}
                  <Badge className={`rounded-full border ${STATUS_COLORS[detail.status]}`}>{detail.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-xl text-sm">
                  <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Customer</div><div className="font-bold">{detail.customer_name}</div><div className="text-xs text-muted-foreground">{detail.customer_phone}{detail.customer_email ? ` · ${detail.customer_email}` : ""}</div></div>
                  <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Booking</div><div className="font-bold">{detail.booking_date} {detail.booking_time}</div><div className="text-xs text-muted-foreground">{detail.pax} pax · {detail.source}</div></div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-2">Items</div>
                  <div className="space-y-1">
                    {(detail.items || []).map((it, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-muted rounded-lg">
                        <span className="font-bold">{it.name} <span className="text-xs text-muted-foreground uppercase">{it.kind}</span></span>
                        <span>{inr(it.price)} × {it.qty} = <b>{inr(it.price * it.qty)}</b></span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-bold">Total</span><span className="text-2xl font-black text-accent">{inr(detail.total)}</span>
                  </div>
                </div>

                {detail.notes && <div className="p-3 bg-primary/10 rounded-xl text-sm">Note: {detail.notes}</div>}

                <div className="p-3 bg-muted rounded-xl flex items-center justify-between text-xs">
                  <code className="break-all flex-1">{bookingUrl}</code>
                  <Button data-testid="copy-detail-link" size="sm" variant="ghost" onClick={() => doCopy(bookingUrl, "Booking link")}><Copy className="h-3 w-3" /></Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Change Status</div>
                    <Select value={detail.status} onValueChange={(v) => updateStatus(detail.id, v)} disabled={!!detail.converted_bill_id && !isAdmin}>
                      <SelectTrigger data-testid="pbk-status-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {detail.converted_bill_id && !isAdmin && (
                      <div className="text-[10px] text-muted-foreground mt-1">🔒 Bill ban chuki hai — edit sirf admin</div>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button data-testid="pbk-send-btn" onClick={() => setSendOpen(true)} className="w-full rounded-full" variant="outline"><Send className="h-4 w-4 mr-1" /> Send Link</Button>
                  </div>
                </div>

                {detail.converted_bill_id && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800" data-testid="pbk-locked-info">
                    ✅ Yeh prebooking bill me convert ho chuki hai. Invoice edit karne ke liye <Link to={`/bills/${detail.converted_bill_id}`} className="font-black underline">bill open karo</Link>.
                  </div>
                )}

                {detail.razorpay_link && (
                  <a href={detail.razorpay_link} target="_blank" rel="noreferrer" className="block p-3 border-2 border-accent rounded-xl text-center font-bold hover:bg-accent hover:text-accent-foreground transition-colors">
                    Razorpay Payment Link <ExternalLink className="inline h-4 w-4 ml-1" />
                  </a>
                )}

                {detail.status !== "arrived" && (
                  <Button data-testid="pbk-convert" onClick={() => convert(detail.id)} className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black h-12">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Customer Arrived — Convert to Bill <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {detail.converted_bill_id && <Link to={`/bills/${detail.converted_bill_id}`}><Button variant="outline" className="w-full rounded-full">View Converted Bill</Button></Link>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">Send Booking Link</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3 my-4">
            {[
              { v: "whatsapp", label: "WhatsApp", icon: MessageCircle },
              { v: "sms", label: "SMS", icon: Phone },
              { v: "email", label: "Email", icon: Mail },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.v} data-testid={`pbk-send-${c.v}`} onClick={() => setSendChannel(c.v)} className={`p-4 rounded-xl border-2 ${sendChannel === c.v ? "border-accent bg-accent/10" : "border-border"}`}>
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-bold">{c.label}</div>
                </button>
              );
            })}
          </div>
          <Button data-testid="pbk-send-confirm" onClick={send} className="w-full rounded-full bg-accent hover:bg-accent/90 font-black h-12">Send</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
