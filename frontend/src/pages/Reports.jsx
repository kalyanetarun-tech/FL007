import React, { useEffect, useMemo, useState } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { Download, Share2, MessageCircle, TrendingUp, Receipt, IndianRupee, CreditCard, Plus, Trash2, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const PRESETS = [
  { v: "today", label: "Today" },
  { v: "week",  label: "Week" },
  { v: "month", label: "Month" },
  { v: "year",  label: "Year" },
  { v: "all",   label: "All time" },
];

const PIE_COLORS = ["#f97316","#10b981","#3b82f6","#a855f7","#ec4899","#eab308","#06b6d4","#f43f5e"];

export default function Reports() {
  const [tab, setTab] = useState("sales");
  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const params = preset === "custom" ? { from: customFrom, to: customTo } : { preset };

  const downloadXlsx = async () => {
    try {
      const res = await api.get("/reports/business.xlsx", { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = `business_report_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  return (
    <div>
      <PageHead title="Reports" subtitle="Sales · GST-3B · Payment Modes · Expenses" />

      <Card className="p-4 rounded-2xl mb-6" data-testid="reports-toolbar">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {PRESETS.map((p) => (
              <button key={p.v} data-testid={`rep-preset-${p.v}`} onClick={() => setPreset(p.v)} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${preset === p.v ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70"}`}>{p.label}</button>
            ))}
            <button data-testid="rep-preset-custom" onClick={() => setPreset("custom")} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${preset === "custom" ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70"}`}>Custom</button>
          </div>
          <Button data-testid="rep-download" onClick={downloadXlsx} variant="outline" className="rounded-full h-10 px-4 font-bold"><Download className="h-4 w-4 mr-1" /> Full Excel</Button>
        </div>
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3 mt-3 max-w-md">
            <div><Label className="text-xs">From</Label><Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2 mb-6" data-testid="report-tabs">
        <TabBtn active={tab === "sales"}    onClick={() => setTab("sales")}    testid="tab-sales"   icon={TrendingUp}><span>Sales</span></TabBtn>
        <TabBtn active={tab === "gst"}      onClick={() => setTab("gst")}      testid="tab-gst"     icon={Receipt}><span>GST-3B</span></TabBtn>
        <TabBtn active={tab === "payment"}  onClick={() => setTab("payment")}  testid="tab-payment" icon={CreditCard}><span>Payment Mode</span></TabBtn>
        <TabBtn active={tab === "expense"}  onClick={() => setTab("expense")}  testid="tab-expense" icon={Wallet}><span>Expenses</span></TabBtn>
      </div>

      {tab === "sales"    && <SalesTab params={params} />}
      {tab === "gst"      && <GstTab params={params} />}
      {tab === "payment"  && <PaymentTab params={params} />}
      {tab === "expense"  && <ExpenseTab params={params} />}
    </div>
  );
}

function TabBtn({ active, onClick, testid, icon: Icon, children }) {
  return (
    <button data-testid={testid} onClick={onClick} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 ${active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

function ShareBar({ shareText, testid }) {
  const shareWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  const shareNative = async () => {
    if (navigator.share) { try { await navigator.share({ text: shareText }); } catch {} }
    else { const ok = await copyToClipboard(shareText); toast[ok?"success":"info"](ok?"Copied":"Copy failed"); }
  };
  return (
    <div className="flex gap-2 mt-4" data-testid={`${testid}-share`}>
      <Button size="sm" onClick={shareWA} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" data-testid={`${testid}-share-wa`}><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp</Button>
      <Button size="sm" variant="outline" onClick={shareNative} className="rounded-full font-bold" data-testid={`${testid}-share-native`}><Share2 className="h-4 w-4 mr-1" /> Share</Button>
    </div>
  );
}

function SalesTab({ params }) {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.get("/reports/sales", { params }).then((r) => setRep(r.data)).catch(() => {}); }, [JSON.stringify(params)]);
  if (!rep) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const share = `📊 *Sales Report* — ${rep.label}\nTotal: ${inr(rep.total_revenue)}\nBills: ${rep.paid_bills} paid, ${rep.pending_bills} pending\nAvg bill: ${inr(rep.avg_bill_value)}\n\nTop items:\n${rep.top_items.slice(0,5).map(i=>`• ${i.name} × ${i.qty}`).join("\n")}`;
  return (
    <div className="space-y-6" data-testid="sales-tab">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={IndianRupee} label="Revenue"       value={inr(rep.total_revenue)} sub={`${rep.label}`} testid="sales-kpi-revenue" />
        <KPI icon={Receipt}     label="Paid bills"    value={rep.paid_bills}         sub={`Avg ${inr(rep.avg_bill_value)}`} testid="sales-kpi-paid" />
        <KPI icon={Receipt}     label="Pending"       value={rep.pending_bills}      sub="Not collected"                    testid="sales-kpi-pending" />
        <KPI icon={TrendingUp}  label="Total bills"   value={rep.total_bills}        sub="Including all statuses"           testid="sales-kpi-total" />
      </div>
      <Card className="p-6 rounded-2xl" data-testid="sales-daily-chart">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Daily revenue</div>
        <div className="h-64">
          {rep.daily.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rep.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(28 100% 49%)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No sales" description="Selected range me koi paid bill nahi hai" />}
        </div>
      </Card>
      <Card className="p-6 rounded-2xl">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Top items sold</div>
        {rep.top_items.length ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Item</th><th className="text-right">Qty</th></tr></thead>
            <tbody>{rep.top_items.map((i) => <tr key={i.name} className="border-b border-border/40"><td className="py-2 font-bold">{i.name}</td><td className="text-right tabular-nums">{i.qty}</td></tr>)}</tbody>
          </table>
        ) : <div className="text-sm text-muted-foreground text-center py-6">No items in this range</div>}
      </Card>
      <ShareBar shareText={share} testid="sales" />
    </div>
  );
}

function GstTab({ params }) {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.get("/reports/gstr3b", { params }).then((r) => setRep(r.data)).catch(() => {}); }, [JSON.stringify(params)]);
  if (!rep) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const share = `🧾 *GSTR-3B Summary* — ${rep.label}\nInvoices: ${rep.invoice_count}\nTaxable: ${inr(rep.total_taxable)}\nCGST: ${inr(rep.total_cgst)}\nSGST: ${inr(rep.total_sgst)}\nIGST: ${inr(rep.total_igst)}\n*Total Tax: ${inr(rep.total_tax)}*`;
  return (
    <div className="space-y-6" data-testid="gst-tab">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Receipt}    label="Taxable value" value={inr(rep.total_taxable)} sub={`${rep.invoice_count} invoices`} testid="gst-kpi-taxable" />
        <KPI icon={IndianRupee} label="Total tax"    value={inr(rep.total_tax)}     sub="Filed via GSTR-3B"               testid="gst-kpi-total" />
        <KPI icon={Receipt}    label="CGST + SGST"   value={inr(rep.total_cgst + rep.total_sgst)} sub="Intra-state"      testid="gst-kpi-cs" />
        <KPI icon={Receipt}    label="IGST"          value={inr(rep.total_igst)}    sub="Inter-state"                    testid="gst-kpi-igst" />
      </div>
      <Card className="p-6 rounded-2xl" data-testid="gst-rate-table">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Rate-wise breakup</div>
        {rep.rate_wise.length ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Rate</th><th className="text-right">Taxable</th><th className="text-right">CGST</th><th className="text-right">SGST</th><th className="text-right">IGST</th></tr></thead>
            <tbody>
              {rep.rate_wise.map((r) => (
                <tr key={r.rate} className="border-b border-border/40">
                  <td className="py-2 font-black">{r.rate}%</td>
                  <td className="text-right tabular-nums">{inr(r.taxable)}</td>
                  <td className="text-right tabular-nums">{inr(r.cgst)}</td>
                  <td className="text-right tabular-nums">{inr(r.sgst)}</td>
                  <td className="text-right tabular-nums">{inr(r.igst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-sm text-muted-foreground text-center py-6">No GST collected in this range</div>}
      </Card>
      <ShareBar shareText={share} testid="gst" />
    </div>
  );
}

function PaymentTab({ params }) {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.get("/reports/payment-mode", { params }).then((r) => setRep(r.data)).catch(() => {}); }, [JSON.stringify(params)]);
  if (!rep) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const share = `💳 *Payment Mode Report* — ${rep.label}\nCollected: ${inr(rep.total_paid)}\nPending: ${inr(rep.total_pending)}\n\nBy method:\n${rep.modes.map(m => `• ${m.method}: ${m.paid_count} bills, ${inr(m.paid_amount)}`).join("\n")}`;
  const pie = rep.modes.map((m) => ({ name: m.method, value: m.paid_amount }));
  return (
    <div className="space-y-6" data-testid="payment-tab">
      <div className="grid grid-cols-2 gap-3">
        <KPI icon={IndianRupee} label="Collected" value={inr(rep.total_paid)} sub={rep.label} testid="pay-kpi-paid" />
        <KPI icon={Receipt}    label="Pending"   value={inr(rep.total_pending)} sub="Awaiting" testid="pay-kpi-pending" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Distribution</div>
          <div className="h-64">
            {pie.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" outerRadius={80} label={(d) => d.name}>
                    {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => inr(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>}
          </div>
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Per method</div>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Method</th><th className="text-right">Paid</th><th className="text-right">Pending</th></tr></thead>
            <tbody>
              {rep.modes.map((m) => (
                <tr key={m.method} className="border-b border-border/40">
                  <td className="py-2 font-bold capitalize">{m.method.replace("_", " ")}</td>
                  <td className="text-right tabular-nums"><div>{m.paid_count}</div><div className="text-xs text-emerald-700 font-black">{inr(m.paid_amount)}</div></td>
                  <td className="text-right tabular-nums text-muted-foreground"><div>{m.pending_count}</div><div className="text-xs">{inr(m.pending_amount)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <ShareBar shareText={share} testid="payment" />
    </div>
  );
}

function ExpenseTab({ params }) {
  const [rep, setRep] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), category: "other", description: "", amount: "", payment_method: "cash", payment_reference: "", vendor: "" });
  const load = () => api.get("/reports/expenses", { params }).then((r) => setRep(r.data)).catch(() => {});
  useEffect(() => { load(); }, [JSON.stringify(params)]);

  const save = async () => {
    if (!form.amount || +form.amount <= 0) return toast.error("Amount required");
    try {
      await api.post("/expenses", { ...form, amount: +form.amount });
      toast.success("Expense saved");
      setOpen(false); setForm({ date: new Date().toISOString().slice(0,10), category: "other", description: "", amount: "", payment_method: "cash", payment_reference: "", vendor: "" });
      load();
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await api.delete(`/expenses/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  if (!rep) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const share = `💸 *Expense Report* — ${rep.label}\nTotal: ${inr(rep.total)}\nEntries: ${rep.count}\n\nBy category:\n${rep.by_category.slice(0,6).map(c => `• ${c.category}: ${inr(c.amount)}`).join("\n")}`;

  return (
    <div className="space-y-6" data-testid="expense-tab">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{rep.label}</div>
          <h3 className="text-3xl font-black tabular-nums">{inr(rep.total)}</h3>
          <div className="text-sm text-muted-foreground">{rep.count} entries</div>
        </div>
        <Button data-testid="exp-add-btn" onClick={() => setOpen(true)} className="rounded-full bg-accent hover:bg-accent/90 font-bold"><Plus className="h-4 w-4 mr-1" /> New Expense</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">By category</div>
          {rep.by_category.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rep.by_category}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v) => inr(v)} />
                <Bar dataKey="amount" fill="#ec4899" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-sm text-muted-foreground text-center py-6">No expenses in this range</div>}
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">By month</div>
          {rep.by_month.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rep.by_month}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v) => inr(v)} />
                <Bar dataKey="amount" fill="#a855f7" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-sm text-muted-foreground text-center py-6">No data</div>}
        </Card>
      </div>
      <Card className="p-6 rounded-2xl">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">All expenses</div>
        {rep.expenses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Date</th><th className="text-left">Category</th><th className="text-left">Description</th><th className="text-left">Vendor</th><th className="text-right">Amount</th><th></th></tr></thead>
              <tbody>
                {rep.expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border/40" data-testid={`exp-row-${e.id}`}>
                    <td className="py-2">{e.date}</td>
                    <td className="capitalize">{e.category}</td>
                    <td className="text-muted-foreground">{e.description}</td>
                    <td>{e.vendor}</td>
                    <td className="text-right font-black tabular-nums">{inr(e.amount)}</td>
                    <td><Button size="icon" variant="ghost" onClick={() => remove(e.id)} data-testid={`exp-del-${e.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-sm text-muted-foreground text-center py-6">No expenses yet</div>}
      </Card>
      <ShareBar shareText={share} testid="expense" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">New Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} data-testid="exp-date" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                  <SelectTrigger data-testid="exp-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["rent","salary","utility","food","maintenance","marketing","travel","other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount ₹*</Label><Input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} data-testid="exp-amount" /></div>
              <div><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({...form, vendor: e.target.value})} data-testid="exp-vendor" /></div>
              <div>
                <Label>Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({...form, payment_method: v})}>
                  <SelectTrigger data-testid="exp-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["cash","upi","bank","cheque","card","other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Reference</Label><Input value={form.payment_reference} onChange={(e) => setForm({...form, payment_reference: e.target.value})} data-testid="exp-ref" placeholder="UTR / cheque no" /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} data-testid="exp-desc" /></div>
            <Button onClick={save} className="w-full h-11 rounded-full bg-accent hover:bg-accent/90 font-black" data-testid="exp-save">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, testid }) {
  return (
    <Card className="p-4 rounded-2xl" data-testid={testid}>
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
      <div className="text-2xl font-black tabular-nums mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </Card>
  );
}
