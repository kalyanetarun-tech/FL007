import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";
import { Loader2, Gamepad2, PartyPopper, Plus, Minus, X, Calendar, Users, CheckCircle2, ExternalLink, Copy } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/* ---------- Public Book page (customer-facing) ---------- */
export function PublicBook() {
  const [catalog, setCatalog] = useState(null);
  const [tab, setTab] = useState("packages");
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_email: "", booking_date: new Date().toISOString().slice(0, 10), booking_time: "", pax: 1, notes: "" });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    axios.get(`${API}/prebook/catalog`).then((r) => setCatalog(r.data)).catch(() => setCatalog({ games: [], packages: [] }));
  }, []);

  const priceOf = (i) => (i.offer_price && i.offer_price < i.price ? i.offer_price : i.price);
  const add = (item, kind) => setCart((c) => {
    const idx = c.findIndex((x) => x.ref_id === item.id);
    if (idx >= 0) { const nc = [...c]; nc[idx].qty++; return nc; }
    return [...c, { kind, ref_id: item.id, name: item.name, price: priceOf(item), qty: 1 }];
  });
  const setQty = (i, q) => setCart((c) => c.map((x, idx) => idx === i ? { ...x, qty: Math.max(1, q) } : x));
  const removeAt = (i) => setCart((c) => c.filter((_, idx) => idx !== i));
  const total = useMemo(() => cart.reduce((s, x) => s + x.price * x.qty, 0), [cart]);

  const submit = async () => {
    if (!form.customer_name || !form.customer_phone) return toast.error("Name aur phone required");
    if (!cart.length) return toast.error("Kam se kam 1 item select karo");
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/prebook`, { ...form, items: cart, pax: +form.pax || 1 });
      toast.success(`Booking ${data.booking_no} confirmed!`);
      nav(`/book/${data.booking_no}`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to book"); }
    finally { setBusy(false); }
  };

  if (!catalog) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><span className="text-primary-foreground font-black">F</span></div>
          <div>
            <div className="font-black leading-none"><span className="text-accent">Fun</span><span className="text-secondary">land</span></div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Prebooking</div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-2">{catalog.park_name}</div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2" style={{ fontFamily: "Fraunces, serif" }}>Advance booking karke aao — no wait!</h1>
        <p className="text-muted-foreground mb-8">Package ya games pehle select karo, payment karo aur direct entry lo.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="p-5 rounded-2xl mb-4">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setTab("packages")} className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${tab === "packages" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>Packages</button>
                <button onClick={() => setTab("games")} className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${tab === "games" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>Games</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tab === "packages" && catalog.packages.map((p) => (
                  <button key={p.id} onClick={() => add(p, "package")} className="text-left p-4 rounded-xl border border-border hover:border-accent bg-white transition-colors">
                    <div className="flex items-center gap-2 mb-1"><PartyPopper className="h-4 w-4 text-accent" /><div className="font-bold">{p.name}</div></div>
                    <div className="text-xs uppercase text-muted-foreground tracking-widest font-bold">{p.type} · {p.pax} pax</div>
                    {p.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>}
                    <div className="text-lg font-black text-accent mt-2">{inr(priceOf(p))}</div>
                  </button>
                ))}
                {tab === "games" && catalog.games.map((g) => (
                  <button key={g.id} onClick={() => add(g, "game")} className="text-left p-4 rounded-xl border border-border hover:border-accent bg-white transition-colors">
                    <div className="flex items-center gap-2 mb-1"><Gamepad2 className="h-4 w-4 text-secondary" /><div className="font-bold">{g.name}</div></div>
                    <div className="text-xs uppercase text-muted-foreground tracking-widest font-bold">{g.category} {g.duration_min ? `· ${g.duration_min} min` : ""}</div>
                    <div className="text-lg font-black text-accent mt-2">{inr(priceOf(g))}</div>
                  </button>
                ))}
                {tab === "packages" && catalog.packages.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-8">No packages available</div>}
                {tab === "games" && catalog.games.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-8">No games available</div>}
              </div>
            </Card>

            <Card className="p-5 rounded-2xl">
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Aapki details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Name*</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
                <div><Label>Phone*</Label><Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
                <div><Label>People (pax)</Label><Input type="number" min={1} value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} /></div>
                <div><Label>Booking Date*</Label><Input type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} /></div>
                <div><Label>Preferred Time</Label><Input placeholder="e.g. 5:30 PM" value={form.booking_time} onChange={(e) => setForm({ ...form, booking_time: e.target.value })} /></div>
              </div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} placeholder="Special requests…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-5 rounded-2xl sticky top-24">
              <div className="font-black text-lg mb-3">Booking Summary</div>
              {cart.length === 0 ? <div className="text-center py-10 text-muted-foreground text-sm">Add items to book</div> :
                <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
                  {cart.map((it, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{inr(it.price)} × {it.qty}</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(i, it.qty - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center font-bold text-sm">{it.qty}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(i, it.qty + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeAt(i)}><X className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  ))}
                </div>}
              <div className="flex items-center justify-between text-xl font-black pt-3 border-t border-border">
                <span>Total</span><span className="text-accent">{inr(total)}</span>
              </div>
              <Button onClick={submit} disabled={busy || cart.length === 0 || !form.customer_name || !form.customer_phone} className="w-full mt-4 h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black">
                {busy ? <Loader2 className="animate-spin h-5 w-5" /> : "Book Now"}
              </Button>
              <div className="text-[10px] text-center text-muted-foreground mt-3">Booking ke baad payment link + QR aayega</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Public confirmation page after booking ---------- */
export function PublicBookConfirm() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    axios.get(`${API}/prebook/${id}`).then((r) => setB(r.data)).catch((e) => setError(e?.response?.data?.detail || "Not found"));
  }, [id]);
  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><Card className="p-8 max-w-md w-full text-center rounded-2xl"><div className="text-lg font-bold mb-2">Booking not found</div><div className="text-sm text-muted-foreground">{error}</div></Card></div>;
  if (!b) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;

  const park = b._park || {};
  const copyLink = () => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <div className="max-w-3xl mx-auto p-6">
        <Card className="p-8 rounded-2xl mb-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Booking confirmed</div>
            <h1 className="text-3xl font-black mt-1" style={{ fontFamily: "Fraunces, serif" }}>{b.booking_no}</h1>
            <div className="text-muted-foreground text-sm mt-1">{park.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Name</div><div className="font-bold">{b.customer_name}</div></div>
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Phone</div><div className="font-bold">{b.customer_phone}</div></div>
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Date</div><div className="font-bold flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{b.booking_date} {b.booking_time}</div></div>
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Pax</div><div className="font-bold flex items-center gap-1"><Users className="h-3.5 w-3.5" />{b.pax}</div></div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead><tr className="border-b border-border"><th className="text-left py-2 text-xs uppercase tracking-widest font-bold text-muted-foreground">Item</th><th className="text-right">Qty</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {b.items.map((it, i) => (
                <tr key={i} className="border-b border-border"><td className="py-2 font-semibold">{it.name}</td><td className="text-right">{it.qty}</td><td className="text-right font-bold">{inr(it.price * it.qty)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="text-lg font-black">Total</span><span className="text-3xl font-black text-accent">{inr(b.total)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge className={`rounded-full ${b.payment_status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-primary/20 text-accent"}`}>Payment: {b.payment_status}</Badge>
            <Badge variant="outline" className="rounded-full">Status: {b.status}</Badge>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl mb-4">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Pay Now</div>
          {b.razorpay_link && (
            <a href={b.razorpay_link} target="_blank" rel="noreferrer" className="block p-4 mb-3 border-2 border-accent rounded-xl text-center font-black hover:bg-accent hover:text-accent-foreground transition-colors">
              Pay ₹{b.total} via Razorpay <ExternalLink className="inline h-4 w-4 ml-1" />
            </a>
          )}
          {park.upi_qr_url && (
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">Scan with GPay / Paytm / any UPI app</div>
              <img src={park.upi_qr_url} alt="UPI QR" className="max-w-[260px] mx-auto rounded-xl border border-border" />
              {park.upi_id && <div className="mt-2 font-bold">UPI: {park.upi_id}</div>}
            </div>
          )}
          {!b.razorpay_link && !park.upi_qr_url && (
            <div className="text-sm text-muted-foreground text-center py-4">Payment options will be shared on WhatsApp shortly.</div>
          )}
          <div className="text-xs text-muted-foreground text-center mt-4">Payment ke baad park pe aake booking dikha do — direct entry milegi</div>
        </Card>

        <Card className="p-4 rounded-2xl flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Share this link with your family/friends</div>
          <Button size="sm" variant="outline" onClick={copyLink} className="rounded-full"><Copy className="h-4 w-4 mr-1" /> Copy Link</Button>
        </Card>

        {park.phone && <div className="text-center mt-6 text-sm text-muted-foreground">Any questions? Call us: <a href={`tel:${park.phone}`} className="font-bold text-secondary">{park.phone}</a></div>}
      </div>
    </div>
  );
}
