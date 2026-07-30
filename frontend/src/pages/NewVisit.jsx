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
import { Search, Plus, Minus, X, Gamepad2, PartyPopper, Receipt, Percent, IndianRupee } from "lucide-react";
import UpiPayBlock from "@/components/UpiPayBlock";

const CATEGORIES = [
  { v: "activity", label: "Activity", defaultGst: 18 },
  { v: "food", label: "Food/F&B", defaultGst: 5 },
  { v: "entry", label: "Entry Ticket", defaultGst: 18 },
  { v: "merchandise", label: "Merchandise", defaultGst: 12 },
];

export default function NewVisit() {
  const [games, setGames] = useState([]);
  const [packages, setPackages] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("games");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", gstin: "", state_code: "" });
  const [discountMode, setDiscountMode] = useState("percent"); // "percent" | "flat"
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAt, setPaymentAt] = useState("");
  const [checkedBy, setCheckedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/games").then((r) => setGames(r.data.filter((g) => g.active))).catch(() => {});
    api.get("/packages").then((r) => setPackages(r.data.filter((p) => p.active))).catch(() => {});
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const priceOf = (item) => (item.offer_price && item.offer_price < item.price ? item.offer_price : item.price);

  const add = (item, kind) => {
    setCart((c) => {
      const idx = c.findIndex((x) => x.ref_id === item.id);
      if (idx >= 0) { const nc = [...c]; nc[idx] = { ...nc[idx], qty: nc[idx].qty + 1 }; return nc; }
      // Auto-derive category & GST from item metadata
      let catV = "activity", gst = 18;
      if (kind === "game") {
        const gc = (item.gst_category || "activity").toLowerCase();
        if (gc === "food") { catV = "food"; gst = 5; }
        else if (gc === "goods") { catV = "merchandise"; gst = 12; }
        else { catV = "activity"; gst = 18; }
      } else if (kind === "package") {
        // Package will be exploded on backend into food + activity lines with 5% + 18%
        catV = "activity"; gst = 18;
      }
      return [...c, { kind, ref_id: item.id, name: item.name, price: priceOf(item), qty: 1, category: catV, gst_percent: gst, is_package_split: kind === "package" && ((Array.isArray(item.gst_split) && item.gst_split.length > 0) || (item.food_portion > 0 && item.activity_portion > 0)), split_preview: kind === "package" ? (Array.isArray(item.gst_split) && item.gst_split.length ? item.gst_split : ((item.food_portion > 0 || item.activity_portion > 0) ? [item.food_portion > 0 && { label: "Food", category: "food", amount: item.food_portion }, item.activity_portion > 0 && { label: "Activity", category: "activity", amount: item.activity_portion }].filter(Boolean) : [])) : [] }];
    });
  };
  const setQty = (idx, qty) => setCart((c) => c.map((x, i) => i === idx ? { ...x, qty: Math.max(1, qty) } : x));
  const setLineField = (idx, field, value) => setCart((c) => c.map((x, i) => i === idx ? { ...x, [field]: value } : x));
  const removeAt = (idx) => setCart((c) => c.filter((_, i) => i !== idx));
  const changeCategory = (idx, catV) => {
    const cat = CATEGORIES.find((c) => c.v === catV) || CATEGORIES[0];
    setCart((c) => c.map((x, i) => i === idx ? { ...x, category: cat.v, gst_percent: cat.defaultGst } : x));
  };

  const filteredGames = useMemo(() => games.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())), [games, q]);
  const filteredPackages = useMemo(() => packages.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [packages, q]);

  // Totals
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const discPct = discountMode === "percent" ? Math.min(Math.max(+discountValue || 0, 0), 100) : 0;
  const discFlat = discountMode === "flat" ? Math.min(Math.max(+discountValue || 0, 0), subtotal) : 0;
  const discAmount = discountMode === "percent" ? +(subtotal * discPct / 100).toFixed(2) : discFlat;
  const afterDiscount = Math.max(subtotal - discAmount, 0);
  const ratio = subtotal > 0 ? afterDiscount / subtotal : 0;
  const gstByCategory = cart.reduce((acc, it) => {
    const line = it.price * it.qty * ratio;
    const g = +(line * (it.gst_percent || 0) / 100).toFixed(2);
    if (!g) return acc;
    const key = `${it.category || "other"}@${it.gst_percent}%`;
    acc[key] = (acc[key] || 0) + g;
    return acc;
  }, {});
  const gstTotal = +Object.values(gstByCategory).reduce((a, b) => a + b, 0).toFixed(2);
  const total = +(afterDiscount + gstTotal).toFixed(2);

  const submit = async () => {
    if (!customer.name) return toast.error("Customer name is required");
    if (cart.length === 0) return toast.error("Add at least one item");
    if (discountMode === "percent" && (+discountValue < 0 || +discountValue > 100)) return toast.error("Discount 0-100% only");
    setBusy(true);
    try {
      const { data } = await api.post("/bills", {
        customer_name: customer.name, customer_phone: customer.phone, customer_email: customer.email,
        customer_gstin: customer.gstin, customer_state_code: customer.state_code,
        items: cart.map((c) => ({ kind: c.kind, ref_id: c.ref_id, name: c.name, price: c.price, qty: c.qty, gst_percent: +c.gst_percent || 0, category: c.category })),
        discount: discountMode === "flat" ? discFlat : 0,
        discount_percent: discountMode === "percent" ? discPct : 0,
        gst_percent: 0,
        payment_method: paymentMethod, payment_status: paymentStatus,
        payment_reference: paymentReference, payment_at: paymentAt, checked_by: checkedBy,
        notes,
      });
      toast.success(`Bill ${data.bill_no} created! Print button click karo`, {
        duration: 6000,
        action: { label: "🖨️ Print Now", onClick: () => window.open(`/bills/${data.id}/print`, "_blank") },
      });
      nav(`/bills/${data.id}`);
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHead title="New Bill" subtitle="Customer entry, items, per-item GST aur percent-based discount" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5 rounded-2xl">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Customer Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Name*</Label><Input data-testid="cust-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input data-testid="cust-phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input data-testid="cust-email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="md:col-span-2">
                <Label className="flex items-center gap-1">Customer GSTIN <span className="text-[10px] font-normal text-muted-foreground">(optional — B2B tax invoice ke liye)</span></Label>
                <Input data-testid="cust-gstin" value={customer.gstin} onChange={(e) => setCustomer({ ...customer, gstin: e.target.value.toUpperCase() })} placeholder="22ABCDE1234F1Z5" maxLength={15} />
              </div>
              <div>
                <Label>State code</Label>
                <Input data-testid="cust-state" value={customer.state_code} onChange={(e) => setCustomer({ ...customer, state_code: e.target.value })} placeholder="e.g. 23 (MP)" maxLength={2} />
                <div className="text-[10px] text-muted-foreground mt-1">Blank = intra-state (CGST+SGST)</div>
              </div>
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
              <div className="space-y-2 max-h-[420px] overflow-y-auto mb-4" data-testid="cart-items">
                {cart.map((it, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
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
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={it.category} onValueChange={(v) => changeCategory(i, v)}>
                        <SelectTrigger className="h-8 text-xs" data-testid={`line-cat-${i}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="relative">
                        <Input data-testid={`line-gst-${i}`} type="number" value={it.gst_percent} onChange={(e) => setLineField(i, "gst_percent", +e.target.value || 0)} className="h-8 text-xs pr-8" />
                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    {it.kind === "package" && it.is_package_split && (
                      <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded px-2 py-1 space-y-0.5">
                        <div>📦 Bill par yeh package auto-split hoga:</div>
                        {(it.split_preview || []).map((s, si) => {
                          const rateMap = { food: 5, activity: 18, room: 12, clothing: 12, merchandise: 18, other: 18 };
                          const r = rateMap[s.category] || 18;
                          return <div key={si} className="pl-4">· {s.label || s.category} ₹{s.amount} @{r}%</div>;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-3 border-t border-border">
              <div>
                <Label className="text-xs">Discount</Label>
                <div className="flex gap-2 mt-1">
                  <button data-testid="disc-mode-percent" onClick={() => setDiscountMode("percent")} className={`flex-1 h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-1 ${discountMode === "percent" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}><Percent className="h-3 w-3" /> %</button>
                  <button data-testid="disc-mode-flat" onClick={() => setDiscountMode("flat")} className={`flex-1 h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-1 ${discountMode === "flat" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}><IndianRupee className="h-3 w-3" /> Flat</button>
                </div>
                <Input data-testid="bill-discount" type="number" min={0} max={discountMode === "percent" ? 100 : undefined} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountMode === "percent" ? "0-100 %" : "₹"} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="bill-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi_qr">UPI (QR)</SelectItem>
                    <SelectItem value="razorpay">Razorpay Link</SelectItem>
                    <SelectItem value="card">Card (Debit / Credit)</SelectItem>
                    <SelectItem value="rtgs">RTGS / NEFT</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
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

            {paymentStatus === "paid" && paymentMethod !== "cash" && (
              <div className="mt-4 p-4 rounded-xl bg-secondary/10 border-2 border-secondary/30" data-testid="digital-audit-fields">
                <div className="text-xs uppercase tracking-widest font-black text-secondary mb-3">Digital payment audit (compulsory)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Reference No / UTR / RRN*</Label>
                    <Input data-testid="bill-payment-ref" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Txn ID / UTR / Card auth code" />
                  </div>
                  <div>
                    <Label className="text-xs">Payment Date & Time</Label>
                    <Input data-testid="bill-payment-at" type="datetime-local" value={paymentAt} onChange={(e) => setPaymentAt(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Checked By*</Label>
                    <Input data-testid="bill-checked-by" value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} placeholder="Staff name" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">Ye fields payment ki verification ke liye zaruri hain. Cash ke liye skip ho jaate hain.</div>
              </div>
            )}

            {paymentMethod === "upi_qr" && (settings?.upi_qr_url || settings?.upi_id) && (
              <div className="mt-4">
                <UpiPayBlock settings={settings} amount={total} note="New bill" variant="compact" />
              </div>
            )}

            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <Row label="Subtotal" value={inr(subtotal)} />
              {discAmount > 0 && <Row label={`Discount${discountMode === "percent" ? ` (${discPct}%)` : ""}`} value={`- ${inr(discAmount)}`} />}
              {Object.entries(gstByCategory).map(([k, v]) => <Row key={k} label={`GST ${k}`} value={inr(v)} small />)}
              {gstTotal > 0 && <Row label="Total GST" value={inr(gstTotal)} />}
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

function Row({ label, value, big, small }) {
  return (
    <div className={`flex items-center justify-between ${big ? "text-xl pt-2 border-t border-border font-black" : small ? "text-xs" : "text-sm"}`}>
      <span className={big ? "" : "text-muted-foreground"}>{label}</span>
      <span className={big ? "text-accent" : "font-bold"}>{value}</span>
    </div>
  );
}
