import React, { useEffect, useMemo, useState } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Minus, X, Gamepad2, PartyPopper, Receipt } from "lucide-react";

export default function NewVisit() {
  const [games, setGames] = useState([]);
  const [packages, setPackages] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("games");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/games").then((r) => setGames(r.data.filter((g) => g.active))).catch(() => {});
    api.get("/packages").then((r) => setPackages(r.data.filter((p) => p.active))).catch(() => {});
    api.get("/settings").then((r) => setGst(r.data.gst_rate || 0)).catch(() => {});
  }, []);

  const priceOf = (item) => (item.offer_price && item.offer_price < item.price ? item.offer_price : item.price);

  const add = (item, kind) => {
    setCart((c) => {
      const idx = c.findIndex((x) => x.ref_id === item.id);
      if (idx >= 0) { const nc = [...c]; nc[idx] = { ...nc[idx], qty: nc[idx].qty + 1 }; return nc; }
      return [...c, { kind, ref_id: item.id, name: item.name, price: priceOf(item), qty: 1 }];
    });
  };

  const setQty = (idx, qty) => setCart((c) => c.map((x, i) => i === idx ? { ...x, qty: Math.max(1, qty) } : x));
  const removeAt = (idx) => setCart((c) => c.filter((_, i) => i !== idx));

  const filteredGames = useMemo(() => games.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())), [games, q]);
  const filteredPackages = useMemo(() => packages.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [packages, q]);

  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const afterDiscount = Math.max(subtotal - discount, 0);
  const gstAmount = +(afterDiscount * (gst / 100)).toFixed(2);
  const total = +(afterDiscount + gstAmount).toFixed(2);

  const submit = async () => {
    if (!customer.name) return toast.error("Customer name is required");
    if (cart.length === 0) return toast.error("Add at least one game or package");
    setBusy(true);
    try {
      const { data } = await api.post("/bills", {
        customer_name: customer.name, customer_phone: customer.phone, customer_email: customer.email,
        items: cart, discount: +discount || 0, gst_percent: +gst || 0,
        payment_method: paymentMethod, payment_status: paymentStatus, notes,
      });
      toast.success(`Bill ${data.bill_no} created!`);
      nav(`/bills/${data.id}`);
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHead title="New Bill" subtitle="Customer entry, game selection aur billing — sab yahan" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Selector */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5 rounded-2xl">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Customer Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Name*</Label><Input data-testid="cust-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input data-testid="cust-phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input data-testid="cust-email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-2">
                <button data-testid="tab-games" onClick={() => setTab("games")} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${tab === "games" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>Games</button>
                <button data-testid="tab-packages" onClick={() => setTab("packages")} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${tab === "packages" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>Packages</button>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input data-testid="visit-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {tab === "games" && filteredGames.map((g) => (
                <button key={g.id} data-testid={`add-game-${g.id}`} onClick={() => add(g, "game")} className="text-left p-4 rounded-xl border border-border bg-white hover:border-accent hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-secondary" /><div className="font-bold">{g.name}</div></div>
                    <Plus className="h-4 w-4 text-accent shrink-0" />
                  </div>
                  <div className="mt-2 text-lg font-black text-accent">{inr(priceOf(g))}</div>
                </button>
              ))}
              {tab === "packages" && filteredPackages.map((p) => (
                <button key={p.id} data-testid={`add-pkg-${p.id}`} onClick={() => add(p, "package")} className="text-left p-4 rounded-xl border border-border bg-white hover:border-accent hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2"><PartyPopper className="h-4 w-4 text-accent" /><div className="font-bold">{p.name}</div></div>
                    <Plus className="h-4 w-4 text-accent shrink-0" />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mt-1">{p.type} · {p.pax} pax</div>
                  <div className="mt-2 text-lg font-black text-accent">{inr(priceOf(p))}</div>
                </button>
              ))}
              {tab === "games" && filteredGames.length === 0 && <div className="col-span-full text-center py-8 text-muted-foreground text-sm">No games found</div>}
              {tab === "packages" && filteredPackages.length === 0 && <div className="col-span-full text-center py-8 text-muted-foreground text-sm">No packages found</div>}
            </div>
          </Card>
        </div>

        {/* Right: Cart */}
        <div className="lg:col-span-2">
          <Card className="p-5 rounded-2xl sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-secondary" />
              <div className="font-black text-lg">Bill Summary</div>
              <Badge variant="outline" className="ml-auto">{cart.reduce((s, i) => s + i.qty, 0)} items</Badge>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Add games or packages</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4" data-testid="cart-items">
                {cart.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{inr(it.price)} × {it.qty}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button data-testid={`qty-dec-${i}`} size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(i, it.qty - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center font-bold text-sm">{it.qty}</span>
                      <Button data-testid={`qty-inc-${i}`} size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(i, it.qty + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button data-testid={`qty-rm-${i}`} size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeAt(i)}><X className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Discount ₹</Label><Input data-testid="bill-discount" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
                <div><Label className="text-xs">GST %</Label><Input data-testid="bill-gst" type="number" value={gst} onChange={(e) => setGst(e.target.value)} /></div>
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="bill-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi_qr">UPI (QR - GPay/Paytm)</SelectItem>
                    <SelectItem value="razorpay">Razorpay Link</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger data-testid="bill-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea data-testid="bill-notes" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="text-sm" />
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <Row label="Subtotal" value={inr(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`- ${inr(discount)}`} />}
              {gst > 0 && <Row label={`GST (${gst}%)`} value={inr(gstAmount)} />}
              <Row label="Total" value={inr(total)} big />
            </div>

            <Button data-testid="bill-generate" onClick={submit} disabled={busy || cart.length === 0} className="w-full mt-5 h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black">
              {busy ? "Creating…" : "Generate Bill"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, big }) {
  return (
    <div className={`flex items-center justify-between ${big ? "text-xl pt-2 border-t border-border font-black" : "text-sm"}`}>
      <span className={big ? "" : "text-muted-foreground"}>{label}</span>
      <span className={big ? "text-accent" : "font-bold"}>{value}</span>
    </div>
  );
}
