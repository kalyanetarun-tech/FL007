import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { inr } from "@/lib/api";
import { Wallet, Users, MessageSquare, Receipt, TrendingUp, Trophy } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { Star, Copy, ExternalLink } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.get("/dashboard/stats").then((r) => mounted && setStats(r.data)).catch(() => mounted && setError(true));
    api.get("/settings").then((r) => mounted && setSettings(r.data)).catch(() => {});
    return () => { mounted = false; };
  }, []);

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
        <Card className="lg:col-span-2 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Last 7 days</div>
              <h3 className="text-xl font-black">Revenue trend</h3>
            </div>
            <TrendingUp className="text-secondary h-6 w-6" />
          </div>
          <div className="h-64">
            {stats?.revenue_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenue_trend}>
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v) => inr(v)} />
                  <Bar dataKey="revenue" fill="hsl(28 100% 49%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Top games</div>
              <h3 className="text-xl font-black">Popular rides</h3>
            </div>
            <Trophy className="text-primary h-6 w-6" />
          </div>
          {stats?.top_games?.length ? (
            <ul className="space-y-3" data-testid="top-games-list">
              {stats.top_games.map((g, i) => (
                <li key={g.name} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-accent text-accent-foreground font-black text-sm flex items-center justify-center">{i + 1}</span>
                    <span className="font-bold">{g.name}</span>
                  </div>
                  <span className="text-sm font-bold text-secondary">{g.count} plays</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground text-sm py-8 text-center">No plays logged yet.</div>
          )}
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
