import React, { useEffect, useState, useMemo } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { Instagram, Facebook, MessageCircle, Send, Mail, Phone, Copy, Download, Share2, Trophy, Users, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";

const CHANNEL_ICON = { instagram: Instagram, facebook: Facebook, whatsapp: MessageCircle, sms: Phone, email: Mail };

const TEMPLATES = [
  { title: "Weekend Offer", message: "🎡 Weekend special at Funland! Flat 20% off on all rides. Book now: Funland Adventure Park, Indore." },
  { title: "Birthday Package", message: "🎂 Make birthdays unforgettable at Funland! Full birthday package with games, cake & decoration. DM us for booking." },
  { title: "Summer Camp", message: "☀️ Summer holidays at Funland! Unlimited rides, food & fun. Special group discounts for families." },
];

const PRESETS = [
  { v: "today",   label: "Today" },
  { v: "week",    label: "This week" },
  { v: "month",   label: "This month" },
  { v: "year",    label: "This year" },
  { v: "all",     label: "All time" },
];

export default function Marketing() {
  const [tab, setTab] = useState("report");
  return (
    <div>
      <PageHead title="Marketing" subtitle="Team ki performance report + campaigns" />
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 mb-6" data-testid="marketing-tabs">
        <button data-testid="tab-report" onClick={() => setTab("report")} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${tab === "report" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
          <Trophy className="h-4 w-4 inline mr-1" /> Team Report
        </button>
        <button data-testid="tab-campaigns" onClick={() => setTab("campaigns")} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${tab === "campaigns" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
          <Send className="h-4 w-4 inline mr-1" /> Campaigns
        </button>
      </div>

      {tab === "report" ? <TeamReport /> : <Campaigns />}
    </div>
  );
}

// ---------------- Team Report ----------------
function TeamReport() {
  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(false);
  const isCustom = preset === "custom";

  const load = async () => {
    setLoading(true);
    try {
      const params = isCustom
        ? { params: { from: customFrom, to: customTo } }
        : { params: { preset } };
      const { data } = await api.get("/marketing/report", params);
      setRep(data);
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [preset, customFrom, customTo]);

  const downloadXlsx = async () => {
    try {
      const params = isCustom ? { from: customFrom, to: customTo } : { preset };
      const res = await api.get("/marketing/report.xlsx", { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketing_report_${(rep?.from || "")}_${(rep?.to || "").slice(0,10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const shareText = useMemo(() => {
    if (!rep) return "";
    const lines = [
      `🎡 *Funland Marketing Report* — ${rep.label || ""}`,
      "",
      `Total inquiries: *${rep.totals.assigned}*`,
      `Converted: *${rep.totals.converted}*  (${rep.totals.conversion_rate}%)`,
      `In progress: ${rep.totals.contacted}`,
      `New (untouched): ${rep.totals.new}`,
      `Lost: ${rep.totals.lost}`,
      "",
      "*Executive-wise:*",
    ];
    (rep.executives || []).forEach((e) => {
      lines.push(`• ${e.name}: ${e.assigned} assigned · ${e.converted} converted (${e.conversion_rate}%)`);
    });
    return lines.join("\n");
  }, [rep]);

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };
  const copySummary = async () => {
    const ok = await copyToClipboard(shareText);
    toast[ok ? "success" : "info"](ok ? "Report summary copied" : "Copy failed");
  };
  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Marketing Report", text: shareText }); } catch {}
    } else {
      copySummary();
    }
  };

  if (loading && !rep) return <div className="p-8 text-sm text-muted-foreground text-center">Loading report…</div>;
  if (!rep) return <div className="p-8 text-sm text-muted-foreground text-center">No data</div>;

  return (
    <div className="space-y-6">
      {/* Toolbar: preset + custom range + actions */}
      <Card className="p-4 rounded-2xl" data-testid="report-toolbar">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {PRESETS.map((p) => (
              <button key={p.v} data-testid={`preset-${p.v}`} onClick={() => setPreset(p.v)} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${preset === p.v ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70"}`}>
                {p.label}
              </button>
            ))}
            <button data-testid="preset-custom" onClick={() => setPreset("custom")} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${preset === "custom" ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70"}`}>
              Custom range
            </button>
          </div>
          <div className="flex gap-2">
            <Button data-testid="report-download" onClick={downloadXlsx} variant="outline" className="rounded-full h-10 px-4 font-bold"><Download className="h-4 w-4 mr-1" /> Excel</Button>
            <Button data-testid="report-share-wa" onClick={shareWhatsApp} className="rounded-full h-10 px-4 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp</Button>
            <Button data-testid="report-share-native" onClick={shareNative} variant="outline" className="rounded-full h-10 px-4 font-bold"><Share2 className="h-4 w-4 mr-1" /> Share</Button>
          </div>
        </div>
        {isCustom && (
          <div className="grid grid-cols-2 gap-3 mt-3 max-w-sm">
            <div>
              <Label className="text-xs">From</Label>
              <Input data-testid="custom-from" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input data-testid="custom-to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-3">
          Range: <span className="font-black text-foreground">{rep.label}</span>
          {rep.unassigned?.assigned > 0 && <span className="ml-3 text-destructive font-bold">⚠️ {rep.unassigned.assigned} unassigned</span>}
        </div>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Users} label="Total inquiries" value={rep.totals.assigned} sub={`${rep.totals.new} untouched`} color="bg-primary/10 text-primary" testid="kpi-total" />
        <KPI icon={TrendingUp} label="Converted" value={rep.totals.converted} sub={`${rep.totals.conversion_rate}% rate`} color="bg-emerald-100 text-emerald-700" testid="kpi-converted" />
        <KPI icon={Clock} label="In progress" value={rep.totals.contacted} sub="Contacted but not closed" color="bg-secondary/10 text-secondary" testid="kpi-contacted" />
        <KPI icon={ArrowUpRight} label="Lost" value={rep.totals.lost} sub="Couldn't convert" color="bg-destructive/10 text-destructive" testid="kpi-lost" />
      </div>

      {/* Per-exec table */}
      <Card className="p-6 rounded-2xl" data-testid="exec-leaderboard">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Team Leaderboard</div>
            <h3 className="text-xl font-black">Marketing Executives</h3>
          </div>
        </div>
        {rep.executives.length === 0 ? (
          <EmptyState title="No marketing executives yet" description="Staff page pe kisi employee ko 'Marketing Executive' mark karo. Wo automatic inquiries me distribute honge." />
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">#</th>
                  <th className="text-left py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Executive</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Assigned</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">New</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">In progress</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Converted</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Lost</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Rate</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Remarks</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Avg Response</th>
                </tr>
              </thead>
              <tbody>
                {rep.executives.map((e, i) => (
                  <tr key={e.id} className="border-b border-border/40 hover:bg-muted/40" data-testid={`exec-row-${e.id}`}>
                    <td className="py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${i === 0 ? "bg-yellow-100 text-yellow-800" : i === 1 ? "bg-gray-100 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-bold">{e.name}</div>
                      <div className="text-[10px] text-muted-foreground">{e.email}</div>
                    </td>
                    <td className="py-3 text-right font-black tabular-nums">{e.assigned}</td>
                    <td className="py-3 text-right tabular-nums">{e.new}</td>
                    <td className="py-3 text-right tabular-nums">{e.contacted}</td>
                    <td className="py-3 text-right font-black text-emerald-700 tabular-nums">{e.converted}</td>
                    <td className="py-3 text-right tabular-nums">{e.lost}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-black ${e.conversion_rate >= 30 ? "bg-emerald-100 text-emerald-700" : e.conversion_rate >= 10 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                        {e.conversion_rate}%
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{e.remarks_added}</td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">{e.avg_response_hours != null ? `${e.avg_response_hours}h` : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40 font-black">
                  <td colSpan={2} className="py-3">TOTAL</td>
                  <td className="py-3 text-right tabular-nums">{rep.totals.assigned}</td>
                  <td className="py-3 text-right tabular-nums">{rep.totals.new}</td>
                  <td className="py-3 text-right tabular-nums">{rep.totals.contacted}</td>
                  <td className="py-3 text-right tabular-nums text-emerald-700">{rep.totals.converted}</td>
                  <td className="py-3 text-right tabular-nums">{rep.totals.lost}</td>
                  <td className="py-3 text-right">{rep.totals.conversion_rate}%</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Assigned vs Converted bar */}
      {rep.executives.length > 0 && (
        <Card className="p-6 rounded-2xl" data-testid="exec-bar-chart">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Assigned vs Converted (per executive)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rep.executives.map((e) => ({ name: e.name, assigned: e.assigned, converted: e.converted, contacted: e.contacted }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill="hsl(204 100% 45%)" name="Assigned" radius={[6,6,0,0]} />
                <Bar dataKey="contacted" fill="hsl(28 100% 49%)" name="In progress" radius={[6,6,0,0]} />
                <Bar dataKey="converted" fill="#10b981" name="Converted" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, color, testid }) {
  return (
    <Card className="p-4 rounded-2xl" data-testid={testid}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
      <div className="text-3xl font-black tabular-nums mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </Card>
  );
}

// ---------------- Campaigns (existing composer) ----------------
function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ title: "", channel: "whatsapp", message: "", image_url: "", audience: "all_customers", custom_phones: "" });
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/campaigns").then((r) => setCampaigns(r.data)).catch(() => {});
  useEffect(() => { load(); api.get("/integrations/status").then((r) => setStatus(r.data)); }, []);

  const send = async () => {
    if (!form.title || !form.message) return toast.error("Title & message required");
    setBusy(true);
    try {
      const payload = { ...form, custom_phones: form.custom_phones ? form.custom_phones.split(",").map((s) => s.trim()) : [] };
      const { data } = await api.post("/campaigns", payload);
      if (data.status === "draft") toast.success(`Draft saved for ${data.channel}. Copy & post manually!`);
      else if (data.status === "sent") toast.success(`Sent to ${data.sent_count}/${data.target_count}`);
      else toast.error("Send failed. Check integration credentials.");
      load();
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };

  const copyMsg = async () => { const ok = await copyToClipboard(form.message); toast[ok ? "success" : "info"](ok ? "Message copied" : "Manual copy fallback shown"); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3 p-6 rounded-2xl">
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Compose Campaign</div>
        <div className="space-y-4">
          <div><Label>Title / Campaign Name</Label><Input data-testid="mk-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <Label>Channel</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
              {["instagram", "facebook", "whatsapp", "sms", "email"].map((c) => {
                const Icon = CHANNEL_ICON[c];
                const active = form.channel === c;
                return (
                  <button key={c} data-testid={`mk-ch-${c}`} onClick={() => setForm({ ...form, channel: c })} className={`p-3 rounded-xl border-2 transition-colors ${active ? "border-accent bg-accent/10" : "border-border"}`}>
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-bold capitalize">{c}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Audience</Label>
            <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
              <SelectTrigger data-testid="mk-audience"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_customers">All Customers (from bills)</SelectItem>
                <SelectItem value="recent_customers">Recent Customers (30 days)</SelectItem>
                <SelectItem value="inquiries">Inquiries</SelectItem>
                <SelectItem value="custom">Custom Phone List</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.audience === "custom" && (
            <div><Label>Phone numbers (comma separated)</Label><Textarea data-testid="mk-custom-phones" value={form.custom_phones} onChange={(e) => setForm({ ...form, custom_phones: e.target.value })} placeholder="+919999999999, +918888888888" /></div>
          )}
          <div>
            <div className="flex items-center justify-between">
              <Label>Message*</Label>
              <button onClick={copyMsg} className="text-xs text-secondary font-bold flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
            </div>
            <Textarea data-testid="mk-message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div><Label>Image URL (for social posts)</Label><Input data-testid="mk-image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
          {["instagram", "facebook"].includes(form.channel) && (
            <div className="p-3 bg-primary/10 rounded-xl text-xs">Social posts: We save this as a draft. Copy the message and post from your Instagram/Facebook app.</div>
          )}
          {form.channel === "whatsapp" && status && !status.twilio_whatsapp && (
            <div className="p-3 bg-primary/10 rounded-xl text-xs">Twilio WhatsApp not configured — sends will be simulated. Add credentials in backend .env.</div>
          )}
          <Button data-testid="mk-send" onClick={send} disabled={busy} className="w-full h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black">
            <Send className="h-4 w-4 mr-2" /> {["instagram", "facebook"].includes(form.channel) ? "Save Draft" : "Send Campaign"}
          </Button>
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Quick Templates</div>
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <button key={t.title} data-testid={`tpl-${t.title}`} onClick={() => setForm({ ...form, title: t.title, message: t.message })} className="w-full text-left p-3 bg-muted rounded-lg hover:bg-secondary/20 transition-colors">
                <div className="font-bold text-sm">{t.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.message}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Recent Campaigns</div>
          {campaigns.length === 0 ? <div className="text-sm text-muted-foreground">No campaigns yet.</div> :
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {campaigns.map((c) => {
                const Icon = CHANNEL_ICON[c.channel] || MessageCircle;
                return (
                  <div key={c.id} className="p-3 bg-muted rounded-lg" data-testid={`campaign-${c.id}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-secondary" />
                      <div className="font-bold text-sm flex-1">{c.title}</div>
                      <Badge variant="outline" className="rounded-full text-[10px]">{c.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{c.message}</div>
                    <div className="text-xs mt-1 flex justify-between">
                      <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      {c.channel !== "instagram" && c.channel !== "facebook" && <span className="font-bold">{c.sent_count}/{c.target_count}</span>}
                    </div>
                  </div>
                );
              })}
            </div>}
        </Card>
      </div>
    </div>
  );
}
