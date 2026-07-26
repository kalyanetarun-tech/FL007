import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { inr } from "@/lib/api";
import { Wallet, Users, MessageSquare, Receipt, Package as PackageIcon, Gamepad2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCode from "react-qr-code";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { Star, Copy, ExternalLink, Calendar as CalIcon } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today);
  const [granularity, setGranularity] = useState("day");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);

  const setPreset = (p) => {
    if (p === "today") { setFrom(today); setTo(today); setGranularity("day"); }
    else if (p === "7d") { setFrom(daysAgo(6)); setTo(today); setGranularity("day"); }
    else if (p === "30d") { setFrom(daysAgo(29)); setTo(today); setGranularity("day"); }
    else if (p === "3m") { setFrom(daysAgo(89)); setTo(today); setGranularity("week"); }
    else if (p === "1y") { setFrom(daysAgo(364)); setTo(today); setGranularity("month"); }
    else if (p === "all") { setFrom("2024-01-01"); setTo(today); setGranularity("month"); }
  };

  useEffect(() => {
    let mounted = true;
    api.get("/dashboard/stats").then((r) => mounted && setStats(r.data)).catch(() => mounted && setError(true));
    api.get("/settings").then((r) => mounted && setSettings(r.data)).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setAnalyticsBusy(true);
    api.get(`/dashboard/analytics?from_date=${from}&to_date=${to}&granularity=${granularity}`)
      .then((r) => mounted && setAnalytics(r.data))
      .catch(() => mounted && setAnalytics(null))
      .finally(() => mounted && setAnalyticsBusy(false));
    return () => { mounted = false; };
  }, [from, to, granularity]);

  const reviewUrl = settings?.google_review_url || "";
  const copyReview = async () => {
    const ok = await copyToClipboard(reviewUrl);
    toast[ok ? "success" : "info"](ok ? "Review link copied" : "Manual copy fallback shown");
  };

  return (
    <div>
      <PageHead
        title={`Namaste, ${user?.name?.split(" ")[0] || "Manager"} 🎡`}
        subtitle="Aaj ke park operations aur revenue ka overview"
        action={
          <div className="flex gap-3">
            <Link to="/visit"><Button data-testid="dash-new-bill" className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold">+ New Bill</Button></Link>
            <Link to="/inquiries"><Button data-testid="dash-new-inquiry" variant="outline" className="rounded-full h-11 px-6 font-bold">+ Inquiry</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        <KpiCard icon={Wallet} tint="bg-primary/20 text-accent" label="Aaj ka revenue" value={stats ? inr(stats.revenue_today) : "—"} testid="kpi-revenue" />
        <KpiCard icon={Users} tint="bg-secondary/20 text-secondary" label="Aaj ki footfall" value={stats?.footfall_today ?? "—"} testid="kpi-footfall" />
        <KpiCard icon={MessageSquare} tint="bg-accent/20 text-accent" label="Nayi inquiries" value={stats?.inquiries_new ?? "—"} testid="kpi-inq-new" />
        <KpiCard icon={Receipt} tint="bg-destructive/10 text-destructive" label={stats?.pending_prebookings ? `Pending: ${stats.pending_prebookings} bookings + ${stats.pending_bills} bills` : "Pending bills"} value={stats ? ((stats.pending_prebookings || 0) + (stats.pending_bills || 0)) : "—"} testid="kpi-pending" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-2 p-6 rounded-2xl" data-testid="analytics-card">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Analytics</div>
              <h3 className="text-xl font-black">Revenue &amp; footfall trend</h3>
              <p className="text-xs text-muted-foreground mt-1">{from} → {to} · {granularity}wise · {analytics ? `${analytics.trend?.length || 0} data points` : "…"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: "today", l: "Today" },
                { k: "7d", l: "7d" },
                { k: "30d", l: "30d" },
                { k: "3m", l: "3m" },
                { k: "1y", l: "1y" },
                { k: "all", l: "All" },
              ].map((p) => (
                <button key={p.k} data-testid={`preset-${p.k}`} onClick={() => setPreset(p.k)} className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors">{p.l}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">From</label>
              <Input data-testid="date-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">To</label>
              <Input data-testid="date-to" type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Group by</label>
              <div className="grid grid-cols-4 gap-1 mt-1">
                {["day", "week", "month", "year"].map((g) => (
                  <button key={g} data-testid={`gran-${g}`} onClick={() => setGranularity(g)} className={`h-9 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${granularity === g ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>{g}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <MiniStat label="Revenue" value={analytics ? `₹${(analytics.total_revenue || 0).toLocaleString("en-IN")}` : "—"} testid="ms-revenue" tint="text-accent" />
            <MiniStat label="Footfall" value={analytics?.total_footfall ?? "—"} testid="ms-footfall" tint="text-secondary" />
            <MiniStat label="Avg. bill" value={analytics ? `₹${(analytics.average_bill || 0).toLocaleString("en-IN")}` : "—"} testid="ms-avg" />
            <MiniStat label="Unique customers" value={analytics?.unique_customers ?? "—"} testid="ms-uniq" />
          </div>

          <div className="h-72">
            {analyticsBusy && !analytics ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : analytics?.trend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(204 100% 90%)" />
                  <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => granularity === "day" ? d.slice(5) : d} />
                  <YAxis fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(v, name) => name === "revenue" ? `₹${Number(v).toLocaleString("en-IN")}` : v} labelClassName="font-bold" />
                  <Bar dataKey="revenue" fill="hsl(28 100% 49%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data in this range</div>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl" data-testid="sales-mix-card">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Sales mix</div>
            <h3 className="text-xl font-black">Packages vs Games</h3>
            <p className="text-xs text-muted-foreground mt-1">{from} → {to}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 rounded-2xl bg-accent/10 border-2 border-accent/30" data-testid="metric-packages-sold">
              <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center mb-3">
                <PackageIcon className="h-5 w-5" />
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Packages sold</div>
              <div className="text-3xl font-black tabular-nums mt-1">{analytics?.total_packages_sold ?? "—"}</div>
              <div className="text-xs font-bold text-accent mt-1">₹{Number(analytics?.packages_revenue || 0).toLocaleString("en-IN")}</div>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/10 border-2 border-secondary/30" data-testid="metric-games-played">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center mb-3">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Games / activities played</div>
              <div className="text-3xl font-black tabular-nums mt-1">{analytics?.total_games_played ?? "—"}</div>
              <div className="text-xs font-bold text-secondary mt-1">₹{Number(analytics?.games_revenue || 0).toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="h-40">
            {analytics?.trend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(204 100% 90%)" />
                  <XAxis dataKey="date" fontSize={10} tickFormatter={(d) => granularity === "day" ? d.slice(5) : d} />
                  <YAxis fontSize={10} allowDecimals={false} />
                  <Tooltip labelClassName="font-bold" />
                  <Bar dataKey="packages_sold" stackId="a" fill="hsl(28 100% 49%)" radius={[0,0,0,0]} name="Packages" />
                  <Bar dataKey="games_played" stackId="a" fill="hsl(204 100% 45%)" radius={[4,4,0,0]} name="Games" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No sales in this range</div>
            )}
          </div>

          {(analytics?.top_packages?.length || analytics?.top_games?.length) ? (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div data-testid="top-packages-list">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Top packages</div>
                <ul className="space-y-1.5">
                  {(analytics?.top_packages || []).slice(0,3).map((p) => (
                    <li key={p.name} className="flex items-center justify-between text-xs">
                      <span className="font-bold truncate mr-2">{p.name}</span>
                      <span className="font-black text-accent tabular-nums">{p.count}</span>
                    </li>
                  ))}
                  {!(analytics?.top_packages?.length) && <li className="text-xs text-muted-foreground">—</li>}
                </ul>
              </div>
              <div data-testid="top-games-list">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Top games</div>
                <ul className="space-y-1.5">
                  {(analytics?.top_games || []).slice(0,3).map((g) => (
                    <li key={g.name} className="flex items-center justify-between text-xs">
                      <span className="font-bold truncate mr-2">{g.name}</span>
                      <span className="font-black text-secondary tabular-nums">{g.count}</span>
                    </li>
                  ))}
                  {!(analytics?.top_games?.length) && <li className="text-xs text-muted-foreground">—</li>}
                </ul>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      {/* Google Reviews */}
      <Card className="p-6 rounded-2xl mt-6" data-testid="google-reviews-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 48 48" width="26" height="26"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Google Reviews</div>
                <h3 className="text-xl font-black">Ratings aur customer voice</h3>
              </div>
            </div>
            {settings?.google_rating > 0 || settings?.google_reviews_shown > 0 ? (
              <div className="flex items-center gap-6 my-4">
                <div>
                  <div className="text-4xl font-black tracking-tight">{Number(settings?.google_rating || 0).toFixed(1)}</div>
                  <div className="flex gap-0.5 mt-1" data-testid="stars">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`h-4 w-4 ${n <= Math.round(settings?.google_rating || 0) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-secondary">{settings?.google_reviews_shown || 0}</div>
                  <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Total reviews</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">Google Business ka review link Settings me daalo — bills par QR aur customers ka feedback yahaan track karo.</p>
            )}
            {reviewUrl ? (
              <div className="flex flex-wrap gap-2 mt-4">
                <a href={reviewUrl} target="_blank" rel="noreferrer"><Button data-testid="dash-review-open" size="sm" className="rounded-full bg-accent hover:bg-accent/90 font-bold"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Open on Google</Button></a>
                <Button data-testid="dash-review-copy" size="sm" variant="outline" onClick={copyReview} className="rounded-full font-bold"><Copy className="h-3.5 w-3.5 mr-1" /> Copy Review Link</Button>
                <Link to="/settings"><Button size="sm" variant="ghost" className="rounded-full font-bold">Update rating</Button></Link>
              </div>
            ) : (
              <Link to="/settings"><Button data-testid="dash-review-setup" size="sm" className="rounded-full mt-4 bg-accent hover:bg-accent/90 font-bold">Setup Google Review Link →</Button></Link>
            )}
          </div>
          <div className="flex flex-col items-center">
            {reviewUrl ? (
              <>
                <div className="p-3 bg-white rounded-2xl border-2 border-primary shadow-sm">
                  <QRCode value={reviewUrl} size={140} />
                </div>
                <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-2">Scan to review</div>
              </>
            ) : (
              <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground text-center p-4">QR yahaan generate hoga jab review link daaloge</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, tint, label, value, testid }) {
  return (
    <Card className="p-6 rounded-2xl border-border hover:shadow-md transition-shadow" data-testid={testid}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-black tracking-tight">{value}</div>
    </Card>
  );
}

function MiniStat({ label, value, testid, tint }) {
  return (
    <div className="p-3 bg-muted rounded-xl" data-testid={testid}>
      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
      <div className={`text-lg font-black mt-0.5 tabular-nums ${tint || ""}`}>{value}</div>
    </div>
  );
}
